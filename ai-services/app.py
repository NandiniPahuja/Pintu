from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config
from app.routes import image_routes
import os


def create_app():
    """Application factory"""
    app = Flask(__name__)
    
    # Load configuration
    app.config['MAX_CONTENT_LENGTH'] = Config.MAX_CONTENT_LENGTH
    
    # Initialize directories
    Config.init_app()
    
    # Enable CORS
    CORS(app, origins=Config.CORS_ORIGINS)
    
    # Register blueprints
    app.register_blueprint(image_routes.bp)
    
    # Root endpoint
    @app.route('/')
    def index():
        return jsonify({
            'service': 'PixMorph AI Service',
            'version': '1.0.0',
            'status': 'running',
            'endpoints': {
                'process': '/api/image/process',
                'segment': '/api/image/segment',
                'ocr': '/api/image/ocr',
                'layout': '/api/image/layout',
                'colors': '/api/image/colors',
                'health': '/api/image/health'
            }
        })
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    @app.errorhandler(413)
    def file_too_large(error):
        return jsonify({'error': 'File too large'}), 413
    
    return app


if __name__ == '__main__':
    app = create_app()
    
    print("\n" + "="*60)
    print("🎨 PixMorph AI Service")
    print("="*60)
    print(f"🌐 Server: http://{Config.HOST}:{Config.PORT}")
    print(f"🔧 Device: {Config.DEVICE}")
    print(f"📝 OCR: {Config.OCR_BACKEND}")
    print(f"📁 Uploads: {Config.UPLOAD_FOLDER}")
    print(f"🤖 Models: {Config.MODELS_DIR}")
    print("="*60 + "\n")
    
    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG
    )
