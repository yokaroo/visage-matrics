"""
Visage Metrics - Visual Fatigue Detection System
Core ML and utility modules
"""

__version__ = "1.0.0"
__author__ = "Visage Metrics Team"

# Import commonly used functions and classes
try:
    from .model_builder import build_visage_model
except ImportError:
    build_visage_model = None

try:
    from .data_loader import load_data
except ImportError:
    load_data = None

try:
    from .utils import (
        preprocess_image,
        preprocess_image_from_bytes,
        postprocess_predictions,
        encode_image_to_base64,
        decode_base64_to_image,
        validate_image_file
    )
except ImportError:
    pass

__all__ = [
    'build_visage_model',
    'load_data',
    'preprocess_image',
    'preprocess_image_from_bytes',
    'postprocess_predictions',
    'encode_image_to_base64',
    'decode_base64_to_image',
    'validate_image_file'
]
