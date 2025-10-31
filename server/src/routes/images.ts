import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Upload image
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageId = uuidv4();
    const imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // In production, upload to S3 here
    // For now, return the data URL
    
    res.json({
      success: true,
      imageId,
      url: imageUrl,
      processing: {
        status: 'pending',
        jobId: imageId
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Process image (detect elements)
router.get('/process/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    // Mock AI processing result
    // In production, call Python AI service
    const mockResult = {
      status: 'completed',
      results: {
        elements: [
          {
            type: 'text',
            content: 'Sample Text',
            bounds: { x: 10, y: 20, width: 200, height: 40 },
            font: { family: 'Arial', size: 24, weight: 'normal' },
            color: '#000000'
          },
          {
            type: 'shape',
            shapeType: 'rectangle',
            bounds: { x: 50, y: 100, width: 300, height: 200 },
            fill: '#FF5733',
            stroke: '#000000',
            strokeWidth: 2
          }
        ],
        colorPalette: [
          { hex: '#FF5733', rgb: [255, 87, 51], usage: 0.35 },
          { hex: '#C70039', rgb: [199, 0, 57], usage: 0.25 },
          { hex: '#000000', rgb: [0, 0, 0], usage: 0.20 }
        ],
        fonts: [
          { family: 'Arial', confidence: 0.95, fallback: 'Helvetica' }
        ]
      }
    };

    res.json(mockResult);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Extract text (OCR)
router.post('/detect-text', async (req: Request, res: Response) => {
  try {
    const { imageUrl } = req.body;

    // Mock OCR result
    const mockTexts = [
      {
        content: 'Detected Text',
        bounds: { x: 10, y: 20, width: 150, height: 30 },
        confidence: 0.98
      }
    ];

    res.json({ texts: mockTexts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Detect fonts
router.post('/detect-fonts', async (req: Request, res: Response) => {
  try {
    const { imageUrl, textRegions } = req.body;

    // Mock font detection
    const mockFonts = [
      {
        region: textRegions[0],
        detectedFont: 'Arial',
        confidence: 0.92,
        suggestions: ['Helvetica', 'Roboto', 'Open Sans']
      }
    ];

    res.json({ fonts: mockFonts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Extract colors
router.post('/extract-colors', async (req: Request, res: Response) => {
  try {
    const { imageUrl, paletteSize = 5 } = req.body;

    // Mock color extraction
    const mockPalette = [
      { hex: '#FF5733', rgb: [255, 87, 51], percentage: 35 },
      { hex: '#C70039', rgb: [199, 0, 57], percentage: 25 },
      { hex: '#900C3F', rgb: [144, 12, 63], percentage: 20 },
      { hex: '#581845', rgb: [88, 24, 69], percentage: 15 },
      { hex: '#000000', rgb: [0, 0, 0], percentage: 5 }
    ];

    res.json({ palette: mockPalette.slice(0, paletteSize) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
