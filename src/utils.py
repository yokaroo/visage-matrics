"""
Utility functions for Visage Metrics
Image preprocessing, postprocessing, and helper functions
"""

import cv2
import numpy as np
from PIL import Image
from io import BytesIO
import base64

def preprocess_image(image_path, target_size=(96, 96)):
    """
    Preprocess image for model inference
    
    Args:
        image_path: Path to image file
        target_size: Target size for resizing (width, height)
    
    Returns:
        Preprocessed image array with shape (1, height, width, 3)
    """
    try:
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError("Could not read image")
        
        # Convert BGR to RGB
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Resize to target size
        img = cv2.resize(img, target_size)
        
        # Normalize to [-1, 1]
        img = img.astype(np.float32) / 127.5 - 1.0
        
        # Add batch dimension
        img = np.expand_dims(img, axis=0)
        
        return img
    except Exception as e:
        raise ValueError(f"Image preprocessing failed: {str(e)}")

def preprocess_image_from_bytes(image_bytes, target_size=(96, 96)):
    """
    Preprocess image from bytes
    
    Args:
        image_bytes: Image data as bytes
        target_size: Target size for resizing (width, height)
    
    Returns:
        Preprocessed image array with shape (1, height, width, 3)
    """
    try:
        # Convert bytes to numpy array
        image_array = np.frombuffer(image_bytes, dtype=np.uint8)
        img = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Could not decode image from bytes")
        
        # Convert BGR to RGB
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Resize to target size
        img = cv2.resize(img, target_size)
        
        # Normalize to [-1, 1]
        img = img.astype(np.float32) / 127.5 - 1.0
        
        # Add batch dimension
        img = np.expand_dims(img, axis=0)
        
        return img
    except Exception as e:
        raise ValueError(f"Image preprocessing failed: {str(e)}")

def postprocess_predictions(predictions):
    """
    Postprocess model predictions
    
    Args:
        predictions: Model output array
    
    Returns:
        Dictionary with processed predictions
    """
    try:
        if predictions is None or len(predictions) == 0:
            return {'error': 'Invalid predictions'}
        
        # Convert to list if numpy array
        if isinstance(predictions, np.ndarray):
            predictions = predictions.tolist()
        
        # Process first prediction (usually binary classification)
        pred_value = predictions[0][0] if isinstance(predictions[0], list) else predictions[0]
        
        return {
            'score': float(pred_value),
            'class': 'fatigued' if pred_value > 0.5 else 'not_fatigued',
            'confidence': float(abs(pred_value - 0.5) * 2)
        }
    except Exception as e:
        return {'error': str(e)}

def encode_image_to_base64(image_path):
    """
    Encode image file to base64 string
    
    Args:
        image_path: Path to image file
    
    Returns:
        Base64 encoded string
    """
    try:
        with open(image_path, 'rb') as image_file:
            encoded = base64.b64encode(image_file.read()).decode('utf-8')
        return encoded
    except Exception as e:
        raise ValueError(f"Failed to encode image: {str(e)}")

def decode_base64_to_image(base64_string, save_path=None):
    """
    Decode base64 string to image
    
    Args:
        base64_string: Base64 encoded image string
        save_path: Optional path to save decoded image
    
    Returns:
        Image array or PIL Image object
    """
    try:
        # Remove data URI prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Convert to image
        image = Image.open(BytesIO(image_data))
        
        if save_path:
            image.save(save_path)
        
        return image
    except Exception as e:
        raise ValueError(f"Failed to decode base64 image: {str(e)}")

def validate_image_file(filename, allowed_extensions):
    """
    Validate image file
    
    Args:
        filename: Name of the file
        allowed_extensions: Set of allowed extensions
    
    Returns:
        True if valid, False otherwise
    """
    if not filename or '.' not in filename:
        return False
    
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in allowed_extensions

def get_image_dimensions(image_path):
    """
    Get image dimensions
    
    Args:
        image_path: Path to image file
    
    Returns:
        Tuple of (width, height) or None if error
    """
    try:
        img = Image.open(image_path)
        return img.size
    except Exception as e:
        print(f"Error getting image dimensions: {str(e)}")
        return None

def resize_image(input_path, output_path, size=(96, 96)):
    """
    Resize image to specific size
    
    Args:
        input_path: Input image path
        output_path: Output image path
        size: Target size (width, height)
    
    Returns:
        True if successful, False otherwise
    """
    try:
        img = Image.open(input_path)
        img_resized = img.resize(size, Image.Resampling.LANCZOS)
        img_resized.save(output_path)
        return True
    except Exception as e:
        print(f"Error resizing image: {str(e)}")
        return False
