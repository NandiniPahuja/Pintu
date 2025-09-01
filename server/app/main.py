from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import io
import logging
from PIL import Image
import uvicorn
import cv2
import numpy as np

# Import rembg (will be available when package is installed)
try:
    from rembg import remove, new_session
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("rembg not available - background removal will not work")

# Import segmentation module
try:
    from .segmentation import segment_image
    SEGMENTATION_AVAILABLE = True
except ImportError:
    SEGMENTATION_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("Segmentation module not available - image segmentation will not work")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Pintu Design API",
    description="Background removal and image processing API for the Pintu design tool",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174", 
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

@app.post("/remove-bg")
async def remove_background(file: UploadFile = File(...)):
    """
    Remove background from uploaded image using rembg (u2net model) and return PNG with alpha channel
    
    Args:
        file: Uploaded image file (multipart/form-data)
        
    Returns:
        PNG image with transparent background
        
    Raises:
        400: Invalid file format or corrupted image
        413: File size too large (max 10MB)
        500: Background removal processing error
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400, 
                detail={
                    "error": "invalid_file_type",
                    "message": "File must be an image (PNG, JPG, JPEG, WEBP, BMP, TIFF)",
                    "accepted_types": ["image/png", "image/jpeg", "image/webp", "image/bmp", "image/tiff"]
                }
            )
        
        # Read the uploaded file
        contents = await file.read()
        logger.info(f"Processing image: {file.filename}, size: {len(contents)} bytes, type: {file.content_type}")
        
        # Validate file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if len(contents) > max_size:
            raise HTTPException(
                status_code=413,
                detail={
                    "error": "file_too_large",
                    "message": f"File size ({len(contents)} bytes) exceeds maximum allowed size",
                    "max_size_bytes": max_size,
                    "max_size_mb": max_size // (1024 * 1024)
                }
            )
        
        # Validate minimum file size (avoid empty files)
        if len(contents) < 100:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "file_too_small",
                    "message": "File appears to be empty or corrupted",
                    "size_bytes": len(contents)
                }
            )
        
        # Convert to PIL Image with error handling
        try:
            input_image = Image.open(io.BytesIO(contents))
            
            # Verify image can be processed
            input_image.verify()
            
            # Reload image after verification (verify() invalidates the image)
            input_image = Image.open(io.BytesIO(contents))
            
            # Get image dimensions for logging
            width, height = input_image.size
            logger.info(f"Image dimensions: {width}x{height}, mode: {input_image.mode}")
            
            # Validate image dimensions (reasonable limits)
            if width > 4096 or height > 4096:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "image_too_large",
                        "message": f"Image dimensions ({width}x{height}) exceed maximum allowed size",
                        "max_width": 4096,
                        "max_height": 4096
                    }
                )
            
            if width < 10 or height < 10:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "image_too_small",
                        "message": f"Image dimensions ({width}x{height}) are too small for processing",
                        "min_width": 10,
                        "min_height": 10
                    }
                )
            
            # Convert to RGB if necessary (rembg u2net expects RGB input)
            if input_image.mode in ('RGBA', 'LA'):
                # Create white background for transparent images
                background = Image.new('RGB', input_image.size, (255, 255, 255))
                if input_image.mode == 'RGBA':
                    background.paste(input_image, mask=input_image.split()[-1])
                else:  # LA mode
                    background.paste(input_image, mask=input_image.split()[-1])
                input_image = background
            elif input_image.mode not in ('RGB', 'L'):
                input_image = input_image.convert('RGB')
            elif input_image.mode == 'L':
                # Convert grayscale to RGB
                input_image = input_image.convert('RGB')
                
        except Exception as e:
            logger.error(f"Error processing image file: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "invalid_image",
                    "message": "Could not process image file - file may be corrupted or unsupported format",
                    "details": str(e)
                }
            )
        
        # Remove background using rembg with u2net model
        try:
            # Check if rembg is available
            if not REMBG_AVAILABLE:
                raise HTTPException(
                    status_code=500,
                    detail={
                        "error": "service_unavailable",
                        "message": "Background removal service is not available",
                        "details": "rembg package not installed"
                    }
                )
            
            # Convert PIL to bytes for rembg
            img_byte_arr = io.BytesIO()
            input_image.save(img_byte_arr, format='PNG')
            img_byte_arr = img_byte_arr.getvalue()
            
            # Remove background using u2net model (high quality)
            session = new_session('u2net')
            output_data = remove(img_byte_arr, session=session)
            
            # Convert back to PIL Image
            output_image = Image.open(io.BytesIO(output_data))
            
            # Ensure output is RGBA (with transparency)
            if output_image.mode != 'RGBA':
                output_image = output_image.convert('RGBA')
            
            logger.info(f"Background removal successful, output size: {len(output_data)} bytes")
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in background removal: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "background_removal_failed",
                    "message": "Failed to process image for background removal",
                    "details": str(e)
                }
            )
        
        # Optional: Post-process alpha channel for better quality
        try:
            # Convert to numpy array for processing
            img_array = np.array(output_image)
            
            # Apply median filter to alpha channel to reduce noise
            alpha = img_array[:, :, 3]
            alpha_smoothed = cv2.medianBlur(alpha, 3)
            
            # Apply morphological operations to clean up the mask
            kernel = np.ones((2, 2), np.uint8)
            alpha_smoothed = cv2.morphologyEx(alpha_smoothed, cv2.MORPH_CLOSE, kernel)
            alpha_smoothed = cv2.morphologyEx(alpha_smoothed, cv2.MORPH_OPEN, kernel)
            
            img_array[:, :, 3] = alpha_smoothed
            
            # Convert back to PIL
            output_image = Image.fromarray(img_array, 'RGBA')
            
            logger.info("Alpha channel post-processing completed")
            
        except Exception as e:
            logger.warning(f"Alpha channel post-processing failed, using original: {str(e)}")
            # Continue with original output if post-processing fails
        
        # Save to bytes with optimization
        output_buffer = io.BytesIO()
        output_image.save(
            output_buffer, 
            format='PNG', 
            optimize=True,
            compress_level=6  # Good balance between size and quality
        )
        output_buffer.seek(0)
        
        # Generate safe filename
        safe_filename = "".join(c for c in (file.filename or "image") if c.isalnum() or c in "._-")
        output_filename = f"cutout_{safe_filename}"
        if not output_filename.endswith('.png'):
            output_filename += '.png'
        
        logger.info(f"Successfully processed image: {file.filename} -> {output_filename}")
        
        # Return as streaming response with proper headers
        return StreamingResponse(
            io.BytesIO(output_buffer.read()),
            media_type="image/png",
            headers={
                "Content-Disposition": f"attachment; filename={output_filename}",
                "Content-Length": str(output_buffer.getbuffer().nbytes),
                "Cache-Control": "no-cache"
            }
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Unexpected error in background removal: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "internal_server_error",
                "message": "An unexpected error occurred during image processing",
                "details": str(e)
            }
        )

@app.post("/segment")
async def segment_image_endpoint(file: UploadFile = File(...)):
    """
    Segment uploaded image using MobileSAM and return JSON with mask metadata and base64 PNG cutouts
    
    Args:
        file: Uploaded image file (multipart/form-data)
        
    Returns:
        JSON response with segments containing:
        - id: unique segment identifier
        - bbox: bounding box [x, y, width, height]
        - maskArea: number of pixels in the mask
        - pngBase64: base64-encoded PNG cutout with transparency
        
    Raises:
        400: Invalid file format or corrupted image
        413: File size too large (max 10MB)
        500: Segmentation processing error
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400, 
                detail={
                    "error": "invalid_file_type",
                    "message": "File must be an image (PNG, JPG, JPEG, WEBP, BMP, TIFF)",
                    "accepted_types": ["image/png", "image/jpeg", "image/webp", "image/bmp", "image/tiff"]
                }
            )
        
        # Read the uploaded file
        contents = await file.read()
        logger.info(f"Processing image for segmentation: {file.filename}, size: {len(contents)} bytes, type: {file.content_type}")
        
        # Validate file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if len(contents) > max_size:
            raise HTTPException(
                status_code=413,
                detail={
                    "error": "file_too_large",
                    "message": f"File size ({len(contents)} bytes) exceeds maximum allowed size",
                    "max_size_bytes": max_size,
                    "max_size_mb": max_size // (1024 * 1024)
                }
            )
        
        # Validate minimum file size (avoid empty files)
        if len(contents) < 100:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "file_too_small",
                    "message": "File appears to be empty or corrupted",
                    "size_bytes": len(contents)
                }
            )
        
        # Convert to PIL Image with error handling
        try:
            input_image = Image.open(io.BytesIO(contents))
            
            # Verify image can be processed
            input_image.verify()
            
            # Reload image after verification (verify() invalidates the image)
            input_image = Image.open(io.BytesIO(contents))
            
            # Get image dimensions for logging
            width, height = input_image.size
            logger.info(f"Image dimensions: {width}x{height}, mode: {input_image.mode}")
            
            # Validate image dimensions (reasonable limits)
            if width > 4096 or height > 4096:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "image_too_large",
                        "message": f"Image dimensions ({width}x{height}) exceed maximum allowed size",
                        "max_width": 4096,
                        "max_height": 4096
                    }
                )
            
            if width < 50 or height < 50:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "image_too_small",
                        "message": f"Image dimensions ({width}x{height}) are too small for segmentation",
                        "min_width": 50,
                        "min_height": 50
                    }
                )
                
        except Exception as e:
            logger.error(f"Error processing image file: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "invalid_image",
                    "message": "Could not process image file - file may be corrupted or unsupported format",
                    "details": str(e)
                }
            )
        
        # Perform image segmentation
        try:
            # Check if segmentation is available
            if not SEGMENTATION_AVAILABLE:
                raise HTTPException(
                    status_code=500,
                    detail={
                        "error": "service_unavailable",
                        "message": "Image segmentation service is not available",
                        "details": "Segmentation module not installed"
                    }
                )
            
            # Run segmentation
            segments = segment_image(input_image)
            
            logger.info(f"Segmentation successful, found {len(segments)} segments")
            
            # Return JSON response with segments
            return {
                "success": True,
                "image_info": {
                    "width": width,
                    "height": height,
                    "mode": input_image.mode,
                    "filename": file.filename
                },
                "segments": segments,
                "total_segments": len(segments)
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in image segmentation: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "segmentation_failed",
                    "message": "Failed to process image for segmentation",
                    "details": str(e)
                }
            )
            
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Unexpected error in image segmentation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "internal_server_error",
                "message": "An unexpected error occurred during image segmentation",
                "details": str(e)
            }
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Unexpected error in background removal: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "internal_server_error",
                "message": "An unexpected error occurred during image processing",
                "details": str(e)
            }
        )

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Pintu Design API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "remove_background": "/remove-bg (POST)",
            "segment_image": "/segment (POST)"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
