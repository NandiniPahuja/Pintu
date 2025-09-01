"""
Shared pytest fixtures and configuration
"""
import pytest
import os
import tempfile
import shutil
from PIL import Image
import io

@pytest.fixture(scope="session")
def temp_dir():
    """Create a temporary directory for test files"""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir)

@pytest.fixture
def sample_images():
    """Create sample images for testing"""
    images = {}
    
    # Small RGB image
    rgb_image = Image.new('RGB', (100, 100), color='red')
    rgb_buffer = io.BytesIO()
    rgb_image.save(rgb_buffer, format='PNG')
    rgb_buffer.seek(0)
    images['rgb_png'] = rgb_buffer.getvalue()
    
    # RGBA image with transparency
    rgba_image = Image.new('RGBA', (100, 100), color=(0, 255, 0, 128))
    rgba_buffer = io.BytesIO()
    rgba_image.save(rgba_buffer, format='PNG')
    rgba_buffer.seek(0)
    images['rgba_png'] = rgba_buffer.getvalue()
    
    # JPEG image
    jpeg_image = Image.new('RGB', (100, 100), color='blue')
    jpeg_buffer = io.BytesIO()
    jpeg_image.save(jpeg_buffer, format='JPEG')
    jpeg_buffer.seek(0)
    images['jpeg'] = jpeg_buffer.getvalue()
    
    return images

@pytest.fixture
def mock_large_image():
    """Create a mock large image data for testing file size limits"""
    return b'x' * (11 * 1024 * 1024)  # 11MB of data

@pytest.fixture
def assets_exist():
    """Check if test assets exist and create them if needed"""
    assets_dir = os.path.join(os.path.dirname(__file__), 'assets')
    test_image = os.path.join(assets_dir, 'test_image.png')
    
    if not os.path.exists(test_image):
        # Create assets if they don't exist
        from tests.create_assets import create_test_images
        create_test_images()
    
    return assets_dir
