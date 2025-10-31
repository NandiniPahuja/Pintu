# PixMorph - Intelligent Design Editor

> **Upload any Pinterest image → Detect and separate all visual elements → Edit them freely like a design file**

## 🧠 Core Vision

Upload any Pinterest image (poster, banner, quote graphic) and make **every part of it editable** — text, shapes, background, colors, fonts. Think: **Reverse-engineer any design into an editable canvas**.

## 🎯 Key Features

### 🖼️ 1. Image Upload & Display
- Upload images (JPG, PNG, WebP, SVG)
- Display on Fabric.js canvas
- Auto-resize and center
- Replace or remove uploaded image

### 🤖 2. AI Element Detection
- Detect visual sections (text areas, shapes, icons, backgrounds)
- Segment into separate canvas layers
- Return JSON structure with position, size, and type
- Models: YOLOv8, U2-Net, OpenCV

### 📝 3. OCR Text Extraction & Editing
- Extract all text using Tesseract.js/EasyOCR
- Convert to editable Fabric.js Textbox objects
- Inline text editing
- Customize: font family, size, color, bold/italic/underline

### 🔤 4. Font Recognition
- Identify fonts using WhatTheFont API or custom CNN
- Auto-suggest matching fonts
- Switch fonts while keeping layout intact

### 🌈 5. Color Palette Extraction
- Extract dominant colors (Color Thief/OpenCV)
- Display HEX codes in side palette
- Apply colors to text, backgrounds, or shapes

### 🧩 6. Editable Layers & Canvas Control
- Every component is a separate layer:
  - Text → editable text object
  - Shape → editable vector
  - Image → movable image object
  - Background → locked image layer
- Layer management: reorder, lock/unlock, toggle visibility

### ✏️ 7. Interactive Editing Tools
- Drag, resize, rotate, delete elements
- Snap-to-grid alignment
- Duplicate elements
- Keyboard shortcuts (Ctrl+Z, Delete)

### 💾 8. Export Options
- Export as PNG (transparent or full)
- Export as JPEG
- Export as PDF
- Save as editable JSON for reloading

Think: **Canva meets AI-powered reverse engineering**

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Next.js 14** (SSR/SSG)
- **TypeScript** (type safety)
- **Tailwind CSS** (styling)
- **Fabric.js** (canvas manipulation)
- **Zustand** (state management)
- **shadcn/ui** (UI components)

### Backend
- **Node.js** (Express/Fastify)
- **Python FastAPI** (AI/ML services)
- **PostgreSQL** (database)
- **Redis** (caching)
- **AWS S3** (file storage)

### AI/ML
- **YOLO v8** / **U2-Net** (object detection)
- **Tesseract.js** (OCR)
- **TensorFlow** / **PyTorch** (ML models)
- **OpenCV** (image processing)
- **Color Thief** (color extraction)

## 🚀 Project Timeline

**Duration:** 8 Weeks (2 Months)

| Week | Milestone | Focus |
|------|-----------|-------|
| 1-2 | Backend AI Services | OCR, object detection, font/color APIs |
| 3-4 | Frontend Editor Prototype | Canvas, drag-drop, layer management |
| 5 | Advanced Editing | Text/font editing, transformations |
| 6 | Export & Save | PNG/JPEG/PDF export, project management |
| 7 | Testing & Optimization | Cross-browser testing, performance |
| 8 | Deployment | Production launch 🚀 |

## 📚 Getting Started

### 1. Read the Documentation
Start by reading [`PIXMORPH_SRS.md`](./PIXMORPH_SRS.md) for:
- Complete feature breakdown
- Detailed API specifications
- Implementation guidelines
- Architecture diagrams
- Testing strategies

### 2. Set Up Development Environment

#### Prerequisites
```bash
Node.js v20+
Python 3.11+
PostgreSQL 15+
Redis 7+
Git
```

#### Initialize Frontend
```bash
mkdir client && cd client
npx create-next-app@latest . --typescript --tailwind --app
npm install fabric opentype.js colorthief zustand
npm run dev
```

#### Initialize Backend
```bash
mkdir server && cd server
npm init -y
npm install express cors jsonwebtoken bcrypt pg redis
```

#### Initialize AI Services
```bash
mkdir ai-services && cd ai-services
python -m venv venv
.\venv\Scripts\activate
pip install fastapi uvicorn opencv-python pillow pytesseract tensorflow
uvicorn main:app --reload
```

### 3. Follow the Roadmap
Implement features according to the 8-week plan in the SRS document.

## 🗂️ Project Structure (To Be Created)

```
pixmorph/
├── client/              # Next.js Frontend
│   ├── src/
│   │   ├── app/        # Next.js 14 App Router
│   │   ├── components/ # React components
│   │   ├── lib/        # Utilities
│   │   └── hooks/      # Custom hooks
│   └── package.json
│
├── server/             # Node.js Backend
│   ├── src/
│   │   ├── routes/    # API routes
│   │   ├── models/    # Database models
│   │   └── middleware/# Auth, validation
│   └── package.json
│
├── ai-services/        # Python ML Services
│   ├── app/
│   │   ├── ocr.py     # Text extraction
│   │   ├── detect.py  # Object detection
│   │   └── fonts.py   # Font recognition
│   └── requirements.txt
│
└── docs/              # Documentation
```

## 🎨 Core Features

### Phase 1: MVP
- ✅ Image upload (JPEG, PNG, WebP, SVG)
- ✅ AI object detection & segmentation
- ✅ OCR text extraction
- ✅ Font recognition
- ✅ Color palette extraction (HEX codes)
- ✅ Drag-and-drop editing
- ✅ Resize, rotate, move elements
- ✅ Layer management
- ✅ Export (PNG, JPEG, PDF)

### Phase 2: Advanced (Post-Launch)
- 🔄 Real-time collaboration
- 🔄 AI background removal
- 🔄 Template library
- 🔄 Social media integration
- 🔄 Mobile apps
- 🔄 Animation timeline

## 📖 API Endpoints

### Authentication
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

### Image Processing
```
POST /api/images/upload
GET  /api/images/process/{jobId}
POST /api/images/detect-text
POST /api/images/detect-fonts
POST /api/images/extract-colors
```

### Projects
```
GET    /api/projects
POST   /api/projects
GET    /api/projects/{id}
PUT    /api/projects/{id}
DELETE /api/projects/{id}
```

### Export
```
POST /api/export/image
POST /api/export/pdf
```

See [`PIXMORPH_SRS.md`](./PIXMORPH_SRS.md) for complete API documentation.

## 🧪 Testing

```bash
# Frontend
cd client && npm test

# Backend
cd server && npm test

# AI Services
cd ai-services && pytest

# E2E
npm run test:e2e
```

## 🚢 Deployment

**Frontend:** Vercel / Netlify  
**Backend:** Railway / Render  
**AI Services:** AWS Lambda / GCP Cloud Run  
**Database:** Supabase / Neon  
**Storage:** AWS S3 / Cloudflare R2

## 📊 Success Metrics

- **User Acquisition:** 1000+ users in first month
- **Session Time:** 10+ minutes average
- **Export Success Rate:** 95%
- **Performance:** <500ms API response (p95)
- **Uptime:** 99.5%

## 🤝 Contributing

1. Read the SRS document
2. Pick a feature from the roadmap
3. Create a feature branch
4. Submit a pull request

## 📝 License

MIT License - see LICENSE file (to be added)

## 📞 Contact

**Repository:** [github.com/NandiniPahuja/Pintu](https://github.com/NandiniPahuja/Pintu)  
**Issues:** [github.com/NandiniPahuja/Pintu/issues](https://github.com/NandiniPahuja/Pintu/issues)

---

**Ready to build PixMorph!** 🚀

Start by reading the complete SRS: [`PIXMORPH_SRS.md`](./PIXMORPH_SRS.md)
