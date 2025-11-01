"""
Check which dependencies are installed
"""
import sys

required_packages = {
    'flask': 'Flask web framework',
    'flask_cors': 'CORS support',
    'torch': 'PyTorch',
    'torchvision': 'PyTorch vision',
    'transformers': 'Hugging Face Transformers (Pix2Struct)',
    'cv2': 'OpenCV',
    'PIL': 'Pillow (PIL)',
    'numpy': 'NumPy',
    'dotenv': 'python-dotenv',
    'pydantic': 'Pydantic',
    'colorthief': 'ColorThief',
}

optional_packages = {
    'segment_anything': 'SAM (Segment Anything)',
    'paddleocr': 'PaddleOCR',
    'pytesseract': 'Tesseract',
    'scipy': 'SciPy',
    'sklearn': 'scikit-learn',
    'timm': 'PyTorch Image Models',
}

print("="*60)
print("📦 PixMorph AI Service - Dependency Check")
print("="*60)
print()

print("Required Packages:")
print("-" * 60)
installed_count = 0
for package, description in required_packages.items():
    try:
        __import__(package)
        print(f"✅ {package:20} - {description}")
        installed_count += 1
    except ImportError:
        print(f"❌ {package:20} - {description} (NOT INSTALLED)")

print()
print("Optional Packages:")
print("-" * 60)
optional_count = 0
for package, description in optional_packages.items():
    try:
        __import__(package)
        print(f"✅ {package:20} - {description}")
        optional_count += 1
    except ImportError:
        print(f"⚠️  {package:20} - {description} (NOT INSTALLED)")

print()
print("="*60)
print(f"Summary: {installed_count}/{len(required_packages)} required packages installed")
print(f"         {optional_count}/{len(optional_packages)} optional packages installed")
print("="*60)

if installed_count == len(required_packages):
    print("✅ All required packages are installed!")
    print("🚀 You can run the full AI service now.")
else:
    print("⚠️  Some required packages are missing.")
    print("Run: .\\venv\\Scripts\\python.exe -m pip install -r requirements.txt")
