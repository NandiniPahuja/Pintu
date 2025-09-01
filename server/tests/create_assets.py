"""
Script to generate test assets for unit tests
"""
from PIL import Image, ImageDraw
import os

def create_test_images():
    """Create small test images for unit testing"""
    
    # Create assets directory if it doesn't exist
    assets_dir = os.path.join(os.path.dirname(__file__), 'assets')
    os.makedirs(assets_dir, exist_ok=True)
    
    # Create a small RGB test image (50x50 pixels)
    test_image = Image.new('RGB', (50, 50), color='white')
    draw = ImageDraw.Draw(test_image)
    
    # Draw a simple red circle in the center
    draw.ellipse([10, 10, 40, 40], fill='red', outline='black', width=2)
    
    # Save as different formats
    test_image.save(os.path.join(assets_dir, 'test_image.png'), 'PNG')
    test_image.save(os.path.join(assets_dir, 'test_image.jpg'), 'JPEG')
    
    # Create a small RGBA image with transparency
    rgba_image = Image.new('RGBA', (50, 50), color=(255, 255, 255, 0))  # Transparent background
    draw_rgba = ImageDraw.Draw(rgba_image)
    
    # Draw a blue circle with transparency
    draw_rgba.ellipse([10, 10, 40, 40], fill=(0, 0, 255, 200), outline=(0, 0, 0, 255), width=2)
    
    rgba_image.save(os.path.join(assets_dir, 'test_image_rgba.png'), 'PNG')
    
    # Create a very small image (for size validation tests)
    tiny_image = Image.new('RGB', (5, 5), color='green')
    tiny_image.save(os.path.join(assets_dir, 'tiny_image.png'), 'PNG')
    
    # Create a text file (invalid image) for error testing
    with open(os.path.join(assets_dir, 'not_an_image.txt'), 'w') as f:
        f.write("This is not an image file")
    
    print("Test assets created successfully!")

if __name__ == "__main__":
    create_test_images()
