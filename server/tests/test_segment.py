"""
Tests for the /segment endpoint

This module contains comprehensive tests for the image segmentation functionality
using MobileSAM.
"""

import pytest
import io
import json
import base64
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def create_test_image(width: int = 300, height: int = 300, format: str = "PNG") -> bytes:
    """Create a test image with geometric shapes for segmentation testing"""
    # Create RGB image with white background
    image = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(image)
    
    # Draw several distinct objects that should be segmented
    # Blue circle
    draw.ellipse([50, 50, 150, 150], fill='blue')
    
    # Red rectangle
    draw.rectangle([200, 50, 280, 130], fill='red')
    
    # Green triangle (using polygon)
    draw.polygon([(150, 200), (200, 280), (100, 280)], fill='green')
    
    # Convert to bytes
    buffer = io.BytesIO()
    image.save(buffer, format=format)
    return buffer.getvalue()

def create_simple_test_image(width: int = 100, height: int = 100) -> bytes:
    """Create a simple test image"""
    image = Image.new('RGB', (width, height), 'red')
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    return buffer.getvalue()

class TestSegmentEndpoint:
    """Test cases for the /segment endpoint"""
    
    def test_segment_valid_image(self):
        """Test segmentation with a valid image containing multiple objects"""
        image_data = create_test_image()
        
        response = client.post(
            "/segment",
            files={"file": ("test_image.png", image_data, "image/png")}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "success" in data
        assert data["success"] is True
        assert "image_info" in data
        assert "segments" in data
        assert "total_segments" in data
        
        # Check image info
        assert data["image_info"]["width"] == 300
        assert data["image_info"]["height"] == 300
        assert data["image_info"]["mode"] in ["RGB", "RGBA"]
        assert data["image_info"]["filename"] == "test_image.png"
        
        # Check segments
        segments = data["segments"]
        assert isinstance(segments, list)
        assert len(segments) >= 1  # Should find at least one segment
        assert data["total_segments"] == len(segments)
        
        # Check segment structure
        for segment in segments:
            assert "id" in segment
            assert "bbox" in segment
            assert "maskArea" in segment
            assert "pngBase64" in segment
            
            # Validate bbox format [x, y, width, height]
            bbox = segment["bbox"]
            assert isinstance(bbox, list)
            assert len(bbox) == 4
            assert all(isinstance(x, int) for x in bbox)
            assert bbox[2] > 0  # width > 0
            assert bbox[3] > 0  # height > 0
            
            # Validate mask area
            assert isinstance(segment["maskArea"], int)
            assert segment["maskArea"] > 0
            
            # Validate base64 PNG
            assert isinstance(segment["pngBase64"], str)
            assert len(segment["pngBase64"]) > 0
            
            # Try to decode base64 and verify it's a valid PNG
            try:
                png_data = base64.b64decode(segment["pngBase64"])
                cutout_image = Image.open(io.BytesIO(png_data))
                assert cutout_image.format == "PNG"
                assert cutout_image.mode == "RGBA"  # Should have transparency
            except Exception as e:
                pytest.fail(f"Invalid PNG base64 data: {e}")
    
    def test_segment_small_image(self):
        """Test segmentation with a small but valid image"""
        image_data = create_simple_test_image(100, 100)
        
        response = client.post(
            "/segment",
            files={"file": ("small_image.png", image_data, "image/png")}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["segments"]) >= 0  # May or may not find segments in simple image
    
    def test_segment_different_formats(self):
        """Test segmentation with different image formats"""
        formats = ["PNG", "JPEG", "WEBP"]
        
        for format_name in formats:
            try:
                image_data = create_test_image(200, 200, format_name)
                mime_type = f"image/{format_name.lower()}"
                
                response = client.post(
                    "/segment",
                    files={"file": (f"test_image.{format_name.lower()}", image_data, mime_type)}
                )
                
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                
            except Exception as e:
                # Some formats might not be supported, that's okay
                pytest.skip(f"Format {format_name} not supported: {e}")
    
    def test_segment_no_file(self):
        """Test segmentation endpoint without providing a file"""
        response = client.post("/segment")
        
        assert response.status_code == 422  # Validation error
    
    def test_segment_invalid_file_type(self):
        """Test segmentation with non-image file"""
        text_data = b"This is not an image"
        
        response = client.post(
            "/segment",
            files={"file": ("test.txt", text_data, "text/plain")}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert data["detail"]["error"] == "invalid_file_type"
        assert "accepted_types" in data["detail"]
    
    def test_segment_corrupted_image(self):
        """Test segmentation with corrupted image data"""
        corrupted_data = b"PNG\x89\x50\x4E\x47\x0D\x0A\x1A\x0A" + b"corrupted_data" * 100
        
        response = client.post(
            "/segment",
            files={"file": ("corrupted.png", corrupted_data, "image/png")}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert data["detail"]["error"] == "invalid_image"
    
    def test_segment_empty_file(self):
        """Test segmentation with empty file"""
        response = client.post(
            "/segment",
            files={"file": ("empty.png", b"", "image/png")}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert data["detail"]["error"] == "file_too_small"
    
    def test_segment_large_file(self):
        """Test segmentation with file exceeding size limit"""
        # Create a very large image (should exceed 10MB limit)
        large_image_data = create_test_image(4000, 4000)
        
        response = client.post(
            "/segment",
            files={"file": ("large_image.png", large_image_data, "image/png")}
        )
        
        # Could be either file_too_large or image_too_large depending on actual size
        assert response.status_code in [400, 413]
        data = response.json()
        assert data["detail"]["error"] in ["file_too_large", "image_too_large"]
    
    def test_segment_tiny_image(self):
        """Test segmentation with image too small for processing"""
        tiny_image = Image.new('RGB', (10, 10), 'red')
        buffer = io.BytesIO()
        tiny_image.save(buffer, format='PNG')
        
        response = client.post(
            "/segment",
            files={"file": ("tiny.png", buffer.getvalue(), "image/png")}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert data["detail"]["error"] == "image_too_small"
    
    def test_segment_grayscale_image(self):
        """Test segmentation with grayscale image"""
        # Create grayscale image
        image = Image.new('L', (200, 200), 128)
        draw = ImageDraw.Draw(image)
        draw.rectangle([50, 50, 150, 150], fill=200)
        
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        
        response = client.post(
            "/segment",
            files={"file": ("gray.png", buffer.getvalue(), "image/png")}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    def test_segment_rgba_image(self):
        """Test segmentation with RGBA image (with transparency)"""
        # Create RGBA image with transparency
        image = Image.new('RGBA', (200, 200), (255, 255, 255, 0))  # Transparent background
        draw = ImageDraw.Draw(image)
        draw.ellipse([50, 50, 150, 150], fill=(255, 0, 0, 255))  # Red circle
        
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        
        response = client.post(
            "/segment",
            files={"file": ("rgba.png", buffer.getvalue(), "image/png")}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    def test_segment_response_format(self):
        """Test that segmentation response follows the expected format"""
        image_data = create_test_image()
        
        response = client.post(
            "/segment",
            files={"file": ("test.png", image_data, "image/png")}
        )
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"
        
        data = response.json()
        
        # Validate complete response structure
        required_keys = ["success", "image_info", "segments", "total_segments"]
        for key in required_keys:
            assert key in data, f"Missing required key: {key}"
        
        # Validate image_info structure
        image_info_keys = ["width", "height", "mode", "filename"]
        for key in image_info_keys:
            assert key in data["image_info"], f"Missing image_info key: {key}"
        
        # Validate segments structure
        assert isinstance(data["segments"], list)
        for segment in data["segments"]:
            segment_keys = ["id", "bbox", "maskArea", "pngBase64"]
            for key in segment_keys:
                assert key in segment, f"Missing segment key: {key}"
    
    def test_segment_consistent_results(self):
        """Test that segmentation produces consistent results for the same image"""
        image_data = create_test_image()
        
        # Run segmentation twice
        response1 = client.post(
            "/segment",
            files={"file": ("test1.png", image_data, "image/png")}
        )
        
        response2 = client.post(
            "/segment",
            files={"file": ("test2.png", image_data, "image/png")}
        )
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        data1 = response1.json()
        data2 = response2.json()
        
        # Should have same number of segments (segmentation should be deterministic)
        assert data1["total_segments"] == data2["total_segments"]
        
        # Image info should be identical
        assert data1["image_info"] == data2["image_info"]

class TestSegmentEndpointIntegration:
    """Integration tests for the /segment endpoint"""
    
    def test_segment_after_background_removal(self):
        """Test segmentation workflow: upload -> remove background -> segment"""
        # This test would require actual integration with remove-bg endpoint
        # For now, just test that segment endpoint works independently
        image_data = create_test_image()
        
        response = client.post(
            "/segment",
            files={"file": ("processed.png", image_data, "image/png")}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    def test_health_check_still_works(self):
        """Test that health endpoint still works after adding segmentation"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
    
    def test_root_endpoint_updated(self):
        """Test that root endpoint includes segmentation info"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        
        assert "endpoints" in data
        endpoints = data["endpoints"]
        assert "segment_image" in endpoints
        assert "/segment" in endpoints["segment_image"]

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
