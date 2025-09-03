#!/usr/bin/env python3
"""
MobileSAM Model Download Script

This script downloads the required MobileSAM models for image segmentation.
Run this script after installing the Python dependencies to set up the models.
"""

import os
import urllib.request
import sys
from pathlib import Path

# Model URLs and information
MODELS = {
    "mobile_sam_encoder.onnx": {
        "url": "https://github.com/ChaoningZhang/MobileSAM/releases/download/v1.0/mobile_sam_encoder.onnx",
        "size_mb": "~40MB",
        "description": "MobileSAM image encoder (ONNX format for CPU optimization)"
    },
    "mobile_sam_decoder.onnx": {
        "url": "https://github.com/ChaoningZhang/MobileSAM/releases/download/v1.0/mobile_sam_decoder.onnx", 
        "size_mb": "~4MB",
        "description": "MobileSAM mask decoder (ONNX format)"
    },
    "mobile_sam.pt": {
        "url": "https://github.com/ChaoningZhang/MobileSAM/releases/download/v1.0/mobile_sam.pt",
        "size_mb": "~40MB",
        "description": "MobileSAM PyTorch model (fallback option)"
    }
}

def create_models_directory():
    """Create the models directory if it doesn't exist"""
    models_dir = Path(__file__).parent / "app" / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    return models_dir

def download_model(filename, model_info, models_dir):
    """Download a specific model file"""
    file_path = models_dir / filename
    
    if file_path.exists():
        print(f"✓ {filename} already exists, skipping download")
        return True
    
    print(f"📥 Downloading {filename} ({model_info['size_mb']})...")
    print(f"   {model_info['description']}")
    print(f"   URL: {model_info['url']}")
    
    try:
        # Create a simple progress indicator
        def progress_hook(block_num, block_size, total_size):
            if total_size > 0:
                percent = min(100, (block_num * block_size * 100) // total_size)
                sys.stdout.write(f"\r   Progress: {percent}%")
                sys.stdout.flush()
        
        urllib.request.urlretrieve(model_info['url'], file_path, progress_hook)
        print(f"\n✓ Successfully downloaded {filename}")
        return True
        
    except Exception as e:
        print(f"\n❌ Failed to download {filename}: {e}")
        # Clean up partial download
        if file_path.exists():
            file_path.unlink()
        return False

def verify_models(models_dir):
    """Verify that downloaded models exist and have reasonable file sizes"""
    print("\n🔍 Verifying downloaded models...")
    
    all_good = True
    for filename in MODELS.keys():
        file_path = models_dir / filename
        
        if not file_path.exists():
            print(f"❌ {filename} not found")
            all_good = False
            continue
        
        file_size = file_path.stat().st_size
        size_mb = file_size / (1024 * 1024)
        
        # Basic size validation (models should be reasonably large)
        min_size_mb = 1  # Minimum 1MB
        if size_mb < min_size_mb:
            print(f"❌ {filename} seems too small ({size_mb:.1f}MB)")
            all_good = False
        else:
            print(f"✓ {filename} ({size_mb:.1f}MB)")
    
    return all_good

def main():
    """Main function to download all MobileSAM models"""
    print("🚀 MobileSAM Model Downloader")
    print("=" * 50)
    
    # Create models directory
    models_dir = create_models_directory()
    print(f"📁 Models directory: {models_dir}")
    
    # Check available space (rough estimate)
    total_size_estimate = 90  # ~90MB for all models
    print(f"💾 Estimated download size: ~{total_size_estimate}MB")
    
    # Download models
    print("\n📥 Starting model downloads...")
    success_count = 0
    
    for filename, model_info in MODELS.items():
        if download_model(filename, model_info, models_dir):
            success_count += 1
    
    # Verify downloads
    if success_count > 0:
        models_ok = verify_models(models_dir)
        
        print(f"\n📊 Download Summary:")
        print(f"   ✓ Successfully downloaded: {success_count}/{len(MODELS)} models")
        print(f"   📁 Models location: {models_dir}")
        
        if models_ok:
            print(f"\n🎉 All models downloaded and verified successfully!")
            print(f"   You can now use the /segment endpoint for image segmentation.")
        else:
            print(f"\n⚠️  Some models may have issues. Check the verification output above.")
            return 1
    else:
        print(f"\n❌ No models were downloaded successfully.")
        print(f"   Please check your internet connection and try again.")
        return 1
    
    print(f"\n💡 Usage:")
    print(f"   Start the server: python -m uvicorn app.main:app --reload")
    print(f"   Test segmentation: POST /segment with an image file")
    
    return 0

if __name__ == "__main__":
    exit(main())
