"""
Unit tests for the /remove-bg endpoint
"""
import pytest
import os
import io
from fastapi.testclient import TestClient
from PIL import Image
import json

# Import the FastAPI app
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from app.main import app

client = TestClient(app)

class TestRemoveBackground:
    """Test suite for the /remove-bg endpoint"""
    
    @pytest.fixture
    def assets_dir(self):
        """Get the path to test assets directory"""
        return os.path.join(os.path.dirname(__file__), 'assets')
    
    @pytest.fixture
    def test_image_path(self, assets_dir):
        """Path to the main test image"""
        return os.path.join(assets_dir, 'test_image.png')
    
    @pytest.fixture
    def test_jpeg_path(self, assets_dir):
        """Path to the JPEG test image"""
        return os.path.join(assets_dir, 'test_image.jpg')
    
    @pytest.fixture
    def test_rgba_path(self, assets_dir):
        """Path to the RGBA test image"""
        return os.path.join(assets_dir, 'test_image_rgba.png')
    
    @pytest.fixture
    def tiny_image_path(self, assets_dir):
        """Path to the tiny test image"""
        return os.path.join(assets_dir, 'tiny_image.png')
    
    @pytest.fixture
    def invalid_file_path(self, assets_dir):
        """Path to the invalid file"""
        return os.path.join(assets_dir, 'not_an_image.txt')

    def test_health_endpoint(self):
        """Test the health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_remove_bg_success_png(self, test_image_path):
        """Test successful background removal with PNG image"""
        with open(test_image_path, "rb") as f:
            response = client.post(
                "/remove-bg",
                files={"file": ("test_image.png", f, "image/png")}
            )
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "image/png"
        assert "Content-Disposition" in response.headers
        assert "cutout_test_image.png" in response.headers["Content-Disposition"]
        
        # Verify the response is a valid PNG image with alpha channel
        image_data = io.BytesIO(response.content)
        output_image = Image.open(image_data)
        assert output_image.format == "PNG"
        assert output_image.mode == "RGBA"  # Should have alpha channel
        assert output_image.size == (50, 50)  # Same size as input

    def test_remove_bg_success_jpeg(self, test_jpeg_path):
        """Test successful background removal with JPEG image"""
        with open(test_jpeg_path, "rb") as f:
            response = client.post(
                "/remove-bg",
                files={"file": ("test_image.jpg", f, "image/jpeg")}
            )
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "image/png"
        
        # Verify the response is a valid PNG with alpha
        image_data = io.BytesIO(response.content)
        output_image = Image.open(image_data)
        assert output_image.format == "PNG"
        assert output_image.mode == "RGBA"

    def test_remove_bg_success_rgba(self, test_rgba_path):
        """Test successful background removal with RGBA image"""
        with open(test_rgba_path, "rb") as f:
            response = client.post(
                "/remove-bg",
                files={"file": ("test_image_rgba.png", f, "image/png")}
            )
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "image/png"
        
        # Verify the response
        image_data = io.BytesIO(response.content)
        output_image = Image.open(image_data)
        assert output_image.format == "PNG"
        assert output_image.mode == "RGBA"

    def test_remove_bg_no_file(self):
        """Test endpoint with no file uploaded"""
        response = client.post("/remove-bg")
        
        assert response.status_code == 422  # Unprocessable Entity
        # FastAPI returns validation error for missing required field

    def test_remove_bg_invalid_content_type(self, invalid_file_path):
        """Test endpoint with invalid file type"""
        with open(invalid_file_path, "rb") as f:
            response = client.post(
                "/remove-bg",
                files={"file": ("not_an_image.txt", f, "text/plain")}
            )
        
        assert response.status_code == 400
        error_data = response.json()
        assert error_data["detail"]["error"] == "invalid_file_type"
        assert "must be an image" in error_data["detail"]["message"]
        assert "accepted_types" in error_data["detail"]

    def test_remove_bg_corrupted_image(self):
        """Test endpoint with corrupted image data"""
        corrupted_data = b"This is not image data"
        
        response = client.post(
            "/remove-bg",
            files={"file": ("corrupted.png", io.BytesIO(corrupted_data), "image/png")}
        )
        
        assert response.status_code == 400
        error_data = response.json()
        assert error_data["detail"]["error"] == "invalid_image"

    def test_remove_bg_tiny_image(self, tiny_image_path):
        """Test endpoint with very small image"""
        with open(tiny_image_path, "rb") as f:
            response = client.post(
                "/remove-bg",
                files={"file": ("tiny_image.png", f, "image/png")}
            )
        
        assert response.status_code == 400
        error_data = response.json()
        assert error_data["detail"]["error"] == "image_too_small"
        assert error_data["detail"]["min_width"] == 10
        assert error_data["detail"]["min_height"] == 10

    def test_remove_bg_empty_file(self):
        """Test endpoint with empty file"""
        empty_data = b""
        
        response = client.post(
            "/remove-bg",
            files={"file": ("empty.png", io.BytesIO(empty_data), "image/png")}
        )
        
        assert response.status_code == 400
        error_data = response.json()
        assert error_data["detail"]["error"] == "file_too_small"

    def test_remove_bg_large_file(self):
        """Test endpoint with file that's too large"""
        # Create a large fake file (11MB of data)
        large_data = b"x" * (11 * 1024 * 1024)
        
        response = client.post(
            "/remove-bg",
            files={"file": ("large.png", io.BytesIO(large_data), "image/png")}
        )
        
        assert response.status_code == 413
        error_data = response.json()
        assert error_data["detail"]["error"] == "file_too_large"
        assert error_data["detail"]["max_size_mb"] == 10

    def test_remove_bg_large_dimensions(self):
        """Test endpoint with image that has dimensions too large"""
        # Create an image with large dimensions but small file size
        large_image = Image.new('RGB', (5000, 5000), color='white')
        image_buffer = io.BytesIO()
        large_image.save(image_buffer, format='PNG')
        image_buffer.seek(0)
        
        response = client.post(
            "/remove-bg",
            files={"file": ("large_dims.png", image_buffer, "image/png")}
        )
        
        assert response.status_code == 400
        error_data = response.json()
        assert error_data["detail"]["error"] == "image_too_large"
        assert error_data["detail"]["max_width"] == 4096
        assert error_data["detail"]["max_height"] == 4096

    def test_remove_bg_different_formats(self):
        """Test endpoint with different supported image formats"""
        # Create test images in different formats
        test_image = Image.new('RGB', (50, 50), color='blue')
        
        formats = [
            ('PNG', 'image/png'),
            ('JPEG', 'image/jpeg'),
            ('WEBP', 'image/webp'),
            ('BMP', 'image/bmp'),
        ]
        
        for format_name, content_type in formats:
            image_buffer = io.BytesIO()
            test_image.save(image_buffer, format=format_name)
            image_buffer.seek(0)
            
            response = client.post(
                "/remove-bg",
                files={"file": (f"test.{format_name.lower()}", image_buffer, content_type)}
            )
            
            assert response.status_code == 200, f"Failed for format {format_name}"
            assert response.headers["content-type"] == "image/png"

    def test_remove_bg_filename_handling(self, test_image_path):
        """Test proper handling of various filenames"""
        test_cases = [
            ("normal_file.png", "cutout_normal_file.png"),
            ("file with spaces.png", "cutout_file_with_spaces.png"),
            ("file@#$%^&*().png", "cutout_file.png"),  # Special chars removed
            ("", "cutout_image.png"),  # Empty filename
            ("no_extension", "cutout_no_extension.png"),  # No extension
        ]
        
        with open(test_image_path, "rb") as f:
            original_data = f.read()
        
        for filename, expected_output in test_cases:
            response = client.post(
                "/remove-bg",
                files={"file": (filename, io.BytesIO(original_data), "image/png")}
            )
            
            assert response.status_code == 200
            content_disposition = response.headers.get("Content-Disposition", "")
            assert expected_output in content_disposition

    def test_remove_bg_response_headers(self, test_image_path):
        """Test that response headers are properly set"""
        with open(test_image_path, "rb") as f:
            response = client.post(
                "/remove-bg",
                files={"file": ("test.png", f, "image/png")}
            )
        
        assert response.status_code == 200
        
        # Check required headers
        assert response.headers["content-type"] == "image/png"
        assert "Content-Disposition" in response.headers
        assert "attachment" in response.headers["Content-Disposition"]
        assert "Content-Length" in response.headers
        assert "Cache-Control" in response.headers
        assert response.headers["Cache-Control"] == "no-cache"

    def test_remove_bg_grayscale_image(self):
        """Test endpoint with grayscale image"""
        # Create a grayscale test image
        gray_image = Image.new('L', (50, 50), color=128)  # Gray color
        image_buffer = io.BytesIO()
        gray_image.save(image_buffer, format='PNG')
        image_buffer.seek(0)
        
        response = client.post(
            "/remove-bg",
            files={"file": ("gray.png", image_buffer, "image/png")}
        )
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "image/png"
        
        # Verify output is RGBA
        image_data = io.BytesIO(response.content)
        output_image = Image.open(image_data)
        assert output_image.mode == "RGBA"

class TestIntegration:
    """Integration tests for the full API"""

    def test_api_root(self):
        """Test the root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "endpoints" in data
        assert "remove_background" in data["endpoints"]

    def test_api_docs_accessible(self):
        """Test that API documentation is accessible"""
        response = client.get("/docs")
        assert response.status_code == 200
        
        response = client.get("/openapi.json")
        assert response.status_code == 200
        openapi_data = response.json()
        assert "paths" in openapi_data
        assert "/remove-bg" in openapi_data["paths"]

if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v"])
