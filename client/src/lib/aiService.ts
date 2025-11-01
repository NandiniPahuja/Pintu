/**
 * API client for PixMorph AI Service
 * Handles communication with the Flask backend for image processing
 */

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:5000';

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextStyle {
  content: string;
  font_size: number;
  font_family: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: 'left' | 'center' | 'right';
}

export interface Layer {
  id: string;
  type: 'text' | 'shape' | 'background' | 'icon';
  bbox: BBox;
  center: { x: number; y: number };
  content?: string;
  text?: TextStyle;
  style?: {
    fill_color: string;
    stroke_color?: string;
    stroke_width?: number;
  };
  mask?: number[][];
  area?: number;
  editable: boolean;
  locked: boolean;
  visible: boolean;
  confidence?: number;
}

export interface ColorInfo {
  id: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  name: string;
}

export interface ProcessedImage {
  layers: Layer[];
  color_palette: ColorInfo[];
  layout: any;
  image_size: { width: number; height: number };
  total_segments: number;
  total_text_elements: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Process image with complete AI pipeline (SAM + Pix2Struct + OCR)
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${AI_SERVICE_URL}/api/image/process`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to process image');
  }

  const result: ApiResponse<ProcessedImage> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Processing failed');
  }

  return result.data;
}

/**
 * Perform only SAM segmentation
 */
export async function segmentImage(file: File): Promise<any[]> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${AI_SERVICE_URL}/api/image/segment`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Segmentation failed');
  }

  const result = await response.json();
  return result.segments;
}

/**
 * Perform only OCR text extraction
 */
export async function extractText(file: File): Promise<any[]> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${AI_SERVICE_URL}/api/image/ocr`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'OCR failed');
  }

  const result = await response.json();
  return result.text_elements;
}

/**
 * Perform layout analysis with Pix2Struct
 */
export async function analyzeLayout(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${AI_SERVICE_URL}/api/image/layout`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Layout analysis failed');
  }

  const result = await response.json();
  return result.layout;
}

/**
 * Extract color palette from image
 */
export async function extractColors(file: File): Promise<ColorInfo[]> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${AI_SERVICE_URL}/api/image/colors`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Color extraction failed');
  }

  const result = await response.json();
  return result.colors;
}

/**
 * Check AI service health
 */
export async function checkHealth(): Promise<any> {
  const response = await fetch(`${AI_SERVICE_URL}/api/image/health`);

  if (!response.ok) {
    throw new Error('AI service is unavailable');
  }

  return response.json();
}

/**
 * Convert file to data URL for preview
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
