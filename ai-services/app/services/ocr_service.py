import cv2
import numpy as np
from typing import Dict, List, Optional, Tuple
from PIL import Image
from ..config import Config


class OCRService:
    """Service for OCR text extraction using PaddleOCR or Tesseract"""
    
    def __init__(self):
        self.backend = Config.OCR_BACKEND
        self.ocr_engine = None
        self._initialize_ocr()
    
    def _initialize_ocr(self):
        """Initialize OCR engine based on configuration"""
        try:
            if self.backend == 'paddleocr':
                from paddleocr import PaddleOCR
                
                # Initialize PaddleOCR
                self.ocr_engine = PaddleOCR(
                    use_angle_cls=True,
                    lang='en',
                    use_gpu=Config.DEVICE == 'cuda',
                    show_log=False
                )
                print(f"✅ PaddleOCR initialized")
            
            elif self.backend == 'tesseract':
                import pytesseract
                
                if Config.TESSERACT_CMD:
                    pytesseract.pytesseract.tesseract_cmd = Config.TESSERACT_CMD
                
                self.ocr_engine = pytesseract
                print(f"✅ Tesseract initialized")
            
            else:
                raise ValueError(f"Unknown OCR backend: {self.backend}")
        
        except Exception as e:
            raise Exception(f"Failed to initialize OCR engine: {str(e)}")
    
    def extract_text(self, image: np.ndarray) -> List[Dict]:
        """
        Extract text from entire image
        
        Args:
            image: Input image as numpy array
        
        Returns:
            List of text elements with position and content
        """
        try:
            if self.backend == 'paddleocr':
                return self._extract_with_paddleocr(image)
            else:
                return self._extract_with_tesseract(image)
        
        except Exception as e:
            raise Exception(f"Text extraction failed: {str(e)}")
    
    def _extract_with_paddleocr(self, image: np.ndarray) -> List[Dict]:
        """Extract text using PaddleOCR"""
        results = self.ocr_engine.ocr(image, cls=True)
        
        text_elements = []
        
        if results and results[0]:
            for idx, line in enumerate(results[0]):
                bbox, (text, confidence) = line
                
                # Convert bbox to standard format
                points = np.array(bbox)
                x_min, y_min = points.min(axis=0)
                x_max, y_max = points.max(axis=0)
                
                # Calculate font size estimation
                height = y_max - y_min
                font_size = self._estimate_font_size(height)
                
                text_elements.append({
                    'id': f'text_{idx}',
                    'content': text,
                    'confidence': float(confidence),
                    'bbox': {
                        'x': int(x_min),
                        'y': int(y_min),
                        'width': int(x_max - x_min),
                        'height': int(y_max - y_min)
                    },
                    'center': {
                        'x': int((x_min + x_max) / 2),
                        'y': int((y_min + y_max) / 2)
                    },
                    'polygon': [[int(p[0]), int(p[1])] for p in points],
                    'font_size': font_size,
                    'type': 'text'
                })
        
        print(f"✅ PaddleOCR extracted {len(text_elements)} text elements")
        return text_elements
    
    def _extract_with_tesseract(self, image: np.ndarray) -> List[Dict]:
        """Extract text using Tesseract"""
        import pytesseract
        
        # Convert to PIL Image
        pil_image = Image.fromarray(image)
        
        # Get detailed data
        data = pytesseract.image_to_data(
            pil_image,
            output_type=pytesseract.Output.DICT,
            config='--psm 11'  # Sparse text
        )
        
        text_elements = []
        n_boxes = len(data['text'])
        
        for i in range(n_boxes):
            text = data['text'][i].strip()
            if text:  # Only process non-empty text
                conf = int(data['conf'][i])
                if conf > 0:  # Only include confident detections
                    x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]
                    
                    font_size = self._estimate_font_size(h)
                    
                    text_elements.append({
                        'id': f'text_{i}',
                        'content': text,
                        'confidence': conf / 100.0,  # Normalize to 0-1
                        'bbox': {
                            'x': x,
                            'y': y,
                            'width': w,
                            'height': h
                        },
                        'center': {
                            'x': x + w // 2,
                            'y': y + h // 2
                        },
                        'font_size': font_size,
                        'type': 'text'
                    })
        
        print(f"✅ Tesseract extracted {len(text_elements)} text elements")
        return text_elements
    
    def extract_text_from_region(self, image: np.ndarray, bbox: Dict) -> Optional[Dict]:
        """
        Extract text from a specific region
        
        Args:
            image: Full image
            bbox: Bounding box dictionary with x, y, width, height
        
        Returns:
            Text information or None
        """
        try:
            x, y, w, h = bbox['x'], bbox['y'], bbox['width'], bbox['height']
            
            # Extract region
            region = image[y:y+h, x:x+w]
            
            if region.size == 0:
                return None
            
            # Extract text from region
            if self.backend == 'paddleocr':
                results = self.ocr_engine.ocr(region, cls=True)
                
                if results and results[0]:
                    # Concatenate all text in region
                    texts = [line[1][0] for line in results[0]]
                    combined_text = ' '.join(texts)
                    avg_confidence = np.mean([line[1][1] for line in results[0]])
                    
                    return {
                        'content': combined_text,
                        'confidence': float(avg_confidence),
                        'bbox': bbox
                    }
            else:
                import pytesseract
                pil_region = Image.fromarray(region)
                text = pytesseract.image_to_string(pil_region).strip()
                
                if text:
                    return {
                        'content': text,
                        'confidence': 0.8,  # Default confidence
                        'bbox': bbox
                    }
            
            return None
        
        except Exception as e:
            print(f"⚠️  Error extracting text from region: {str(e)}")
            return None
    
    def _estimate_font_size(self, height: float) -> int:
        """
        Estimate font size in points from pixel height
        
        Args:
            height: Text height in pixels
        
        Returns:
            Estimated font size in points
        """
        # Approximate conversion: 1 point ≈ 1.333 pixels at 96 DPI
        font_size = int(height / 1.333)
        
        # Clamp to reasonable range
        return max(8, min(72, font_size))
    
    def detect_font_color(self, image: np.ndarray, bbox: Dict) -> Tuple[int, int, int]:
        """
        Detect dominant font color in text region
        
        Args:
            image: Full image
            bbox: Bounding box of text
        
        Returns:
            RGB color tuple
        """
        try:
            x, y, w, h = bbox['x'], bbox['y'], bbox['width'], bbox['height']
            region = image[y:y+h, x:x+w]
            
            if region.size == 0:
                return (0, 0, 0)
            
            # Convert to grayscale
            gray = cv2.cvtColor(region, cv2.COLOR_RGB2GRAY)
            
            # Threshold to separate text from background
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Determine if text is dark or light
            text_pixels = region[binary == 0]  # Assuming dark text
            
            if len(text_pixels) == 0:
                text_pixels = region[binary == 255]  # Try light text
            
            if len(text_pixels) > 0:
                # Get median color
                median_color = np.median(text_pixels, axis=0)
                return tuple(map(int, median_color))
            
            return (0, 0, 0)
        
        except Exception as e:
            print(f"⚠️  Error detecting font color: {str(e)}")
            return (0, 0, 0)
