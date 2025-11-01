import cv2
import numpy as np
from typing import Dict, List, Optional
from .sam_service import SAMService
from .pix2struct_service import Pix2StructService
from .ocr_service import OCRService
from colorthief import ColorThief
from io import BytesIO
from PIL import Image


class ImageProcessor:
    """Unified processor combining SAM, Pix2Struct, and OCR"""
    
    def __init__(self):
        print("🚀 Initializing Image Processor...")
        self.sam_service = SAMService()
        self.pix2struct_service = Pix2StructService()
        self.ocr_service = OCRService()
        print("✅ Image Processor initialized")
    
    def process_image(self, image: np.ndarray) -> Dict:
        """
        Complete image processing pipeline
        
        Args:
            image: Input image as numpy array (RGB)
        
        Returns:
            Complete analysis with editable layers
        """
        print(f"🔄 Processing image of shape {image.shape}")
        
        # Step 1: SAM Segmentation
        print("📍 Step 1/5: SAM Segmentation")
        segments = self.sam_service.segment_image(image)
        
        # Step 2: Pix2Struct Layout Analysis
        print("📍 Step 2/5: Pix2Struct Layout Analysis")
        layout = self.pix2struct_service.analyze_layout(image)
        
        # Step 3: OCR Text Extraction
        print("📍 Step 3/5: OCR Text Extraction")
        ocr_results = self.ocr_service.extract_text(image)
        
        # Step 4: Match segments with text
        print("📍 Step 4/5: Matching Segments with Text")
        matched_layers = self._match_segments_with_text(segments, ocr_results, image)
        
        # Step 5: Extract colors
        print("📍 Step 5/5: Extracting Color Palette")
        color_palette = self._extract_color_palette(image)
        
        # Combine all results
        result = {
            'layers': matched_layers,
            'layout': layout,
            'color_palette': color_palette,
            'image_size': {
                'width': image.shape[1],
                'height': image.shape[0]
            },
            'total_segments': len(segments),
            'total_text_elements': len(ocr_results)
        }
        
        print(f"✅ Processing complete: {len(matched_layers)} editable layers created")
        return result
    
    def _match_segments_with_text(self, segments: List[Dict], ocr_results: List[Dict], 
                                   image: np.ndarray) -> List[Dict]:
        """
        Match SAM segments with OCR text results
        
        Args:
            segments: List of SAM segments
            ocr_results: List of OCR text elements
            image: Original image
        
        Returns:
            List of matched editable layers
        """
        layers = []
        matched_text_ids = set()
        
        # Process each segment
        for segment in segments:
            layer = {
                'id': segment['id'],
                'type': segment['type'],
                'bbox': segment['bbox'],
                'center': segment['center'],
                'area': segment['area'],
                'mask': segment['mask'],
                'editable': True,
                'locked': False,
                'visible': True
            }
            
            # Try to match with text
            matching_text = self._find_matching_text(segment, ocr_results, matched_text_ids)
            
            if matching_text:
                # This is a text layer
                layer['type'] = 'text'
                layer['content'] = matching_text['content']
                layer['text'] = {
                    'content': matching_text['content'],
                    'font_size': matching_text['font_size'],
                    'font_family': 'Arial',  # Default, can be enhanced with font recognition
                    'color': self._get_text_color(image, matching_text['bbox']),
                    'bold': False,
                    'italic': False,
                    'underline': False,
                    'align': self._detect_text_alignment(matching_text['bbox'], image.shape[1])
                }
                layer['confidence'] = matching_text['confidence']
                matched_text_ids.add(matching_text['id'])
            else:
                # Not a text layer - could be shape, icon, or background
                layer['content'] = None
                layer['style'] = {
                    'fill_color': self._get_dominant_color(image, segment['bbox']),
                    'stroke_color': None,
                    'stroke_width': 0
                }
            
            layers.append(layer)
        
        # Add any unmatched text as separate layers
        for text in ocr_results:
            if text['id'] not in matched_text_ids:
                layer = {
                    'id': text['id'],
                    'type': 'text',
                    'bbox': text['bbox'],
                    'center': text['center'],
                    'content': text['content'],
                    'text': {
                        'content': text['content'],
                        'font_size': text['font_size'],
                        'font_family': 'Arial',
                        'color': self._get_text_color(image, text['bbox']),
                        'bold': False,
                        'italic': False,
                        'underline': False,
                        'align': self._detect_text_alignment(text['bbox'], image.shape[1])
                    },
                    'confidence': text['confidence'],
                    'editable': True,
                    'locked': False,
                    'visible': True
                }
                layers.append(layer)
        
        # Sort layers by z-index (background first, then by area)
        layers.sort(key=lambda x: (
            0 if x['type'] == 'background' else 1,
            -x.get('area', 0)
        ))
        
        return layers
    
    def _find_matching_text(self, segment: Dict, ocr_results: List[Dict], 
                           matched_ids: set) -> Optional[Dict]:
        """
        Find OCR text that matches a segment
        
        Args:
            segment: SAM segment
            ocr_results: List of OCR results
            matched_ids: Set of already matched text IDs
        
        Returns:
            Matching text element or None
        """
        seg_bbox = segment['bbox']
        seg_center = segment['center']
        
        best_match = None
        best_iou = 0.0
        
        for text in ocr_results:
            if text['id'] in matched_ids:
                continue
            
            # Calculate IoU (Intersection over Union)
            iou = self._calculate_iou(seg_bbox, text['bbox'])
            
            # Check if text center is inside segment
            text_center = text['center']
            center_inside = (
                seg_bbox['x'] <= text_center['x'] <= seg_bbox['x'] + seg_bbox['width'] and
                seg_bbox['y'] <= text_center['y'] <= seg_bbox['y'] + seg_bbox['height']
            )
            
            # Match if high IoU or center is inside
            if iou > 0.5 or (center_inside and iou > 0.3):
                if iou > best_iou:
                    best_iou = iou
                    best_match = text
        
        return best_match
    
    def _calculate_iou(self, bbox1: Dict, bbox2: Dict) -> float:
        """Calculate Intersection over Union for two bounding boxes"""
        x1_min = bbox1['x']
        y1_min = bbox1['y']
        x1_max = bbox1['x'] + bbox1['width']
        y1_max = bbox1['y'] + bbox1['height']
        
        x2_min = bbox2['x']
        y2_min = bbox2['y']
        x2_max = bbox2['x'] + bbox2['width']
        y2_max = bbox2['y'] + bbox2['height']
        
        # Calculate intersection
        x_inter_min = max(x1_min, x2_min)
        y_inter_min = max(y1_min, y2_min)
        x_inter_max = min(x1_max, x2_max)
        y_inter_max = min(y1_max, y2_max)
        
        if x_inter_max < x_inter_min or y_inter_max < y_inter_min:
            return 0.0
        
        inter_area = (x_inter_max - x_inter_min) * (y_inter_max - y_inter_min)
        
        # Calculate union
        bbox1_area = bbox1['width'] * bbox1['height']
        bbox2_area = bbox2['width'] * bbox2['height']
        union_area = bbox1_area + bbox2_area - inter_area
        
        if union_area == 0:
            return 0.0
        
        return inter_area / union_area
    
    def _get_text_color(self, image: np.ndarray, bbox: Dict) -> str:
        """Get text color as hex string"""
        rgb = self.ocr_service.detect_font_color(image, bbox)
        return '#{:02x}{:02x}{:02x}'.format(*rgb)
    
    def _get_dominant_color(self, image: np.ndarray, bbox: Dict) -> str:
        """Get dominant color in region as hex string"""
        try:
            x, y, w, h = bbox['x'], bbox['y'], bbox['width'], bbox['height']
            region = image[y:y+h, x:x+w]
            
            if region.size == 0:
                return '#000000'
            
            # Convert to PIL Image
            pil_image = Image.fromarray(region)
            
            # Save to BytesIO
            img_io = BytesIO()
            pil_image.save(img_io, format='PNG')
            img_io.seek(0)
            
            # Extract dominant color
            color_thief = ColorThief(img_io)
            dominant_color = color_thief.get_color(quality=1)
            
            return '#{:02x}{:02x}{:02x}'.format(*dominant_color)
        
        except Exception as e:
            print(f"⚠️  Error getting dominant color: {str(e)}")
            return '#000000'
    
    def _detect_text_alignment(self, bbox: Dict, image_width: int) -> str:
        """Detect text alignment based on position"""
        center_x = bbox['x'] + bbox['width'] / 2
        
        left_threshold = image_width * 0.33
        right_threshold = image_width * 0.67
        
        if center_x < left_threshold:
            return 'left'
        elif center_x > right_threshold:
            return 'right'
        else:
            return 'center'
    
    def _extract_color_palette(self, image: np.ndarray, num_colors: int = 8) -> List[Dict]:
        """
        Extract color palette from image
        
        Args:
            image: Input image
            num_colors: Number of colors to extract
        
        Returns:
            List of color dictionaries
        """
        try:
            # Convert to PIL Image
            pil_image = Image.fromarray(image)
            
            # Save to BytesIO
            img_io = BytesIO()
            pil_image.save(img_io, format='PNG')
            img_io.seek(0)
            
            # Extract palette
            color_thief = ColorThief(img_io)
            palette = color_thief.get_palette(color_count=num_colors, quality=1)
            
            # Convert to hex and create color objects
            colors = []
            for idx, rgb in enumerate(palette):
                hex_color = '#{:02x}{:02x}{:02x}'.format(*rgb)
                colors.append({
                    'id': f'color_{idx}',
                    'hex': hex_color,
                    'rgb': {'r': rgb[0], 'g': rgb[1], 'b': rgb[2]},
                    'name': self._get_color_name(rgb)
                })
            
            return colors
        
        except Exception as e:
            print(f"⚠️  Error extracting color palette: {str(e)}")
            return []
    
    def _get_color_name(self, rgb: tuple) -> str:
        """Get approximate color name"""
        r, g, b = rgb
        
        # Simple color naming logic
        if r > 200 and g > 200 and b > 200:
            return 'white'
        elif r < 50 and g < 50 and b < 50:
            return 'black'
        elif r > max(g, b) + 50:
            return 'red'
        elif g > max(r, b) + 50:
            return 'green'
        elif b > max(r, g) + 50:
            return 'blue'
        elif r > 200 and g > 200:
            return 'yellow'
        elif r > 150 and b > 150:
            return 'purple'
        elif g > 150 and b > 150:
            return 'cyan'
        else:
            return 'gray'
