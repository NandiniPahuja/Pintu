# PixMorph AI Service

AI-powered image processing service combining SAM (Segment Anything Model), Pix2Struct, and OCR for intelligent design element extraction.

## Features

- 🎯 **SAM Segmentation**: Detect and segment all visual elements
- 📐 **Pix2Struct Layout**: Analyze image structure and hierarchy
- 📝 **OCR**: Extract text with PaddleOCR or Tesseract
- 🎨 **Color Extraction**: Extract dominant color palettes
- 🔄 **Unified Processing**: Combine all outputs into editable layers

## Architecture

```
Image Upload
    ↓
SAM Segmentation → Detect shapes, objects, regions
    ↓
Pix2Struct Analysis → Understand layout structure
    ↓
OCR Text Extraction → Extract all text content
    ↓
Layer Matching → Match segments with text
    ↓
Color Extraction → Extract color palette
    ↓
Editable Layers (JSON) → Ready for canvas rendering
```

## Installation

### Prerequisites

- Python 3.8+
- CUDA-capable GPU (optional, but recommended)
- 8GB+ RAM (16GB recommended)

### Setup

1. **Create virtual environment**

```powershell
cd ai-services
python -m venv venv
.\venv\Scripts\activate
```

2. **Install dependencies**

```powershell
pip install -r requirements.txt
```

**Note**: Installing dependencies may take 10-15 minutes due to large ML packages.

3. **Configure environment**

```powershell
cp .env.example .env
```

Edit `.env` to customize settings if needed.

4. **Create required directories**

```powershell
mkdir models
mkdir uploads
```

## Usage

### Start the server

```powershell
python app.py
```

The service will:
- Auto-detect CUDA/CPU
- Download SAM model on first run (~2.4GB)
- Download Pix2Struct model on first run (~1.5GB)
- Start Flask server on `http://localhost:5000`

### API Endpoints

#### 1. **Complete Processing** (Recommended)

```bash
POST /api/image/process
Content-Type: multipart/form-data
Body: image (file)
```

Returns editable layers with all information.

**Response:**
```json
{
  "success": true,
  "data": {
    "layers": [
      {
        "id": "segment_0",
        "type": "text",
        "bbox": {"x": 100, "y": 50, "width": 200, "height": 40},
        "content": "Hello World",
        "text": {
          "content": "Hello World",
          "font_size": 24,
          "font_family": "Arial",
          "color": "#000000",
          "bold": false,
          "italic": false
        },
        "editable": true
      }
    ],
    "color_palette": [...],
    "layout": {...},
    "total_segments": 15,
    "total_text_elements": 5
  }
}
```

#### 2. **Segmentation Only**

```bash
POST /api/image/segment
```

Returns only SAM segmentation results.

#### 3. **OCR Only**

```bash
POST /api/image/ocr
```

Returns only text extraction results.

#### 4. **Layout Analysis Only**

```bash
POST /api/image/layout
```

Returns only Pix2Struct layout analysis.

#### 5. **Color Extraction Only**

```bash
POST /api/image/colors
```

Returns only color palette.

#### 6. **Health Check**

```bash
GET /api/image/health
```

Check service status.

## Configuration

Edit `.env` file:

### OCR Backend

```env
# Use PaddleOCR (recommended)
OCR_BACKEND=paddleocr

# Or use Tesseract
OCR_BACKEND=tesseract
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

### SAM Model Size

Choose model size based on your needs:

```env
# Highest accuracy, slower (default)
SAM_CHECKPOINT=sam_vit_h_4b8939.pth
SAM_MODEL_TYPE=vit_h

# Balanced
SAM_CHECKPOINT=sam_vit_l_0b3195.pth
SAM_MODEL_TYPE=vit_l

# Fastest, smaller
SAM_CHECKPOINT=sam_vit_b_01ec64.pth
SAM_MODEL_TYPE=vit_b
```

### GPU/CPU

```env
# Auto-detect (default)
# DEVICE=

# Force CUDA
DEVICE=cuda

# Force CPU
DEVICE=cpu
```

## Testing

### Test with cURL

```powershell
curl -X POST http://localhost:5000/api/image/process `
  -F "image=@test_image.jpg"
```

### Test with Python

```python
import requests

url = 'http://localhost:5000/api/image/process'
files = {'image': open('test_image.jpg', 'rb')}

response = requests.post(url, files=files)
data = response.json()

print(f"Found {len(data['data']['layers'])} layers")
```

## Performance

### Model Loading Times (first run)

- SAM download: ~5 minutes
- Pix2Struct download: ~2 minutes
- Model loading: ~10-30 seconds

### Processing Times (after loading)

**GPU (RTX 3060)**:
- Small image (800x600): ~2-3 seconds
- Medium image (1920x1080): ~4-6 seconds
- Large image (3840x2160): ~8-12 seconds

**CPU**:
- Small image: ~8-15 seconds
- Medium image: ~15-30 seconds
- Large image: ~30-60 seconds

## Troubleshooting

### CUDA Out of Memory

Reduce image size:
```env
MAX_IMAGE_SIZE=1024
```

### Slow Processing

1. Use smaller SAM model (vit_b)
2. Reduce image size
3. Use GPU if available

### Import Errors

```powershell
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

### Tesseract Not Found

Install Tesseract:
```powershell
# Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
# Then set path in .env
```

## Development

### Project Structure

```
ai-services/
├── app/
│   ├── config.py              # Configuration
│   ├── routes/
│   │   └── image_routes.py    # API endpoints
│   ├── services/
│   │   ├── sam_service.py     # SAM integration
│   │   ├── pix2struct_service.py  # Pix2Struct
│   │   ├── ocr_service.py     # OCR
│   │   └── processor.py       # Unified pipeline
│   └── utils/
│       └── helpers.py         # Helper functions
├── models/                    # Downloaded models
├── uploads/                   # Temporary uploads
├── app.py                    # Main Flask app
├── requirements.txt          # Dependencies
└── .env                     # Configuration
```

### Adding New Features

1. Add service in `app/services/`
2. Register route in `app/routes/`
3. Update processor in `processor.py`

## License

MIT License - Part of PixMorph project

## Credits

- **SAM**: Meta AI Research
- **Pix2Struct**: Google Research
- **PaddleOCR**: PaddlePaddle
