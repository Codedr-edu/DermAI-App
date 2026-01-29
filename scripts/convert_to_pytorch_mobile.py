
import torch
from torchvision import models
import torch.nn as nn
from torch.utils.mobile_optimizer import optimize_for_mobile
import os
import json

# CONFIGURATION
MODEL_PATH = r"C:\Users\anhhu\Desktop\DermAI-SCIN\best_convnext_weighted.pth"
OUTPUT_DIR = r"C:\Users\anhhu\Desktop\DermAI-App\DermAI-App\assets\model"
IMG_SIZE = 300

def convert():
    print("📦 Loading PyTorch model...")
    checkpoint = torch.load(MODEL_PATH, map_location='cpu')
    classes = checkpoint['classes']
    num_classes = len(classes)

    # Rebuild model architecture
    model = models.convnext_tiny(weights=None)
    in_f = model.classifier[2].in_features
    model.classifier[2] = nn.Sequential(
        nn.Linear(in_f, 512),
        nn.LayerNorm(512),
        nn.GELU(),
        nn.Dropout(0.4),
        nn.Linear(512, num_classes)
    )
    
    model.load_state_dict(checkpoint['model'])
    model.eval()

    print("🔄 Converting to TorchScript...")
    example = torch.rand(1, 3, IMG_SIZE, IMG_SIZE)
    traced_script_module = torch.jit.trace(model, example)
    
    print("🚀 Optimizing for mobile...")
    optimized_module = optimize_for_mobile(traced_script_module)
    
    # Save for mobile
    output_path = os.path.join(OUTPUT_DIR, "model.ptl")
    optimized_module._save_for_lite_interpreter(output_path)
    
    # Update metadata
    metadata = {
        "input_size": IMG_SIZE,
        "classes": classes,
        "framework": "PyTorch Mobile"
    }
    with open(os.path.join(OUTPUT_DIR, "model_metadata.json"), 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"✅ Success! Model saved to {output_path}")

if __name__ == "__main__":
    convert()
