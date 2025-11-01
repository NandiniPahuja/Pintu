from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
import cv2
import numpy as np
from ..config import Config
from ..services.processor import ImageProcessor
from ..utils.helpers import allowed_file, save_upload_file, load_image

bp = Blueprint('image', __name__, url_prefix='/api/image')

# Initialize processor (singleton)
processor = None


def get_processor():
    """Get or create processor instance"""
    global processor
    if processor is None:
        processor = ImageProcessor()
    return processor


@bp.route('/process', methods=['POST'])
def process_image():
    """
    Process uploaded image with SAM + Pix2Struct + OCR
    
    Expected: multipart/form-data with 'image' file
    
    Returns: JSON with editable layers
    """
    try:
        # Validate request
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({'error': 'Empty filename'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': f'Invalid file type. Allowed: {Config.ALLOWED_EXTENSIONS}'}), 400
        
        # Save file
        filepath = save_upload_file(file)
        
        # Load image
        image = load_image(filepath)
        
        if image is None:
            return jsonify({'error': 'Failed to load image'}), 500
        
        # Process image
        print(f"📸 Processing image: {file.filename}")
        proc = get_processor()
        result = proc.process_image(image)
        
        # Clean up
        try:
            os.remove(filepath)
        except:
            pass
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
    
    except Exception as e:
        print(f"❌ Error processing image: {str(e)}")
        return jsonify({'error': str(e)}), 500


@bp.route('/segment', methods=['POST'])
def segment_only():
    """
    Perform only SAM segmentation
    
    Returns: Segments with masks and bounding boxes
    """
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        filepath = save_upload_file(file)
        image = load_image(filepath)
        
        if image is None:
            return jsonify({'error': 'Failed to load image'}), 500
        
        # Get processor and run SAM only
        proc = get_processor()
        segments = proc.sam_service.segment_image(image)
        
        # Clean up
        try:
            os.remove(filepath)
        except:
            pass
        
        return jsonify({
            'success': True,
            'segments': segments,
            'count': len(segments)
        }), 200
    
    except Exception as e:
        print(f"❌ Error in segmentation: {str(e)}")
        return jsonify({'error': str(e)}), 500


@bp.route('/ocr', methods=['POST'])
def ocr_only():
    """
    Perform only OCR text extraction
    
    Returns: Text elements with positions
    """
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        filepath = save_upload_file(file)
        image = load_image(filepath)
        
        if image is None:
            return jsonify({'error': 'Failed to load image'}), 500
        
        # Get processor and run OCR only
        proc = get_processor()
        text_elements = proc.ocr_service.extract_text(image)
        
        # Clean up
        try:
            os.remove(filepath)
        except:
            pass
        
        return jsonify({
            'success': True,
            'text_elements': text_elements,
            'count': len(text_elements)
        }), 200
    
    except Exception as e:
        print(f"❌ Error in OCR: {str(e)}")
        return jsonify({'error': str(e)}), 500


@bp.route('/layout', methods=['POST'])
def analyze_layout():
    """
    Perform only Pix2Struct layout analysis
    
    Returns: Layout structure
    """
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        filepath = save_upload_file(file)
        image = load_image(filepath)
        
        if image is None:
            return jsonify({'error': 'Failed to load image'}), 500
        
        # Get processor and run Pix2Struct only
        proc = get_processor()
        layout = proc.pix2struct_service.analyze_layout(image)
        
        # Clean up
        try:
            os.remove(filepath)
        except:
            pass
        
        return jsonify({
            'success': True,
            'layout': layout
        }), 200
    
    except Exception as e:
        print(f"❌ Error in layout analysis: {str(e)}")
        return jsonify({'error': str(e)}), 500


@bp.route('/colors', methods=['POST'])
def extract_colors():
    """
    Extract color palette from image
    
    Returns: Color palette
    """
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        filepath = save_upload_file(file)
        image = load_image(filepath)
        
        if image is None:
            return jsonify({'error': 'Failed to load image'}), 500
        
        # Get processor and extract colors
        proc = get_processor()
        colors = proc._extract_color_palette(image)
        
        # Clean up
        try:
            os.remove(filepath)
        except:
            pass
        
        return jsonify({
            'success': True,
            'colors': colors
        }), 200
    
    except Exception as e:
        print(f"❌ Error extracting colors: {str(e)}")
        return jsonify({'error': str(e)}), 500


@bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'PixMorph AI Service',
        'device': Config.DEVICE,
        'ocr_backend': Config.OCR_BACKEND
    }), 200
