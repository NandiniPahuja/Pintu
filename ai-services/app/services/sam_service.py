import torch
import numpy as np
import cv2
from typing import List, Dict, Tuple, Optional
from segment_anything import sam_model_registry, SamAutomaticMaskGenerator, SamPredictor
from ..config import Config
import os
import urllib.request


class SAMService:
    """Service for Segment Anything Model (SAM) integration"""
    
    def __init__(self):
        self.device = Config.DEVICE
        self.model = None
        self.mask_generator = None
        self.predictor = None
        self._load_model()
    
    def _download_checkpoint(self):
        """Download SAM checkpoint if not exists"""
        checkpoint_path = os.path.join(Config.MODELS_DIR, Config.SAM_CHECKPOINT)
        
        if os.path.exists(checkpoint_path):
            print(f"✅ SAM checkpoint found: {checkpoint_path}")
            return checkpoint_path
        
        print(f"⬇️  Downloading SAM checkpoint...")
        
        # SAM model URLs
        model_urls = {
            'sam_vit_h_4b8939.pth': 'https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth',
            'sam_vit_l_0b3195.pth': 'https://dl.fbaipublicfiles.com/segment_anything/sam_vit_l_0b3195.pth',
            'sam_vit_b_01ec64.pth': 'https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth'
        }
        
        if Config.SAM_CHECKPOINT not in model_urls:
            raise ValueError(f"Unknown SAM checkpoint: {Config.SAM_CHECKPOINT}")
        
        url = model_urls[Config.SAM_CHECKPOINT]
        
        try:
            urllib.request.urlretrieve(url, checkpoint_path)
            print(f"✅ Downloaded SAM checkpoint to {checkpoint_path}")
            return checkpoint_path
        except Exception as e:
            raise Exception(f"Failed to download SAM checkpoint: {str(e)}")
    
    def _load_model(self):
        """Load SAM model with pretrained weights"""
        try:
            checkpoint_path = self._download_checkpoint()
            
            print(f"📦 Loading SAM model: {Config.SAM_MODEL_TYPE}")
            self.model = sam_model_registry[Config.SAM_MODEL_TYPE](checkpoint=checkpoint_path)
            self.model.to(device=self.device)
            
            # Initialize mask generator for automatic segmentation
            self.mask_generator = SamAutomaticMaskGenerator(
                model=self.model,
                points_per_side=32,
                pred_iou_thresh=0.86,
                stability_score_thresh=0.92,
                crop_n_layers=1,
                crop_n_points_downscale_factor=2,
                min_mask_region_area=Config.MIN_SEGMENT_AREA
            )
            
            # Initialize predictor for prompt-based segmentation
            self.predictor = SamPredictor(self.model)
            
            print(f"✅ SAM model loaded successfully on {self.device}")
        except Exception as e:
            raise Exception(f"Failed to load SAM model: {str(e)}")
    
    def segment_image(self, image: np.ndarray) -> List[Dict]:
        """
        Perform automatic segmentation on image
        
        Args:
            image: Input image as numpy array (RGB)
        
        Returns:
            List of segment dictionaries with masks and bounding boxes
        """
        try:
            # Resize if image is too large
            h, w = image.shape[:2]
            if max(h, w) > Config.MAX_IMAGE_SIZE:
                scale = Config.MAX_IMAGE_SIZE / max(h, w)
                new_h, new_w = int(h * scale), int(w * scale)
                image = cv2.resize(image, (new_w, new_h))
            
            # Generate masks
            print(f"🔍 Generating masks for image of size {image.shape[:2]}")
            masks = self.mask_generator.generate(image)
            
            # Process masks
            segments = []
            for idx, mask_data in enumerate(masks):
                segment = self._process_mask(mask_data, idx, image.shape[:2])
                if segment:
                    segments.append(segment)
            
            # Sort by area (largest first)
            segments.sort(key=lambda x: x['area'], reverse=True)
            
            print(f"✅ Found {len(segments)} segments")
            return segments
        
        except Exception as e:
            raise Exception(f"SAM segmentation failed: {str(e)}")
    
    def _process_mask(self, mask_data: Dict, idx: int, image_shape: Tuple[int, int]) -> Optional[Dict]:
        """
        Process a single mask and extract relevant information
        
        Args:
            mask_data: Mask data from SAM
            idx: Segment index
            image_shape: Original image shape (h, w)
        
        Returns:
            Processed segment dictionary
        """
        try:
            segmentation = mask_data['segmentation']
            bbox = mask_data['bbox']  # x, y, w, h
            area = mask_data['area']
            predicted_iou = mask_data['predicted_iou']
            stability_score = mask_data['stability_score']
            
            # Filter out very small segments
            if area < Config.MIN_SEGMENT_AREA:
                return None
            
            # Convert bbox to (x, y, width, height)
            x, y, w, h = bbox
            
            # Calculate center point
            center_x = x + w / 2
            center_y = y + h / 2
            
            # Determine segment type based on aspect ratio and position
            aspect_ratio = w / h if h > 0 else 1.0
            segment_type = self._infer_segment_type(aspect_ratio, area, image_shape)
            
            return {
                'id': f'segment_{idx}',
                'mask': segmentation.tolist(),  # Binary mask
                'bbox': {
                    'x': int(x),
                    'y': int(y),
                    'width': int(w),
                    'height': int(h)
                },
                'center': {
                    'x': float(center_x),
                    'y': float(center_y)
                },
                'area': int(area),
                'predicted_iou': float(predicted_iou),
                'stability_score': float(stability_score),
                'aspect_ratio': float(aspect_ratio),
                'type': segment_type
            }
        
        except Exception as e:
            print(f"⚠️  Error processing mask {idx}: {str(e)}")
            return None
    
    def _infer_segment_type(self, aspect_ratio: float, area: int, image_shape: Tuple[int, int]) -> str:
        """
        Infer segment type based on geometric properties
        
        Args:
            aspect_ratio: Width/height ratio
            area: Segment area in pixels
            image_shape: Image dimensions (h, w)
        
        Returns:
            Segment type: 'text', 'shape', 'background', or 'icon'
        """
        total_area = image_shape[0] * image_shape[1]
        area_ratio = area / total_area
        
        # Background typically covers large area
        if area_ratio > 0.5:
            return 'background'
        
        # Text blocks are typically horizontal
        if 1.5 < aspect_ratio < 10 and area_ratio < 0.3:
            return 'text'
        
        # Icons/logos are typically smaller and more square
        if 0.5 < aspect_ratio < 2.0 and area_ratio < 0.1:
            return 'icon'
        
        # Default to shape
        return 'shape'
    
    def segment_with_points(self, image: np.ndarray, points: List[Tuple[int, int]], 
                           labels: List[int]) -> Dict:
        """
        Perform segmentation with point prompts
        
        Args:
            image: Input image as numpy array (RGB)
            points: List of (x, y) coordinates
            labels: List of labels (1 for foreground, 0 for background)
        
        Returns:
            Segmentation result with mask and score
        """
        try:
            self.predictor.set_image(image)
            
            point_coords = np.array(points)
            point_labels = np.array(labels)
            
            masks, scores, logits = self.predictor.predict(
                point_coords=point_coords,
                point_labels=point_labels,
                multimask_output=True
            )
            
            # Select best mask
            best_idx = np.argmax(scores)
            
            return {
                'mask': masks[best_idx].tolist(),
                'score': float(scores[best_idx])
            }
        
        except Exception as e:
            raise Exception(f"Point-based segmentation failed: {str(e)}")
    
    def extract_segment_image(self, image: np.ndarray, mask: np.ndarray) -> np.ndarray:
        """
        Extract segment from image using mask
        
        Args:
            image: Original image
            mask: Binary mask
        
        Returns:
            Extracted segment with transparent background
        """
        # Create RGBA image
        if len(image.shape) == 2:
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
        
        result = np.zeros((image.shape[0], image.shape[1], 4), dtype=np.uint8)
        result[:, :, :3] = image
        result[:, :, 3] = (mask * 255).astype(np.uint8)
        
        return result
