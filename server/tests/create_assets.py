"""
Script to generate test assets for unit tests including segmentation test images
"""
from PIL import Image, ImageDraw
import os

def create_test_images():
    """Create small test images for unit testing"""
    
    # Create assets directory if it doesn't exist
    assets_dir = os.path.join(os.path.dirname(__file__), 'assets')
    os.makedirs(assets_dir, exist_ok=True)
    
    print(f"Creating test assets in: {assets_dir}")
    
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
    
    # Multi-object image for segmentation testing
    print("Creating segmentation_test.png...")
    seg_img = Image.new('RGB', (300, 300), color='white')
    draw = ImageDraw.Draw(seg_img)
    
    # Blue circle
    draw.ellipse([50, 50, 150, 150], fill='blue')
    
    # Red rectangle
    draw.rectangle([200, 50, 280, 130], fill='red')
    
    # Green triangle
    draw.polygon([(150, 200), (200, 280), (100, 280)], fill='green')
    
    seg_img.save(os.path.join(assets_dir, 'segmentation_test.png'), 'PNG')
    
    # Complex segmentation image
    print("Creating complex_scene.png...")
    complex_img = Image.new('RGB', (400, 400), color='lightgray')
    draw = ImageDraw.Draw(complex_img)
    
    # Multiple overlapping objects
    draw.ellipse([50, 50, 180, 180], fill='red')
    draw.ellipse([120, 80, 250, 210], fill='blue')
    draw.rectangle([200, 200, 350, 350], fill='green')
    draw.ellipse([80, 250, 200, 370], fill='purple')
    
    complex_img.save(os.path.join(assets_dir, 'complex_scene.png'), 'PNG')
    
    # Grayscale image for testing mode conversion
    print("Creating grayscale_test.png...")
    gray_img = Image.new('L', (200, 200), 128)  # Gray background
    draw = ImageDraw.Draw(gray_img)
    draw.rectangle([50, 50, 150, 150], fill=200)  # Light gray rectangle
    draw.ellipse([100, 100, 180, 180], fill=80)   # Dark gray circle
    gray_img.save(os.path.join(assets_dir, 'grayscale_test.png'), 'PNG')
    
    # Create a text file (invalid image) for error testing
    with open(os.path.join(assets_dir, 'not_an_image.txt'), 'w') as f:
        f.write("This is not an image file")
    
    print(f"✅ Created {len(os.listdir(assets_dir))} test assets")
    
    # List all created files
    print("\nCreated files:")
    for filename in sorted(os.listdir(assets_dir)):
        filepath = os.path.join(assets_dir, filename)
        size = os.path.getsize(filepath)
        print(f"  📄 {filename} ({size} bytes)")

if __name__ == "__main__":
    create_test_images()
