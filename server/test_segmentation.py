#!/usr/bin/env python3
"""
Test the segmentation functionality directly without running the full server
"""

import sys
import os
from pathlib import Path
from PIL import Image

# Add the app directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

def test_segmentation_fallback():
    """Test the fallback segmentation functionality"""
    print("🧪 Testing MobileSAM Segmentation Module")
    print("=" * 50)
    
    try:
        # Import the segmentation module
        from app.segmentation import get_segmenter, segment_image
        print("✓ Segmentation module imported successfully")
        
        # Get segmenter instance
        segmenter = get_segmenter()
        print("✓ Segmenter instance created")
        
        # Check if we have test images
        test_image_path = Path("tests/assets/segmentation_test.png")
        if not test_image_path.exists():
            print("❌ Test image not found, creating a simple one...")
            # Create a simple test image
            test_img = Image.new('RGB', (200, 200), 'white')
            from PIL import ImageDraw
            draw = ImageDraw.Draw(test_img)
            draw.ellipse([50, 50, 150, 150], fill='red')
            test_img.save("test_temp.png")
            test_image_path = Path("test_temp.png")
        
        # Load test image
        print(f"📁 Loading test image: {test_image_path}")
        image = Image.open(test_image_path)
        print(f"✓ Image loaded: {image.size}, mode: {image.mode}")
        
        # Run segmentation
        print("🔄 Running segmentation...")
        segments = segment_image(image)
        print(f"✓ Segmentation completed: {len(segments)} segments found")
        
        # Validate results
        for i, segment in enumerate(segments):
            print(f"  Segment {i}:")
            print(f"    ID: {segment.get('id', 'N/A')}")
            print(f"    Bbox: {segment.get('bbox', 'N/A')}")
            print(f"    Mask Area: {segment.get('maskArea', 'N/A')}")
            print(f"    PNG Base64 length: {len(segment.get('pngBase64', ''))}")
        
        print("\n🎉 Segmentation test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error during segmentation test: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_import_chain():
    """Test if all imports work correctly"""
    print("\n🧪 Testing Import Chain")
    print("=" * 30)
    
    try:
        # Test basic imports
        import numpy as np
        print("✓ NumPy imported")
        
        from PIL import Image
        print("✓ PIL imported")
        
        import cv2
        print("✓ OpenCV imported")
        
        # Test ONNX Runtime (optional)
        try:
            import onnxruntime as ort
            print("✓ ONNX Runtime available")
        except ImportError:
            print("⚠️  ONNX Runtime not available (using fallback)")
        
        # Test PyTorch (optional)
        try:
            import torch
            print("✓ PyTorch available")
        except ImportError:
            print("⚠️  PyTorch not available (using fallback)")
        
        print("✓ All basic imports successful")
        return True
        
    except Exception as e:
        print(f"❌ Import error: {e}")
        return False

def test_fastapi_imports():
    """Test if FastAPI imports work"""
    print("\n🧪 Testing FastAPI Imports")
    print("=" * 30)
    
    try:
        from app.main import app
        print("✓ FastAPI app imported")
        
        # Get routes
        routes = [route.path for route in app.routes if hasattr(route, 'path')]
        print(f"✓ Available routes: {routes}")
        
        expected_routes = ["/health", "/remove-bg", "/segment", "/"]
        for route in expected_routes:
            if route in routes:
                print(f"  ✓ {route}")
            else:
                print(f"  ❌ {route} missing")
        
        return True
        
    except Exception as e:
        print(f"❌ FastAPI import error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Pintu Server - Segmentation Testing")
    print("=" * 60)
    
    # Run all tests
    tests = [
        test_import_chain,
        test_fastapi_imports,
        test_segmentation_fallback
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            results.append(False)
    
    # Summary
    print(f"\n📊 Test Summary")
    print(f"=" * 20)
    passed = sum(results)
    total = len(results)
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed!")
        exit(0)
    else:
        print("❌ Some tests failed!")
        exit(1)
