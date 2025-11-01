# PixMorph - SAM + Pix2Struct Integration Setup Guide

This guide will help you set up the complete PixMorph system with SAM (Segment Anything Model) and Pix2Struct integration.

## 🎯 What Was Implemented

### AI Services (Python/Flask)

1. **SAM Service** (`sam_service.py`)
   - Auto-downloads pretrained SAM model (2.4GB)
   - Segments images into distinct visual elements
   - Extracts bounding boxes and masks
   - GPU acceleration support
   - Classifies segments (text, shape, icon, background)

2. **Pix2Struct Service** (`pix2struct_service.py`)
   - Uses Google's Pix2Struct model for layout analysis
   - Generates structured layout descriptions
   - Identifies visual hierarchy
   - Detects text regions and positions

3. **OCR Service** (`ocr_service.py`)
   - Supports PaddleOCR (recommended) and Tesseract
   - Extracts text with position and confidence
   - Estimates font sizes
   - Detects font colors

4. **Unified Processor** (`processor.py`)
   - Combines SAM + Pix2Struct + OCR outputs
   - Matches segments with detected text
   - Creates editable layers with complete metadata
   - Extracts color palettes

5. **Flask API** (`app.py`, `image_routes.py`)
   - RESTful endpoints for all services
   - File upload handling
   - CORS support for frontend integration

### Frontend Integration (TypeScript/React)

1. **AI Service Client** (`aiService.ts`)
   - Type-safe API client
   - All endpoints covered
   - Error handling

2. **React Hook** (`useImageProcessor.ts`)
   - Easy-to-use React hook
   - Progress tracking
   - Error management

## 📋 Installation Steps

### Step 1: Set Up AI Service

```powershell
# Navigate to ai-services directory
cd ai-services

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies (this will take 10-15 minutes)
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Create required directories
mkdir models
mkdir uploads
```

### Step 2: Configure Environment

Edit `ai-services\.env`:

```env
# Use PaddleOCR (recommended)
OCR_BACKEND=paddleocr

# Or use Tesseract (if you have it installed)
# OCR_BACKEND=tesseract
# TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe

# SAM Model (vit_h is highest quality but slower)
SAM_MODEL_TYPE=vit_h

# Device (auto-detected if not set)
# DEVICE=cuda  # Use GPU
# DEVICE=cpu   # Use CPU only
```

### Step 3: Start AI Service

```powershell
# Make sure virtual environment is activated
.\venv\Scripts\activate

# Start the Flask server
python app.py
```

**First Run**: The service will automatically download:
- SAM model (~2.4GB) - takes ~5 minutes
- Pix2Struct model (~1.5GB) - takes ~2 minutes

The service will be available at `http://localhost:5000`

### Step 4: Set Up Frontend

```powershell
# In a new terminal, navigate to client
cd client

# Copy environment file
cp .env.local.example .env.local

# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

## 🧪 Testing the Integration

### Test 1: Health Check

```powershell
curl http://localhost:5000/api/image/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "PixMorph AI Service",
  "device": "cuda",
  "ocr_backend": "paddleocr"
}
```

### Test 2: Process an Image

```powershell
# Using PowerShell
$file = Get-Item "path\to\your\image.jpg"
curl.exe -X POST http://localhost:5000/api/image/process `
  -F "image=@$($file.FullName)"
```

### Test 3: Frontend Integration

Create a test component in `client/src/app/test/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useImageProcessor } from '@/hooks/useImageProcessor';

export default function TestPage() {
  const { isProcessing, result, error, processImageFile } = useImageProcessor();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleProcess = async () => {
    if (selectedFile) {
      await processImageFile(selectedFile);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test AI Integration</h1>
      
      <input 
        type="file" 
        accept="image/*"
        onChange={handleFileChange}
        className="mb-4"
      />
      
      <button 
        onClick={handleProcess}
        disabled={!selectedFile || isProcessing}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {isProcessing ? 'Processing...' : 'Process Image'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {result && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Results:</h2>
          <p>Total Layers: {result.layers.length}</p>
          <p>Total Segments: {result.total_segments}</p>
          <p>Text Elements: {result.total_text_elements}</p>
          
          <h3 className="font-semibold mt-4">Layers:</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(result.layers, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
```

Visit `http://localhost:3000/test` to test the integration.

## 📊 API Response Structure

When you call `processImage()`, you get:

```typescript
{
  layers: [
    {
      id: "segment_0",
      type: "text",
      bbox: { x: 100, y: 50, width: 200, height: 40 },
      center: { x: 200, y: 70 },
      content: "Hello World",
      text: {
        content: "Hello World",
        font_size: 24,
        font_family: "Arial",
        color: "#000000",
        bold: false,
        italic: false,
        underline: false,
        align: "center"
      },
      editable: true,
      locked: false,
      visible: true,
      confidence: 0.95
    },
    {
      id: "segment_1",
      type: "shape",
      bbox: { x: 50, y: 100, width: 300, height: 200 },
      style: {
        fill_color: "#FF5733",
        stroke_color: null,
        stroke_width: 0
      },
      mask: [[0, 1, 1, ...], ...],  // Binary mask
      editable: true,
      locked: false,
      visible: true
    }
  ],
  color_palette: [
    { id: "color_0", hex: "#FF5733", rgb: {r: 255, g: 87, b: 51}, name: "red" },
    { id: "color_1", hex: "#000000", rgb: {r: 0, g: 0, b: 0}, name: "black" }
  ],
  layout: { /* Pix2Struct analysis */ },
  image_size: { width: 1920, height: 1080 },
  total_segments: 15,
  total_text_elements: 5
}
```

## 🎨 Integration with Canvas Editor

To use the results in your canvas editor:

```typescript
import { processImage, Layer } from '@/lib/aiService';
import { fabric } from 'fabric';

async function loadImageToCanvas(file: File, canvas: fabric.Canvas) {
  // Process image
  const result = await processImage(file);
  
  // Add layers to canvas
  result.layers.forEach(layer => {
    if (layer.type === 'text' && layer.text) {
      // Create text object
      const text = new fabric.Textbox(layer.text.content, {
        left: layer.bbox.x,
        top: layer.bbox.y,
        width: layer.bbox.width,
        fontSize: layer.text.font_size,
        fontFamily: layer.text.font_family,
        fill: layer.text.color,
        fontWeight: layer.text.bold ? 'bold' : 'normal',
        fontStyle: layer.text.italic ? 'italic' : 'normal',
        underline: layer.text.underline,
        textAlign: layer.text.align,
      });
      canvas.add(text);
    } else if (layer.type === 'shape' && layer.style) {
      // Create shape (you'll need to implement based on mask)
      const rect = new fabric.Rect({
        left: layer.bbox.x,
        top: layer.bbox.y,
        width: layer.bbox.width,
        height: layer.bbox.height,
        fill: layer.style.fill_color,
      });
      canvas.add(rect);
    }
  });
  
  canvas.renderAll();
}
```

## ⚙️ Performance Tips

### For Faster Processing

1. **Use smaller SAM model** (in `.env`):
   ```env
   SAM_MODEL_TYPE=vit_b  # Fastest
   ```

2. **Reduce image size** (in `.env`):
   ```env
   MAX_IMAGE_SIZE=1024  # Default is 2048
   ```

3. **Use GPU if available**:
   - Install CUDA toolkit
   - Install PyTorch with CUDA support
   - Service will auto-detect GPU

### For Better Accuracy

1. **Use largest SAM model**:
   ```env
   SAM_MODEL_TYPE=vit_h  # Highest quality
   ```

2. **Keep original image size**:
   ```env
   MAX_IMAGE_SIZE=4096
   ```

## 🐛 Troubleshooting

### "Import could not be resolved" errors

These are just linting errors - they'll resolve once you install the packages. Ignore them for now.

### CUDA errors

If you don't have a GPU, set:
```env
DEVICE=cpu
```

### Port already in use

Change the port in `ai-services/.env`:
```env
PORT=5001
```

And update frontend `client/.env.local`:
```env
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:5001
```

### Models not downloading

Manually download from:
- SAM: https://github.com/facebookresearch/segment-anything#model-checkpoints
- Place in `ai-services/models/` directory

## 🚀 Next Steps

1. **Install dependencies** in both ai-services and client
2. **Start AI service** first, wait for models to download
3. **Start frontend** in a separate terminal
4. **Test the integration** with the test page
5. **Integrate into your canvas editor**

## 📚 Additional Resources

- [SAM Documentation](https://segment-anything.com/)
- [Pix2Struct Paper](https://arxiv.org/abs/2210.03347)
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)
- [Flask Documentation](https://flask.palletsprojects.com/)

---

**Need help?** Check the README files in:
- `ai-services/README.md` for backend details
- Main project README for overall architecture
