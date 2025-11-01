"""
Minimal Flask app to test if the service is working
"""
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return jsonify({
        'service': 'PixMorph AI Service',
        'status': 'running',
        'message': 'Basic server is working! AI models will be loaded once dependencies are installed.'
    })

@app.route('/api/image/health')
def health():
    return jsonify({
        'status': 'healthy',
        'message': 'Service is running (minimal mode)'
    })

if __name__ == '__main__':
    print("="*60)
    print("🎨 PixMorph AI Service (Minimal Mode)")
    print("="*60)
    print("🌐 Server: http://localhost:5000")
    print("📝 Note: Full AI features require all dependencies")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
