"""
ExecuTorch Model Converter with XNNPACK Acceleration
Converts the trained ConvNeXt-tiny model to ExecuTorch .pte format with XNNPACK delegate
for optimized CPU inference on mobile devices.

Usage:
    pip install torch torchvision executorch
    python export_xnnpack.py
"""

import torch
import torch.nn as nn
from torchvision import models
from torch.export import export
from executorch.exir import to_edge_transform_and_lower
from executorch.backends.xnnpack.partition.xnnpack_partitioner import XnnpackPartitioner

# =========================================================
# CONFIGURATION
# =========================================================
MODEL_PATH = r"C:\Users\anhhu\Desktop\DermAI-SCIN\best_convnext_weighted.pth"
OUTPUT_PATH = r"C:\Users\anhhu\Desktop\DermAI-App\DermAI-App\assets\model\skin_convnext_xnnpack.pte"
IMG_SIZE = 300


def load_pytorch_model(checkpoint_path):
    """Load the trained ConvNeXt model from checkpoint"""
    print("📦 Loading PyTorch checkpoint...")
    checkpoint = torch.load(checkpoint_path, map_location='cpu', weights_only=False)
    
    classes = checkpoint['classes']
    num_classes = len(classes)
    print(f"✅ Found {num_classes} classes")
    
    # Rebuild model architecture
    model = models.convnext_tiny(weights=None)
    in_f = model.classifier[2].in_features
    
    # Custom classifier head (same as training)
    model.classifier[2] = nn.Sequential(
        nn.Linear(in_f, 512),
        nn.LayerNorm(512),
        nn.GELU(),
        nn.Dropout(0.4),
        nn.Linear(512, num_classes)
    )
    
    model.load_state_dict(checkpoint['model'])
    model.eval()
    
    print("✅ Model loaded successfully!")
    return model, classes


def export_with_xnnpack(model, output_path):
    """Export model to ExecuTorch with XNNPACK delegation"""
    print("\n🔄 Exporting with XNNPACK acceleration...")
    
    # Create example input
    example_inputs = (torch.randn(1, 3, IMG_SIZE, IMG_SIZE),)
    
    # Step 1: Export to ExportedProgram
    print("   [1/3] Exporting to graph representation...")
    exported_program = export(model, example_inputs)
    
    # Step 2: Lower to Edge with XNNPACK partitioner
    print("   [2/3] Lowering to edge with XNNPACK delegation...")
    edge_program = to_edge_transform_and_lower(
        exported_program,
        partitioner=[XnnpackPartitioner()]  # Enable XNNPACK acceleration
    )
    
    # Step 3: Convert to ExecuTorch program
    print("   [3/3] Converting to ExecuTorch program...")
    executorch_program = edge_program.to_executorch()
    
    # Save the model
    with open(output_path, "wb") as f:
        f.write(executorch_program.buffer)
    
    # Get file size
    import os
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"\n✅ XNNPACK-optimized model saved to: {output_path}")
    print(f"   📊 Model size: {size_mb:.2f} MB")
    
    return output_path


if __name__ == "__main__":
    print("=" * 60)
    print("🚀 ExecuTorch XNNPACK Model Export")
    print("   Optimized for mobile CPU inference")
    print("=" * 60)
    
    try:
        # Load model
        model, classes = load_pytorch_model(MODEL_PATH)
        
        # Export with XNNPACK
        export_with_xnnpack(model, OUTPUT_PATH)
        
        print("\n" + "=" * 60)
        print("✅ EXPORT COMPLETE!")
        print("=" * 60)
        print("\n📋 Next steps:")
        print("   1. Replace skin_convnext.pte with skin_convnext_xnnpack.pte")
        print("   2. Update ModelService.ts to load the new model")
        print("   3. Test inference speed improvement")
        
    except Exception as e:
        print(f"\n❌ Error during export: {str(e)}")
        import traceback
        traceback.print_exc()
