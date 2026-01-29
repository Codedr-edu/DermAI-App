"""
ConvNeXt Model Converter: PyTorch → ONNX → TensorFlow Lite
Converts the trained ConvNeXt-tiny model for mobile deployment
"""

import torch
import torch.nn as nn
from torchvision import models
import onnx
import tensorflow as tf
from onnx_tf.backend import prepare
import numpy as np

# =========================================================
# CONFIGURATION (Extracted from training script)
# =========================================================
MODEL_PATH = r"C:\Users\anhhu\Desktop\DermAI-SCIN\best_convnext_weighted.pth"
OUTPUT_DIR = r"C:\Users\anhhu\Desktop\DermAI-App\DermAI-App\assets\model"

IMG_SIZE = 300
# Normalization values (ImageNet pretrained)
MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]

# =========================================================
# STEP 1: Load PyTorch Model
# =========================================================
def load_pytorch_model(checkpoint_path):
    """Load the trained ConvNeXt model from checkpoint"""
    print("📦 Loading checkpoint...")
    checkpoint = torch.load(checkpoint_path, map_location='cpu')
    
    # Extract information
    classes = checkpoint['classes']
    num_classes = len(classes)
    
    print(f"✅ Found {num_classes} classes:")
    for i, cls_name in enumerate(classes):
        print(f"   {i:2d}: {cls_name}")
    
    # Rebuild model architecture (must match training architecture)
    model = models.convnext_tiny(weights=None)  # No pretrained weights
    in_f = model.classifier[2].in_features
    
    # Custom classifier head (same as training)
    model.classifier[2] = nn.Sequential(
        nn.Linear(in_f, 512),
        nn.LayerNorm(512),
        nn.GELU(),
        nn.Dropout(0.4),
        nn.Linear(512, num_classes)
    )
    
    # Load trained weights
    model.load_state_dict(checkpoint['model'])
    model.eval()
    
    print(f"✅ Model loaded successfully!")
    return model, classes

# =========================================================
# STEP 2: Export to ONNX
# =========================================================
def export_to_onnx(model, output_path="model.onnx"):
    """Convert PyTorch model to ONNX format"""
    print("\n🔄 Exporting to ONNX...")
    
    # Create dummy input (batch_size=1, channels=3, height=300, width=300)
    dummy_input = torch.randn(1, 3, IMG_SIZE, IMG_SIZE)
    
    # Export with dynamic batch size
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'}
        }
    )
    
    # Verify ONNX model
    onnx_model = onnx.load(output_path)
    onnx.checker.check_model(onnx_model)
    
    print(f"✅ ONNX model saved to: {output_path}")
    return output_path

# =========================================================
# STEP 3: Convert ONNX to TensorFlow
# =========================================================
def onnx_to_tensorflow(onnx_path, tf_output_dir="model_tf"):
    """Convert ONNX model to TensorFlow SavedModel"""
    print("\n🔄 Converting ONNX to TensorFlow...")
    
    onnx_model = onnx.load(onnx_path)
    tf_rep = prepare(onnx_model)
    tf_rep.export_graph(tf_output_dir)
    
    print(f"✅ TensorFlow model saved to: {tf_output_dir}")
    return tf_output_dir

# =========================================================
# STEP 4: Convert TensorFlow to TFLite
# =========================================================
def tensorflow_to_tflite(tf_model_path, output_path="dermai_model.tflite", quantize=True):
    """Convert TensorFlow SavedModel to TFLite with optional quantization"""
    print("\n🔄 Converting to TensorFlow Lite...")
    
    converter = tf.lite.TFLiteConverter.from_saved_model(tf_model_path)
    
    if quantize:
        print("   🔹 Applying dynamic range quantization...")
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        # Optional: For even smaller size, use float16 quantization
        # converter.target_spec.supported_types = [tf.float16]
    
    tflite_model = converter.convert()
    
    with open(output_path, 'wb') as f:
        f.write(tflite_model)
    
    # Get file size
    size_mb = len(tflite_model) / (1024 * 1024)
    print(f"✅ TFLite model saved to: {output_path}")
    print(f"   📊 Model size: {size_mb:.2f} MB")
    
    return output_path

# =========================================================
# STEP 5: Validate Conversion
# =========================================================
def validate_conversion(pytorch_model, tflite_path, classes):
    """Compare outputs between PyTorch and TFLite models"""
    print("\n🧪 Validating conversion...")
    
    # Create random test input
    test_input = torch.randn(1, 3, IMG_SIZE, IMG_SIZE)
    
    # PyTorch inference
    with torch.no_grad():
        pytorch_output = pytorch_model(test_input)
        pytorch_probs = torch.softmax(pytorch_output, dim=1).numpy()
    
    # TFLite inference
    interpreter = tf.lite.Interpreter(model_path=tflite_path)
    interpreter.allocate_tensors()
    
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    
    # Convert PyTorch tensor to numpy and set as input
    tflite_input = test_input.numpy().astype(np.float32)
    interpreter.set_tensor(input_details[0]['index'], tflite_input)
    interpreter.invoke()
    
    tflite_output = interpreter.get_tensor(output_details[0]['index'])
    tflite_probs = tf.nn.softmax(tflite_output).numpy()
    
    # Compare results
    diff = np.abs(pytorch_probs - tflite_probs)
    max_diff = np.max(diff)
    mean_diff = np.mean(diff)
    
    print(f"   📊 Max probability difference: {max_diff:.6f}")
    print(f"   📊 Mean probability difference: {mean_diff:.6f}")
    
    if max_diff < 0.01:
        print("   ✅ Conversion validated! Outputs are very similar.")
    elif max_diff < 0.05:
        print("   ⚠️  Minor differences detected (acceptable for mobile)")
    else:
        print("   ❌ Significant differences! Please review conversion.")
    
    # Show top predictions from both models
    pytorch_top = pytorch_probs[0].argsort()[-3:][::-1]
    tflite_top = tflite_probs[0].argsort()[-3:][::-1]
    
    print("\n   Top 3 predictions (PyTorch):")
    for idx in pytorch_top:
        print(f"      {classes[idx]}: {pytorch_probs[0][idx]:.4f}")
    
    print("\n   Top 3 predictions (TFLite):")
    for idx in tflite_top:
        print(f"      {classes[idx]}: {tflite_probs[0][idx]:.4f}")

# =========================================================
# STEP 6: Save Metadata
# =========================================================
def save_metadata(classes, output_path="model_metadata.json"):
    """Save model metadata for React Native app"""
    import json
    
    metadata = {
        "input_size": IMG_SIZE,
        "mean": MEAN,
        "std": STD,
        "num_classes": len(classes),
        "classes": classes,
        "model_type": "ConvNeXt-Tiny",
        "framework": "TensorFlow Lite"
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Metadata saved to: {output_path}")

# =========================================================
# MAIN EXECUTION
# =========================================================
if __name__ == "__main__":
    import os
    
    print("=" * 60)
    print("🚀 DermAI Model Conversion Pipeline")
    print("   PyTorch → ONNX → TensorFlow → TFLite")
    print("=" * 60)
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    try:
        # Step 1: Load PyTorch model
        model, classes = load_pytorch_model(MODEL_PATH)
        
        # Step 2: Export to ONNX
        onnx_path = os.path.join(OUTPUT_DIR, "model.onnx")
        export_to_onnx(model, onnx_path)
        
        # Step 3: Convert to TensorFlow
        tf_path = os.path.join(OUTPUT_DIR, "model_tf")
        onnx_to_tensorflow(onnx_path, tf_path)
        
        # Step 4: Convert to TFLite
        tflite_path = os.path.join(OUTPUT_DIR, "dermai_model.tflite")
        tensorflow_to_tflite(tf_path, tflite_path, quantize=True)
        
        # Step 5: Validate conversion
        validate_conversion(model, tflite_path, classes)
        
        # Step 6: Save metadata
        metadata_path = os.path.join(OUTPUT_DIR, "model_metadata.json")
        save_metadata(classes, metadata_path)
        
        print("\n" + "=" * 60)
        print("✅ CONVERSION COMPLETE!")
        print("=" * 60)
        print(f"\n📁 Output files:")
        print(f"   • ONNX:     {onnx_path}")
        print(f"   • TFLite:   {tflite_path}")
        print(f"   • Metadata: {metadata_path}")
        print(f"\n📋 Next steps:")
        print(f"   1. Copy {tflite_path} to your React Native project")
        print(f"   2. Copy {metadata_path} for reference")
        print(f"   3. Proceed with React Native implementation")
        
    except Exception as e:
        print(f"\n❌ Error during conversion: {str(e)}")
        import traceback
        traceback.print_exc()
