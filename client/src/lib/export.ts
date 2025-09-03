import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Export options for image formats
 */
export interface ExportOptions {
  format: 'png' | 'jpeg' | 'svg' | 'pdf' | 'json' | 'multi';
  fileName?: string;
  quality?: number; // 0-1, for JPEG
  multiplier?: number; // Scale factor for export resolution
  background?: string; // Background color
  width?: number; // Custom width for export
  height?: number; // Custom height for export
  transparent?: boolean; // For PNG, whether to keep transparency
  includeCanvasBackground?: boolean; // Whether to include canvas background
  includeMetadata?: boolean; // For JSON export
  includeExcludedObjects?: boolean; // Include objects with excludeFromExport flag
  ratios?: Array<{
    name: string;
    width: number;
    height: number;
  }>; // For multi-ratio export
}

/**
 * Default export options
 */
export const defaultExportOptions: ExportOptions = {
  format: 'png',
  fileName: 'pintu-design',
  quality: 0.9,
  multiplier: 2,
  background: '#FFFFFF',
  transparent: true,
  includeCanvasBackground: true,
  includeMetadata: true,
  includeExcludedObjects: false,
};

/**
 * Standard ratios for social media exports
 */
export const standardRatios = [
  { name: 'Instagram Square (1:1)', width: 1080, height: 1080 },
  { name: 'Instagram Portrait (4:5)', width: 1080, height: 1350 },
  { name: 'Instagram Landscape (16:9)', width: 1080, height: 608 },
  { name: 'Instagram Story (9:16)', width: 1080, height: 1920 },
  { name: 'Facebook Post (1.91:1)', width: 1200, height: 630 },
  { name: 'Twitter Post (16:9)', width: 1200, height: 675 },
  { name: 'Pinterest Pin (2:3)', width: 1000, height: 1500 },
  { name: 'LinkedIn (1.91:1)', width: 1200, height: 627 },
  { name: 'YouTube Thumbnail (16:9)', width: 1280, height: 720 },
  { name: 'TikTok (9:16)', width: 1080, height: 1920 },
];

/**
 * Export a Fabric.js canvas to different formats
 */
export async function exportCanvas(
  canvas: fabric.Canvas,
  options: ExportOptions = defaultExportOptions
): Promise<string | Blob | null> {
  // Make a copy of the canvas for export to avoid modifying the original
  const clonedCanvas = await cloneCanvas(canvas);
  
  try {
    switch (options.format) {
      case 'png':
        return exportToPNG(clonedCanvas, options);
      case 'jpeg':
        return exportToJPEG(clonedCanvas, options);
      case 'svg':
        return exportToSVG(clonedCanvas, options);
      case 'pdf':
        return exportToPDF(clonedCanvas, options);
      case 'json':
        return exportToJSON(clonedCanvas, options);
      case 'multi':
        return exportMultiRatio(canvas, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  } finally {
    // Clean up the cloned canvas
    clonedCanvas.dispose();
  }
}

/**
 * Export to PNG
 */
function exportToPNG(
  canvas: fabric.Canvas,
  options: ExportOptions
): string | Blob {
  const exportOptions: fabric.IDataURLOptions = {
    format: 'png',
    quality: 1,
    multiplier: options.multiplier || 2,
  };
  
  // Handle transparent background
  if (options.transparent) {
    exportOptions.backgroundColor = undefined;
  } else if (options.background) {
    exportOptions.backgroundColor = options.background;
  }

  // Get data URL
  const dataURL = canvas.toDataURL(exportOptions);
  
  // Convert to Blob for download
  if (options.fileName) {
    return dataURLToBlob(dataURL);
  }
  
  return dataURL;
}

/**
 * Export to JPEG
 */
function exportToJPEG(
  canvas: fabric.Canvas,
  options: ExportOptions
): string | Blob {
  const exportOptions: fabric.IDataURLOptions = {
    format: 'jpeg',
    quality: options.quality || 0.9,
    multiplier: options.multiplier || 2,
    backgroundColor: options.background || '#FFFFFF',
  };

  // Get data URL
  const dataURL = canvas.toDataURL(exportOptions);
  
  // Convert to Blob for download
  if (options.fileName) {
    return dataURLToBlob(dataURL);
  }
  
  return dataURL;
}

/**
 * Export to SVG
 */
function exportToSVG(
  canvas: fabric.Canvas,
  options: ExportOptions
): string | Blob {
  const svgData = canvas.toSVG({
    width: options.width || canvas.getWidth(),
    height: options.height || canvas.getHeight(),
    viewBox: {
      x: 0,
      y: 0,
      width: canvas.getWidth(),
      height: canvas.getHeight(),
    },
    suppressPreamble: false,
    includeDefaultValues: false,
  });
  
  // Convert to Blob for download
  if (options.fileName) {
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    return blob;
  }
  
  return svgData;
}

/**
 * Export to PDF (requires fabric.js pdf export capability)
 */
function exportToPDF(
  canvas: fabric.Canvas,
  options: ExportOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // If fabric.js doesn't have direct PDF export, we can use jsPDF or similar libraries
      // For now, we'll create a PNG and convert it to PDF
      // This is a placeholder implementation
      const dataURL = canvas.toDataURL({
        format: 'png',
        multiplier: options.multiplier || 2,
      });
      
      // In a real implementation, you would convert this to PDF
      // For now, we'll just return the PNG as a blob
      const blob = dataURLToBlob(dataURL);
      resolve(blob);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Export to JSON (Fabric.js format)
 */
function exportToJSON(
  canvas: fabric.Canvas,
  options: ExportOptions
): string | Blob {
  const json = JSON.stringify(canvas.toJSON(['id', 'name']), null, 2);
  
  // Convert to Blob for download
  if (options.fileName) {
    const blob = new Blob([json], { type: 'application/json' });
    return blob;
  }
  
  return json;
}

/**
 * Export canvas to multiple aspect ratios in a ZIP file
 */
async function exportMultiRatio(
  canvas: fabric.Canvas,
  options: ExportOptions
): Promise<Blob> {
  // Use provided ratios or standard ones
  const ratios = options.ratios || standardRatios;
  const zip = new JSZip();
  
  // Store original canvas dimensions
  const originalWidth = canvas.getWidth();
  const originalHeight = canvas.getHeight();
  
  for (const ratio of ratios) {
    try {
      // Clone canvas for this ratio
      const ratioCanvas = await cloneCanvas(canvas);
      
      // Resize canvas to this ratio
      resizeCanvas(ratioCanvas, ratio.width, ratio.height);
      
      // Export as PNG
      const exportOptions = {
        ...options,
        format: 'png' as const,
        width: ratio.width,
        height: ratio.height,
      };
      
      // Get the image data
      const dataURL = ratioCanvas.toDataURL({
        format: 'png',
        multiplier: options.multiplier || 2,
      });
      
      // Add to ZIP file
      const folderName = options.fileName || 'pintu-multi-export';
      const fileName = `${ratio.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      zip.file(`${folderName}/${fileName}`, dataURLToBlob(dataURL));
      
      // Clean up
      ratioCanvas.dispose();
    } catch (err) {
      console.error(`Failed to export ratio ${ratio.name}:`, err);
    }
  }
  
  // Generate ZIP file
  return zip.generateAsync({ type: 'blob' });
}

/**
 * Clone a Fabric.js canvas
 */
async function cloneCanvas(original: fabric.Canvas): Promise<fabric.Canvas> {
  return new Promise((resolve, reject) => {
    try {
      // Create a new canvas with the same dimensions
      const cloned = new fabric.Canvas(document.createElement('canvas'), {
        width: original.getWidth(),
        height: original.getHeight(),
        backgroundColor: original.backgroundColor,
      });
      
      // Clone the objects
      const originalJSON = original.toJSON(['id', 'name']);
      cloned.loadFromJSON(originalJSON, () => {
        resolve(cloned);
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Resize a canvas to a new width and height
 * This preserves the content and centers it
 */
function resizeCanvas(canvas: fabric.Canvas, width: number, height: number): void {
  const originalWidth = canvas.getWidth();
  const originalHeight = canvas.getHeight();
  
  // Set new dimensions
  canvas.setDimensions({ width, height });
  
  // Calculate scale to fit everything within the new dimensions
  const scaleX = width / originalWidth;
  const scaleY = height / originalHeight;
  const scale = Math.min(scaleX, scaleY);
  
  // If not exact match, center the content
  if (scaleX !== scaleY) {
    // Calculate centering offset
    const offsetX = (width - (originalWidth * scale)) / 2;
    const offsetY = (height - (originalHeight * scale)) / 2;
    
    // Apply transform to all objects
    canvas.getObjects().forEach((obj) => {
      obj.scaleX = obj.scaleX * scale;
      obj.scaleY = obj.scaleY * scale;
      obj.left = (obj.left * scale) + offsetX;
      obj.top = (obj.top * scale) + offsetY;
      obj.setCoords();
    });
  } else {
    // If exact match, just scale everything uniformly
    canvas.getObjects().forEach((obj) => {
      obj.scaleX = obj.scaleX * scale;
      obj.scaleY = obj.scaleY * scale;
      obj.left = obj.left * scale;
      obj.top = obj.top * scale;
      obj.setCoords();
    });
  }
  
  canvas.requestRenderAll();
}

/**
 * Convert a data URL to a Blob object
 */
function dataURLToBlob(dataURL: string): Blob {
  // Split into two parts: the MIME type and the base64 data
  const parts = dataURL.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const base64 = parts[1];
  
  // Convert base64 to raw binary data
  const byteCharacters = atob(base64);
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
    const slice = byteCharacters.slice(offset, offset + 1024);
    
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays, { type: contentType });
}

/**
 * Download a file (Blob or Data URL)
 */
export function downloadFile(content: Blob | string, fileName: string): void {
  if (typeof content === 'string' && content.startsWith('data:')) {
    // Convert data URL to blob
    content = dataURLToBlob(content);
  }
  
  // Add file extension if needed
  if (!fileName.includes('.')) {
    if (content instanceof Blob) {
      const fileType = content.type;
      if (fileType === 'image/png') fileName += '.png';
      else if (fileType === 'image/jpeg') fileName += '.jpg';
      else if (fileType === 'image/svg+xml') fileName += '.svg';
      else if (fileType === 'application/pdf') fileName += '.pdf';
      else if (fileType === 'application/json') fileName += '.json';
      else if (fileType === 'application/zip') fileName += '.zip';
      else fileName += '.bin'; // Generic fallback
    } else {
      fileName += '.txt'; // Default for string content
    }
  }
  
  // Download the file
  saveAs(content, fileName);
}
