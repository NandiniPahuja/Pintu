import torch
import numpy as np
from typing import Dict, List, Optional
from transformers import Pix2StructForConditionalGeneration, Pix2StructProcessor
from PIL import Image
from ..config import Config
import json
import re


class Pix2StructService:
    """Service for Pix2Struct model integration for layout analysis"""
    
    def __init__(self):
        self.device = Config.DEVICE
        self.model = None
        self.processor = None
        self._load_model()
    
    def _load_model(self):
        """Load Pix2Struct pretrained model"""
        try:
            print(f"📦 Loading Pix2Struct model: {Config.PIX2STRUCT_MODEL}")
            
            self.processor = Pix2StructProcessor.from_pretrained(Config.PIX2STRUCT_MODEL)
            self.model = Pix2StructForConditionalGeneration.from_pretrained(Config.PIX2STRUCT_MODEL)
            self.model.to(self.device)
            self.model.eval()
            
            print(f"✅ Pix2Struct model loaded successfully on {self.device}")
        except Exception as e:
            raise Exception(f"Failed to load Pix2Struct model: {str(e)}")
    
    def analyze_layout(self, image: np.ndarray) -> Dict:
        """
        Analyze image layout and generate structured representation
        
        Args:
            image: Input image as numpy array (RGB)
        
        Returns:
            Structured layout information
        """
        try:
            # Convert numpy array to PIL Image
            pil_image = Image.fromarray(image)
            
            # Prepare input with layout analysis prompt
            prompt = "Generate a structured layout description of this image, including all text elements, shapes, and their positions."
            
            inputs = self.processor(
                images=pil_image,
                text=prompt,
                return_tensors="pt"
            ).to(self.device)
            
            # Generate layout description
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=512,
                    num_beams=4,
                    early_stopping=True
                )
            
            # Decode output
            layout_text = self.processor.decode(outputs[0], skip_special_tokens=True)
            
            # Parse layout text into structured format
            layout_structure = self._parse_layout(layout_text, image.shape[:2])
            
            print(f"✅ Layout analysis completed")
            return layout_structure
        
        except Exception as e:
            raise Exception(f"Layout analysis failed: {str(e)}")
    
    def _parse_layout(self, layout_text: str, image_shape: tuple) -> Dict:
        """
        Parse layout text into structured format
        
        Args:
            layout_text: Generated layout description
            image_shape: Image dimensions (h, w)
        
        Returns:
            Structured layout dictionary
        """
        h, w = image_shape
        
        # Initialize structure
        structure = {
            'layout_description': layout_text,
            'elements': [],
            'hierarchy': [],
            'image_size': {'width': w, 'height': h}
        }
        
        # Try to extract structured information
        # This is a simplified parser - in production, you'd want more robust parsing
        
        # Look for text mentions
        text_pattern = r'text[:\s]+["\']([^"\']+)["\']'
        text_matches = re.findall(text_pattern, layout_text, re.IGNORECASE)
        
        for idx, text_content in enumerate(text_matches):
            structure['elements'].append({
                'id': f'text_{idx}',
                'type': 'text',
                'content': text_content,
                'confidence': 0.8
            })
        
        # Look for position keywords
        position_keywords = {
            'top': 0.2,
            'bottom': 0.8,
            'left': 0.2,
            'right': 0.8,
            'center': 0.5,
            'middle': 0.5
        }
        
        for keyword, value in position_keywords.items():
            if keyword in layout_text.lower():
                structure['hierarchy'].append({
                    'position': keyword,
                    'confidence': 0.7
                })
        
        return structure
    
    def extract_text_regions(self, image: np.ndarray) -> List[Dict]:
        """
        Extract text regions from image using Pix2Struct
        
        Args:
            image: Input image as numpy array
        
        Returns:
            List of text region dictionaries
        """
        try:
            pil_image = Image.fromarray(image)
            
            prompt = "List all text elements in this image with their content and approximate positions."
            
            inputs = self.processor(
                images=pil_image,
                text=prompt,
                return_tensors="pt"
            ).to(self.device)
            
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=256,
                    num_beams=4
                )
            
            text_info = self.processor.decode(outputs[0], skip_special_tokens=True)
            
            # Parse text information
            text_regions = self._parse_text_regions(text_info, image.shape[:2])
            
            return text_regions
        
        except Exception as e:
            raise Exception(f"Text region extraction failed: {str(e)}")
    
    def _parse_text_regions(self, text_info: str, image_shape: tuple) -> List[Dict]:
        """
        Parse text information into structured regions
        
        Args:
            text_info: Generated text information
            image_shape: Image dimensions (h, w)
        
        Returns:
            List of text region dictionaries
        """
        regions = []
        h, w = image_shape
        
        # Split by common delimiters
        lines = text_info.split('\n')
        
        for idx, line in enumerate(lines):
            if line.strip():
                # Try to extract text content
                text_match = re.search(r'["\']([^"\']+)["\']', line)
                if text_match:
                    content = text_match.group(1)
                else:
                    content = line.strip()
                
                # Estimate position based on index (top to bottom)
                estimated_y = int((idx + 1) * h / (len(lines) + 1))
                
                regions.append({
                    'id': f'text_region_{idx}',
                    'content': content,
                    'estimated_position': {
                        'x': w // 2,  # Center horizontally
                        'y': estimated_y
                    },
                    'confidence': 0.7
                })
        
        return regions
    
    def detect_visual_hierarchy(self, image: np.ndarray) -> Dict:
        """
        Detect visual hierarchy and relationships between elements
        
        Args:
            image: Input image as numpy array
        
        Returns:
            Hierarchy information
        """
        try:
            pil_image = Image.fromarray(image)
            
            prompt = "Describe the visual hierarchy of this image, including title, headings, body text, and visual elements."
            
            inputs = self.processor(
                images=pil_image,
                text=prompt,
                return_tensors="pt"
            ).to(self.device)
            
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=384,
                    num_beams=4
                )
            
            hierarchy_text = self.processor.decode(outputs[0], skip_special_tokens=True)
            
            return {
                'description': hierarchy_text,
                'levels': self._extract_hierarchy_levels(hierarchy_text)
            }
        
        except Exception as e:
            raise Exception(f"Hierarchy detection failed: {str(e)}")
    
    def _extract_hierarchy_levels(self, hierarchy_text: str) -> List[Dict]:
        """
        Extract hierarchy levels from description
        
        Args:
            hierarchy_text: Generated hierarchy description
        
        Returns:
            List of hierarchy levels
        """
        levels = []
        
        # Common hierarchy keywords
        hierarchy_keywords = {
            'title': 1,
            'heading': 2,
            'subheading': 3,
            'body': 4,
            'caption': 5,
            'footer': 6
        }
        
        for keyword, level in hierarchy_keywords.items():
            if keyword in hierarchy_text.lower():
                levels.append({
                    'type': keyword,
                    'level': level,
                    'found': True
                })
        
        return sorted(levels, key=lambda x: x['level'])
