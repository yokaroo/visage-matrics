"""
Inference routes for Visage Metrics
Handles model inference and predictions
"""

from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
from datetime import datetime

# Create blueprint
inference_bp = Blueprint('inference', __name__, url_prefix='/api/inference')

# Global model variable (will be set by main app)
model = None

def set_model(m):
    """Set the model instance"""
    global model
    model = m

@inference_bp.route('/predict', methods=['POST'])
def predict():
    """
    Perform inference on uploaded image
    Expected: multipart form with 'file' parameter
    """
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 503
        
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file extension
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
        if not ('.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
        filepath = os.path.join('uploads', timestamp + filename)
        
        # Create uploads directory if not exists
        os.makedirs('uploads', exist_ok=True)
        file.save(filepath)
        
        try:
            # Import preprocessing function
            from src.utils import preprocess_image
            
            # Preprocess and predict
            img_input = preprocess_image(filepath)
            predictions = model.predict(img_input, verbose=0)
            
            result = {
                'success': True,
                'filename': filename,
                'predictions': predictions.tolist() if hasattr(predictions, 'tolist') else predictions,
                'timestamp': datetime.now().isoformat(),
                'model_info': {
                    'name': 'Visage Hybrid Baseline',
                    'input_shape': (96, 96, 3)
                }
            }
            
            return jsonify(result), 200
            
        finally:
            # Clean up temporary file
            if os.path.exists(filepath):
                os.remove(filepath)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@inference_bp.route('/predict-base64', methods=['POST'])
def predict_base64():
    """
    Perform inference on base64 encoded image
    Expected JSON: {
        "image": "base64_encoded_image_data"
    }
    """
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 503
        
        data = request.get_json()
        
        if 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        import base64
        import cv2
        import numpy as np
        
        # Decode base64 image
        image_data = data['image']
        if isinstance(image_data, str):
            # Remove data URI prefix if present
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            image_array = np.frombuffer(image_bytes, dtype=np.uint8)
            image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        else:
            return jsonify({'error': 'Invalid image format'}), 400
        
        if image is None:
            return jsonify({'error': 'Could not decode image'}), 400
        
        # Preprocess image
        img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        img_resized = cv2.resize(img_rgb, (96, 96))
        img_normalized = img_resized.astype(np.float32) / 127.5 - 1.0
        img_batched = np.expand_dims(img_normalized, axis=0)
        
        # Perform inference
        predictions = model.predict(img_batched, verbose=0)
        
        # Process predictions
        result = {
            'success': True,
            'predictions': predictions.tolist() if hasattr(predictions, 'tolist') else predictions,
            'timestamp': datetime.now().isoformat(),
            'model_info': {
                'name': 'Visage Hybrid Baseline',
                'input_shape': (96, 96, 3)
            }
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@inference_bp.route('/batch-predict', methods=['POST'])
def batch_predict():
    """
    Perform inference on multiple images
    Expected: multipart form with 'files' parameter (multiple files)
    """
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 503
        
        # Check if files are in request
        if 'files' not in request.files:
            return jsonify({'error': 'No files provided'}), 400
        
        files = request.files.getlist('files')
        
        if not files or files[0].filename == '':
            return jsonify({'error': 'No files selected'}), 400
        
        from src.utils import preprocess_image
        
        results = []
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
        
        for file in files:
            if not ('.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
                results.append({
                    'filename': file.filename,
                    'error': 'File type not allowed'
                })
                continue
            
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
            filepath = os.path.join('uploads', timestamp + filename)
            
            os.makedirs('uploads', exist_ok=True)
            file.save(filepath)
            
            try:
                img_input = preprocess_image(filepath)
                predictions = model.predict(img_input, verbose=0)
                
                results.append({
                    'success': True,
                    'filename': filename,
                    'predictions': predictions.tolist() if hasattr(predictions, 'tolist') else predictions
                })
            except Exception as e:
                results.append({
                    'success': False,
                    'filename': filename,
                    'error': str(e)
                })
            finally:
                if os.path.exists(filepath):
                    os.remove(filepath)
        
        return jsonify({
            'success': True,
            'results': results,
            'total': len(results),
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

def register_inference_routes(app):
    """Register inference routes with Flask app"""
    app.register_blueprint(inference_bp)
