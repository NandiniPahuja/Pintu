# PixMorph AI Integration - Quick Reference

## 🚀 Quick Start (5 Steps)

### 1. Install AI Service
```powershell
cd ai-services
.\setup-ai-service.ps1  # Or manual setup (see below)
```

### 2. Start AI Service
```powershell
cd ai-services
.\venv\Scripts\activate
python app.py
```
**First run**: Downloads ~4GB of models (5-10 minutes)

### 3. Configure Frontend
```powershell
cd client
cp .env.local.example .env.local
# Edit .env.local if AI service is not on localhost:5000
```

### 4. Start Frontend
```powershell
cd client
npm run dev
```

### 5. Test Integration
Upload an image and process it!

---

## 📡 API Endpoints

| Endpoint | Method | Purpose | Response Time |
|----------|--------|---------|---------------|
| `/api/image/process` | POST | Complete processing | 3-10s |
| `/api/image/segment` | POST | SAM only | 2-8s |
| `/api/image/ocr` | POST | OCR only | 1-3s |
| `/api/image/layout` | POST | Pix2Struct only | 1-2s |
| `/api/image/colors` | POST | Colors only | <1s |
| `/api/image/health` | GET | Health check | <1s |

---

## 💻 Code Examples

### Frontend (TypeScript/React)

```typescript
import { useImageProcessor } from '@/hooks/useImageProcessor';

function MyComponent() {
  const { isProcessing, result, error, processImageFile } = useImageProcessor();
  
  const handleFile = async (file: File) => {
    await processImageFile(file);
    // result contains layers, colors, layout
  };
}
```

### Direct API Call

```typescript
import { processImage } from '@/lib/aiService';

const result = await processImage(file);
console.log(result.layers);  // All editable layers
```

### With Fabric.js Canvas

```typescript
const result = await processImage(file);

result.layers.forEach(layer => {
  if (layer.type === 'text') {
    const text = new fabric.Textbox(layer.text.content, {
      left: layer.bbox.x,
      top: layer.bbox.y,
      fontSize: layer.text.font_size,
      fill: layer.text.color,
    });
    canvas.add(text);
  }
});
```

---

## ⚙️ Configuration Cheat Sheet

### AI Service (.env)

```env
# Quick (CPU, small model)
DEVICE=cpu
SAM_MODEL_TYPE=vit_b
MAX_IMAGE_SIZE=1024

# Balanced
DEVICE=cuda
SAM_MODEL_TYPE=vit_l
MAX_IMAGE_SIZE=2048

# Best Quality (needs GPU)
DEVICE=cuda
SAM_MODEL_TYPE=vit_h
MAX_IMAGE_SIZE=4096
```

### OCR Backend

```env
# PaddleOCR (recommended, no install needed)
OCR_BACKEND=paddleocr

# Tesseract (requires installation)
OCR_BACKEND=tesseract
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

---

## 📊 Output Structure

```typescript
{
  layers: Layer[],           // Editable elements
  color_palette: Color[],    // Extracted colors
  layout: Layout,            // Pix2Struct analysis
  image_size: {w, h},
  total_segments: number,
  total_text_elements: number
}
```

### Layer Object

```typescript
{
  id: string,
  type: "text" | "shape" | "background" | "icon",
  bbox: {x, y, width, height},
  center: {x, y},
  
  // If text layer:
  text: {
    content: string,
    font_size: number,
    font_family: string,
    color: "#hex",
    bold: boolean,
    italic: boolean,
    align: "left"|"center"|"right"
  },
  
  // If non-text layer:
  style: {
    fill_color: "#hex",
    stroke_color: "#hex" | null,
    stroke_width: number
  },
  
  mask: number[][],          // Binary mask from SAM
  editable: boolean,
  locked: boolean,
  visible: boolean
}
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 5000 in use | Change `PORT=5001` in `.env` |
| CUDA out of memory | Set `DEVICE=cpu` or `SAM_MODEL_TYPE=vit_b` |
| Slow processing | Use `vit_b` model or reduce `MAX_IMAGE_SIZE` |
| Import errors | Run `pip install -r requirements.txt` again |
| Models not downloading | Check internet, manual download from GitHub |
| CORS errors | Add your URL to `CORS_ORIGINS` in `.env` |

---

## 📦 Dependencies

### Backend (Python)
- torch (PyTorch)
- transformers (Pix2Struct)
- segment-anything (SAM)
- paddleocr or pytesseract
- flask + flask-cors
- opencv-python
- colorthief

### Frontend (TypeScript)
- Already included in client/package.json
- No additional dependencies needed

---

## 🎯 Performance Tips

**Faster Processing:**
- Use `SAM_MODEL_TYPE=vit_b`
- Set `MAX_IMAGE_SIZE=1024`
- Use GPU if available
- Reduce image size before upload

**Better Accuracy:**
- Use `SAM_MODEL_TYPE=vit_h`
- Keep original image size
- Use PaddleOCR backend
- Ensure good image quality

---

## 📝 Manual Setup (Alternative to Script)

```powershell
# 1. Create virtual environment
cd ai-services
python -m venv venv

# 2. Activate
.\venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure
cp .env.example .env

# 5. Create directories
mkdir models
mkdir uploads

# 6. Run
python app.py
```

---

## 🔗 Important Files

| File | Purpose |
|------|---------|
| `SAM_PIX2STRUCT_SETUP.md` | Complete setup guide |
| `INTEGRATION_SUMMARY.md` | Detailed documentation |
| `ai-services/README.md` | Backend API documentation |
| `setup-ai-service.ps1` | Automated setup script |

---

## 📞 Need Help?

1. Check `SAM_PIX2STRUCT_SETUP.md` for detailed guide
2. Review `INTEGRATION_SUMMARY.md` for architecture
3. See `ai-services/README.md` for API docs
4. Check troubleshooting section above

---

## ✅ Checklist

- [ ] Python 3.8+ installed
- [ ] Virtual environment created
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file configured
- [ ] Models directory created
- [ ] AI service running (port 5000)
- [ ] Frontend `.env.local` configured
- [ ] Frontend running (port 3000)
- [ ] Tested with sample image

---

**🎉 You're ready to process images with AI!**

Upload an image → Get editable layers with text, positions, colors, and more!
