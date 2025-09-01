"""
MobileSAM Segmentation Module

This module provides lightweight segmentation capabilities using MobileSAM,
a distilled version of Segment Anything Model optimized for mobile/CPU inference.

Features:
- CPU-optimized inference with ONNX Runtime
- Automatic segmentation (no prompts needed)
- Multiple object detection and cutout generation
- Base64 PNG encoding for web integration
"""

import logging
import io
import base64
import os
import urllib.request
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from PIL import Image
import cv2

# Configure logging
logger = logging.getLogger(__name__)

# Try to import required packages with graceful fallback
try:
    import onnxruntime as ort
    ONNX_AVAILABLE = True
    logger.info("ONNX Runtime available - using optimized inference")
except ImportError:
    ONNX_AVAILABLE = False
    logger.warning("ONNX Runtime not available - falling back to PyTorch")

try:
    import torch
    import torchvision.transforms as transforms
    TORCH_AVAILABLE = True
    logger.info("PyTorch available")
except ImportError:
    TORCH_AVAILABLE = False
    logger.error("Neither ONNX Runtime nor PyTorch available - segmentation will not work")

# Model URLs and paths
MOBILE_SAM_MODELS = {
    "encoder_onnx": {
        "url": "https://github.com/ChaoningZhang/MobileSAM/releases/download/v1.0/mobile_sam_encoder.onnx",
        "filename": "mobile_sam_encoder.onnx"
    },
    "decoder_onnx": {
        "url": "https://github.com/ChaoningZhang/MobileSAM/releases/download/v1.0/mobile_sam_decoder.onnx", 
        "filename": "mobile_sam_decoder.onnx"
    },
    "pytorch": {
        "url": "https://github.com/ChaoningZhang/MobileSAM/releases/download/v1.0/mobile_sam.pt",
        "filename": "mobile_sam.pt"
    }
}

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

class MobileSAMSegmenter:
    """
    MobileSAM-based image segmentation with CPU optimization
    """
    
    def __init__(self, use_onnx: bool = True):
        """
        Initialize the segmenter
        
        Args:
            use_onnx: Whether to use ONNX Runtime (faster) or PyTorch
        """
        self.use_onnx = use_onnx and ONNX_AVAILABLE
        self.encoder_session = None
        self.decoder_session = None
        self.torch_model = None
        self.device = 'cpu'
        self.initialized = False
        
        logger.info(f"Initializing MobileSAM segmenter (ONNX: {self.use_onnx})")
    
    def _download_model(self, model_key: str) -> str:
        """Download model file if not exists"""
        model_info = MOBILE_SAM_MODELS[model_key]
        model_path = os.path.join(MODEL_DIR, model_info["filename"])
        
        if not os.path.exists(model_path):
            logger.info(f"Downloading {model_key} model...")
            try:
                urllib.request.urlretrieve(model_info["url"], model_path)
                logger.info(f"Model downloaded: {model_path}")
            except Exception as e:
                logger.error(f"Failed to download model {model_key}: {e}")
                raise RuntimeError(f"Could not download required model: {e}")
        
        return model_path
    
    def initialize(self) -> bool:
        """
        Initialize the segmentation models
        
        Returns:
            True if initialization successful, False otherwise
        """
        try:
            if self.use_onnx:
                return self._initialize_onnx()
            else:
                return self._initialize_pytorch()
        except Exception as e:
            logger.error(f"Failed to initialize MobileSAM: {e}")
            return False
    
    def _initialize_onnx(self) -> bool:
        """Initialize ONNX Runtime models"""
        if not ONNX_AVAILABLE:
            logger.error("ONNX Runtime not available")
            return False
        
        try:
            # Download models if needed
            encoder_path = self._download_model("encoder_onnx")
            decoder_path = self._download_model("decoder_onnx")
            
            # Create ONNX sessions with CPU optimization
            providers = ['CPUExecutionProvider']
            session_options = ort.SessionOptions()
            session_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
            session_options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
            session_options.inter_op_num_threads = min(4, os.cpu_count())
            session_options.intra_op_num_threads = min(4, os.cpu_count())
            
            self.encoder_session = ort.InferenceSession(
                encoder_path, 
                providers=providers,
                sess_options=session_options
            )
            
            self.decoder_session = ort.InferenceSession(
                decoder_path,
                providers=providers, 
                sess_options=session_options
            )
            
            logger.info("ONNX models initialized successfully")
            self.initialized = True
            return True
            
        except Exception as e:
            logger.error(f"ONNX initialization failed: {e}")
            return False
    
    def _initialize_pytorch(self) -> bool:
        """Initialize PyTorch model"""
        if not TORCH_AVAILABLE:
            logger.error("PyTorch not available")
            return False
        
        try:
            # For this implementation, we'll use a simplified approach
            # In production, you would load the actual MobileSAM PyTorch model
            logger.warning("PyTorch MobileSAM not fully implemented - using fallback segmentation")
            self.initialized = True
            return True
            
        except Exception as e:
            logger.error(f"PyTorch initialization failed: {e}")
            return False
    
    def _preprocess_image(self, image: Image.Image) -> Tuple[np.ndarray, Tuple[int, int]]:
        """
        Preprocess image for MobileSAM
        
        Args:
            image: Input PIL Image
            
        Returns:
            Preprocessed image array and original size
        """
        original_size = image.size
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize to model input size (1024x1024 for SAM)
        target_size = 1024
        image_resized = image.resize((target_size, target_size), Image.Resampling.LANCZOS)
        
        # Convert to numpy array and normalize
        image_array = np.array(image_resized).astype(np.float32)
        image_array = image_array / 255.0
        
        # SAM expects (B, C, H, W) format
        image_array = np.transpose(image_array, (2, 0, 1))  # HWC -> CHW
        image_array = np.expand_dims(image_array, axis=0)  # Add batch dimension
        
        return image_array, original_size
    
    def _postprocess_masks(self, masks: np.ndarray, original_size: Tuple[int, int]) -> List[np.ndarray]:
        """
        Postprocess segmentation masks
        
        Args:
            masks: Raw masks from model
            original_size: Original image size (width, height)
            
        Returns:
            List of processed mask arrays
        """
        processed_masks = []
        
        for mask in masks:
            # Resize mask to original image size
            mask_resized = cv2.resize(
                mask.astype(np.uint8),
                original_size,
                interpolation=cv2.INTER_NEAREST
            )
            
            # Apply morphological operations to clean up mask
            kernel = np.ones((3, 3), np.uint8)
            mask_cleaned = cv2.morphologyEx(mask_resized, cv2.MORPH_CLOSE, kernel)
            mask_cleaned = cv2.morphologyEx(mask_cleaned, cv2.MORPH_OPEN, kernel)
            
            processed_masks.append(mask_cleaned)
        
        return processed_masks
    
    def _fallback_segmentation(self, image: Image.Image) -> List[np.ndarray]:
        """
        Fallback segmentation using traditional computer vision
        when MobileSAM models are not available
        """
        # Convert to numpy array
        img_array = np.array(image.convert('RGB'))
        
        # Apply GrabCut algorithm for foreground extraction
        height, width = img_array.shape[:2]
        
        # Create initial mask (assume object is in center 60% of image)
        mask = np.zeros((height, width), np.uint8)
        center_margin = 0.2
        y1, y2 = int(height * center_margin), int(height * (1 - center_margin))
        x1, x2 = int(width * center_margin), int(width * (1 - center_margin))
        mask[y1:y2, x1:x2] = cv2.GC_PR_FGD
        
        # Initialize foreground and background models
        bgd_model = np.zeros((1, 65), np.float64)
        fgd_model = np.zeros((1, 65), np.float64)
        
        # Apply GrabCut
        try:
            cv2.grabCut(img_array, mask, None, bgd_model, fgd_model, 5, cv2.GC_INIT_WITH_MASK)
            
            # Create final mask
            final_mask = np.where((mask == 2) | (mask == 0), 0, 255).astype(np.uint8)
            
            # Find contours to separate objects
            contours, _ = cv2.findContours(final_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            masks = []
            for contour in contours:
                # Filter small contours
                area = cv2.contourArea(contour)
                if area > 1000:  # Minimum area threshold
                    mask = np.zeros((height, width), np.uint8)
                    cv2.fillPoly(mask, [contour], 255)
                    masks.append(mask)
            
            return masks if masks else [final_mask]
            
        except Exception as e:
            logger.warning(f"Fallback segmentation failed: {e}")
            # Return a simple center mask as last resort
            mask = np.zeros((height, width), np.uint8)
            mask[y1:y2, x1:x2] = 255
            return [mask]
    
    def segment_image(self, image: Image.Image) -> List[Dict[str, Any]]:
        """
        Segment image and return metadata with cutouts
        
        Args:
            image: Input PIL Image
            
        Returns:
            List of segment dictionaries with metadata and base64 PNG
        """
        if not self.initialized:
            if not self.initialize():
                logger.warning("Using fallback segmentation")
        
        try:
            if self.use_onnx and self.initialized:
                masks = self._segment_with_onnx(image)
            elif self.initialized:
                masks = self._segment_with_pytorch(image)
            else:
                masks = self._fallback_segmentation(image)
            
            return self._create_segment_results(image, masks)
            
        except Exception as e:
            logger.error(f"Segmentation failed: {e}")
            # Return fallback result
            masks = self._fallback_segmentation(image)
            return self._create_segment_results(image, masks)
    
    def _segment_with_onnx(self, image: Image.Image) -> List[np.ndarray]:
        """Run segmentation using ONNX models"""
        # Preprocess image
        image_array, original_size = self._preprocess_image(image)
        
        # Run encoder
        encoder_inputs = {self.encoder_session.get_inputs()[0].name: image_array}
        image_embeddings = self.encoder_session.run(None, encoder_inputs)[0]
        
        # For automatic segmentation, we generate a grid of points
        # This is a simplified approach - in production you might use more sophisticated prompt generation
        points = self._generate_prompt_points(image.size)
        
        # Run decoder for each prompt
        masks = []
        for point in points:
            decoder_inputs = {
                self.decoder_session.get_inputs()[0].name: image_embeddings,
                self.decoder_session.get_inputs()[1].name: point
            }
            mask_logits = self.decoder_session.run(None, decoder_inputs)[0]
            
            # Convert logits to binary mask
            mask = (mask_logits > 0).astype(np.uint8).squeeze()
            if mask.size > 0:
                masks.append(mask)
        
        return self._postprocess_masks(masks, image.size)
    
    def _segment_with_pytorch(self, image: Image.Image) -> List[np.ndarray]:
        """Run segmentation using PyTorch model"""
        # Fallback to traditional segmentation for now
        return self._fallback_segmentation(image)
    
    def _generate_prompt_points(self, image_size: Tuple[int, int]) -> List[np.ndarray]:
        """Generate a grid of prompt points for automatic segmentation"""
        width, height = image_size
        points = []
        
        # Generate a 3x3 grid of points
        for i in range(3):
            for j in range(3):
                x = width * (i + 1) / 4
                y = height * (j + 1) / 4
                # Point format: [x, y, label] where label 1 = foreground
                point = np.array([[[x, y, 1]]], dtype=np.float32)
                points.append(point)
        
        return points
    
    def _create_segment_results(self, image: Image.Image, masks: List[np.ndarray]) -> List[Dict[str, Any]]:
        """
        Create final segment results with metadata and base64 PNGs
        
        Args:
            image: Original image
            masks: List of segmentation masks
            
        Returns:
            List of segment metadata dictionaries
        """
        results = []
        image_array = np.array(image.convert('RGBA'))
        
        for i, mask in enumerate(masks):
            try:
                # Calculate bounding box
                contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                if not contours:
                    continue
                
                # Find largest contour (main object)
                largest_contour = max(contours, key=cv2.contourArea)
                x, y, w, h = cv2.boundingRect(largest_contour)
                bbox = [x, y, w, h]
                
                # Calculate mask area
                mask_area = int(np.sum(mask > 0))
                
                # Create cutout PNG
                cutout = image_array.copy()
                
                # Apply mask to alpha channel
                alpha_mask = mask.astype(np.uint8)
                cutout[:, :, 3] = alpha_mask
                
                # Crop to bounding box with some padding
                padding = 10
                x1 = max(0, x - padding)
                y1 = max(0, y - padding)
                x2 = min(image_array.shape[1], x + w + padding)
                y2 = min(image_array.shape[0], y + h + padding)
                
                cropped_cutout = cutout[y1:y2, x1:x2]
                
                # Convert to PIL and encode as base64 PNG
                cutout_image = Image.fromarray(cropped_cutout, 'RGBA')
                buffer = io.BytesIO()
                cutout_image.save(buffer, format='PNG', optimize=True)
                png_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                
                # Create result dictionary
                result = {
                    "id": f"segment_{i}",
                    "bbox": bbox,
                    "maskArea": mask_area,
                    "pngBase64": png_base64,
                    "confidence": 0.9  # Placeholder confidence score
                }
                
                results.append(result)
                
            except Exception as e:
                logger.warning(f"Failed to process segment {i}: {e}")
                continue
        
        logger.info(f"Generated {len(results)} segments")
        return results

# Global segmenter instance
_segmenter_instance: Optional[MobileSAMSegmenter] = None

def get_segmenter() -> MobileSAMSegmenter:
    """Get or create global segmenter instance"""
    global _segmenter_instance
    
    if _segmenter_instance is None:
        _segmenter_instance = MobileSAMSegmenter(use_onnx=ONNX_AVAILABLE)
    
    return _segmenter_instance

def segment_image(image: Image.Image) -> List[Dict[str, Any]]:
    """
    Convenience function to segment an image
    
    Args:
        image: Input PIL Image
        
    Returns:
        List of segment dictionaries with metadata and base64 PNG
    """
    segmenter = get_segmenter()
    return segmenter.segment_image(image)
