# Pintu Server

FastAPI backend for the Pintu design application with image processing capabilities.

## Features

- **Background Removal**: Remove backgrounds from images using AI (rembg)
- **Image Processing**: Advanced image manipulation with OpenCV and Pillow
- **CORS Support**: Configured for frontend development
- **Health Monitoring**: Health check endpoints
- **File Upload**: Support for multiple image formats

## Quick Start

### Option 1: Using the startup script (Recommended)

**Windows:**
```bash
./run.bat
```

**Unix/Linux/macOS:**
```bash
chmod +x run.sh
./run.sh
```

### Option 2: Manual setup

1. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Run the server:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### Health Check
```
GET /health
Response: {"status": "ok"}
```

### Background Removal
```
POST /remove-bg
Content-Type: multipart/form-data
Body: file (image file)
Response: PNG image with transparent background
```

### Root Information
```
GET /
Response: API information and available endpoints
```

## API Documentation

Once the server is running, visit:
- **Interactive API Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## Dependencies

- **FastAPI**: Modern web framework for APIs
- **Uvicorn**: ASGI server for running FastAPI
- **Pillow**: Image processing library
- **rembg**: AI-powered background removal
- **OpenCV**: Computer vision and image processing
- **SQLModel**: Database ORM (for future features)
- **python-multipart**: File upload support

## Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## Development

The server runs with auto-reload enabled in development mode. Any changes to the code will automatically restart the server.

## Image Processing Pipeline

1. **Upload Validation**: Checks file type and size
2. **Format Conversion**: Ensures RGB format for processing
3. **Background Removal**: Uses rembg AI model
4. **Alpha Channel Smoothing**: Reduces jagged edges
5. **PNG Output**: Returns optimized PNG with transparency

## Error Handling

- **400**: Invalid file format or size
- **413**: File too large (max 10MB)
- **500**: Processing errors

## Testing

### Running Tests

**Quick test run:**
```bash
# Windows
./run_tests.bat

# Unix/Linux/macOS
chmod +x run_tests.sh
./run_tests.sh
```

**Test with coverage:**
```bash
./run_tests.sh coverage
```

**Run specific test:**
```bash
./run_tests.sh specific TestRemoveBackground::test_remove_bg_success_png
```

**Manual pytest execution:**
```bash
# After activating virtual environment
pytest tests/ -v
pytest tests/test_remove_bg.py -v
pytest tests/test_remove_bg.py::TestRemoveBackground::test_remove_bg_success_png -v
```

### Test Structure

```
tests/
├── __init__.py
├── conftest.py              # Shared fixtures
├── create_assets.py         # Generate test images
├── test_remove_bg.py        # Main API tests
└── assets/                  # Test image files
    ├── test_image.png       # 50x50 RGB test image
    ├── test_image.jpg       # JPEG version
    ├── test_image_rgba.png  # RGBA with transparency
    ├── tiny_image.png       # 5x5 for size validation
    └── not_an_image.txt     # Invalid file type
```

### Test Coverage

The test suite covers:

- ✅ **Successful background removal** (PNG, JPEG, WEBP, BMP)
- ✅ **File validation** (type, size, dimensions)
- ✅ **Error handling** (corrupted files, invalid formats)
- ✅ **Edge cases** (empty files, huge files, tiny images)
- ✅ **Response validation** (headers, content type, filenames)
- ✅ **Different image modes** (RGB, RGBA, grayscale)
- ✅ **API documentation** accessibility
- ✅ **Integration tests** for full workflow
