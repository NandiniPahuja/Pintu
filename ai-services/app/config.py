import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Server Config
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5000))
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    
    # Model Config
    MODELS_DIR = os.getenv('MODELS_DIR', './models')
    
    # SAM Model
    SAM_CHECKPOINT = os.getenv('SAM_CHECKPOINT', 'sam_vit_h_4b8939.pth')
    SAM_MODEL_TYPE = os.getenv('SAM_MODEL_TYPE', 'vit_h')  # vit_h, vit_l, vit_b
    
    # Pix2Struct Model
    PIX2STRUCT_MODEL = os.getenv('PIX2STRUCT_MODEL', 'google/pix2struct-base')
    
    # Device Config
    DEVICE = os.getenv('DEVICE', 'cuda' if __import__('torch').cuda.is_available() else 'cpu')
    
    # OCR Config
    OCR_BACKEND = os.getenv('OCR_BACKEND', 'paddleocr')  # paddleocr or tesseract
    TESSERACT_CMD = os.getenv('TESSERACT_CMD', None)  # Path to tesseract executable
    
    # Processing Config
    MAX_IMAGE_SIZE = int(os.getenv('MAX_IMAGE_SIZE', 2048))
    MIN_SEGMENT_AREA = int(os.getenv('MIN_SEGMENT_AREA', 100))
    
    # Upload Config
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', './uploads')
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'svg'}
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3001').split(',')
    
    @staticmethod
    def init_app():
        """Initialize application directories"""
        os.makedirs(Config.MODELS_DIR, exist_ok=True)
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        print(f"🚀 Using device: {Config.DEVICE}")
        print(f"📁 Models directory: {Config.MODELS_DIR}")
        print(f"📁 Upload directory: {Config.UPLOAD_FOLDER}")
