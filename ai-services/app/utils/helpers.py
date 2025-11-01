import os
import uuid
import cv2
import numpy as np
from werkzeug.utils import secure_filename
from ..config import Config


def allowed_file(filename: str) -> bool:
    """
    Check if file extension is allowed
    
    Args:
        filename: Name of file
    
    Returns:
        True if allowed, False otherwise
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS


def save_upload_file(file) -> str:
    """
    Save uploaded file to disk
    
    Args:
        file: FileStorage object from Flask request
    
    Returns:
        Path to saved file
    """
    filename = secure_filename(file.filename)
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}_{filename}"
    filepath = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
    
    # Save file
    file.save(filepath)
    
    return filepath


def load_image(filepath: str) -> np.ndarray:
    """
    Load image from file
    
    Args:
        filepath: Path to image file
    
    Returns:
        Image as numpy array (RGB) or None if failed
    """
    try:
        # Read image
        image = cv2.imread(filepath)
        
        if image is None:
            return None
        
        # Convert BGR to RGB
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        return image
    
    except Exception as e:
        print(f"❌ Error loading image: {str(e)}")
        return None


def resize_image(image: np.ndarray, max_size: int = None) -> np.ndarray:
    """
    Resize image if it's too large
    
    Args:
        image: Input image
        max_size: Maximum dimension size
    
    Returns:
        Resized image
    """
    if max_size is None:
        max_size = Config.MAX_IMAGE_SIZE
    
    h, w = image.shape[:2]
    
    if max(h, w) > max_size:
        scale = max_size / max(h, w)
        new_h, new_w = int(h * scale), int(w * scale)
        image = cv2.resize(image, (new_w, new_h))
    
    return image


def get_file_extension(filename: str) -> str:
    """Get file extension"""
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''


def cleanup_old_files(directory: str, max_age_hours: int = 24):
    """
    Clean up old files from directory
    
    Args:
        directory: Directory to clean
        max_age_hours: Maximum age in hours
    """
    import time
    
    if not os.path.exists(directory):
        return
    
    current_time = time.time()
    max_age_seconds = max_age_hours * 3600
    
    for filename in os.listdir(directory):
        filepath = os.path.join(directory, filename)
        
        if os.path.isfile(filepath):
            file_age = current_time - os.path.getmtime(filepath)
            
            if file_age > max_age_seconds:
                try:
                    os.remove(filepath)
                    print(f"🗑️  Removed old file: {filename}")
                except Exception as e:
                    print(f"⚠️  Failed to remove {filename}: {str(e)}")
