"""
Visage Metrics - Visual Fatigue Monitor
Flask Backend Application
"""

import os
import sys
import json
import base64
import numpy as np
import cv2
from io import BytesIO
from pathlib import Path
from datetime import datetime

import tensorflow as tf
from flask import Flask, render_template, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

# Try to import custom modules, but don't fail if they're empty
try:
    from model_builder import build_visage_model
except:
    build_visage_model = None

try:
    from data_loader import DataLoader
except:
    DataLoader = None

try:
    from utils import preprocess_image, postprocess_predictions
except:
    preprocess_image = None
    postprocess_predictions = None

# Initialize Flask App
app = Flask(__name__, 
            template_folder='Pages',
            static_folder='assets')

# Enable CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB max file size

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Global model variables
model = None
model_loaded = False

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_model():
    """Load the trained model"""
    global model, model_loaded
    
    try:
        # Try loading .keras format first
        model_path = 'saved_models/visage_hybrid_baseline.keras'
        if os.path.exists(model_path):
            print(f"Loading model from {model_path}...")
            model = tf.keras.models.load_model(model_path)
            model_loaded = True
            print("✓ Model loaded successfully")
            return True
        
        # Fallback to .h5 format
        model_path = 'saved_models/visage_hybrid_baseline.h5'
        if os.path.exists(model_path):
            print(f"Loading model from {model_path}...")
            model = tf.keras.models.load_model(model_path)
            model_loaded = True
            print("✓ Model loaded successfully")
            return True
        
        print("⚠ Warning: No saved model found. Starting without model...")
        model_loaded = False
        return False
        
    except Exception as e:
        print(f"✗ Error loading model: {str(e)}")
        model_loaded = False
        return False

def preprocess_image_for_inference(image_path, target_size=(96, 96)):
    """Preprocess image for model inference"""
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

# ==================== ROUTES ====================

@app.route('/')
def index():
    """Serve landing page"""
    try:
        return send_file('Pages/user/landing.html')
    except Exception as e:
        print(f"Error serving landing page: {e}")
        return jsonify({'error': 'Landing page not found'}), 404

@app.route('/login')
def login_page():
    """Serve login page"""
    try:
        return send_file('login.html')
    except Exception as e:
        print(f"Error serving login page: {e}")
        return jsonify({'error': 'Login page not found'}), 404

@app.route('/login.html')
def login_page_html():
    """Serve login page (with .html extension)"""
    try:
        return send_file('login.html')
    except Exception as e:
        print(f"Error serving login page: {e}")
        return jsonify({'error': 'Login page not found'}), 404

@app.route('/register')
def register_page():
    """Serve register page"""
    try:
        return send_file('register.html')
    except Exception as e:
        print(f"Error serving register page: {e}")
        return jsonify({'error': 'Register page not found'}), 404

@app.route('/register.html')
def register_page_html():
    """Serve register page (with .html extension)"""
    try:
        return send_file('register.html')
    except Exception as e:
        print(f"Error serving register page: {e}")
        return jsonify({'error': 'Register page not found'}), 404

# ===== USER PAGES =====
@app.route('/user/landing')
def user_landing():
    """Serve user landing page"""
    try:
        return send_file('Pages/user/landing.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/user/landing.html')
def user_landing_html():
    """Serve user landing page (with .html extension)"""
    try:
        return send_file('Pages/user/landing.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/user/about')
def user_about():
    """Serve user about page"""
    try:
        return send_file('Pages/user/about.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/user/about.html')
def user_about_html():
    """Serve user about page (with .html extension)"""
    try:
        return send_file('Pages/user/about.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/user/form-pengguna')
def user_form():
    """Serve user form page"""
    try:
        return send_file('Pages/user/form_pengguna.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/user/form_pengguna')
def user_form_underscore():
    """Serve user form page (with underscore)"""
    try:
        return send_file('Pages/user/form_pengguna.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/user/form-pengguna.html')
def user_form_html():
    """Serve user form page (with .html extension)"""
    try:
        return send_file('Pages/user/form_pengguna.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/user/form_pengguna.html')
def user_form_underscore_html():
    """Serve user form page (with underscore and .html)"""
    try:
        return send_file('Pages/user/form_pengguna.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/user/asisten')
def user_asisten():
    """Serve AI assistant page"""
    try:
        return send_file('Pages/user/asisten_visage.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/user/asisten.html')
def user_asisten_html():
    """Serve AI assistant page (with .html extension)"""
    try:
        return send_file('Pages/user/asisten_visage.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/user/asisten_visage')
def user_asisten_visage():
    """Serve AI assistant page (asisten_visage)"""
    try:
        return send_file('Pages/user/asisten_visage.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/user/asisten_visage.html')
def user_asisten_visage_html():
    """Serve AI assistant page (asisten_visage with .html)"""
    try:
        return send_file('Pages/user/asisten_visage.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/user/sistem')
def user_sistem():
    """Serve user sistem page"""
    try:
        return send_file('Pages/user/sistem.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/user/sistem.html')
def user_sistem_html():
    """Serve user sistem page (with .html extension)"""
    try:
        return send_file('Pages/user/sistem.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

# ===== ADMIN PAGES =====
@app.route('/admin/dashboard')
def admin_dashboard():
    """Serve admin dashboard"""
    try:
        return send_file('Pages/admin/dashboard.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/admin/dashboard.html')
def admin_dashboard_html():
    """Serve admin dashboard (with .html extension)"""
    try:
        return send_file('Pages/admin/dashboard.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/admin/manajemen-user')
def admin_users():
    """Serve user management page"""
    try:
        return send_file('Pages/admin/manajemen_user.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/admin/manajemen_user')
def admin_users_underscore():
    """Serve user management page (with underscore)"""
    try:
        return send_file('Pages/admin/manajemen_user.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/admin/manajemen-user.html')
def admin_users_html():
    """Serve user management page (with .html extension)"""
    try:
        return send_file('Pages/admin/manajemen_user.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/admin/manajemen_user.html')
def admin_users_underscore_html():
    """Serve user management page (with underscore and .html)"""
    try:
        return send_file('Pages/admin/manajemen_user.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/admin/pengaturan')
def admin_settings():
    """Serve admin settings page"""
    try:
        return send_file('Pages/admin/pengaturan.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/admin/pengaturan.html')
def admin_settings_html():
    """Serve admin settings page (with .html extension)"""
    try:
        return send_file('Pages/admin/pengaturan.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/admin/analitik-hari-ini')
def admin_analytics_today():
    """Serve today analytics page"""
    try:
        return send_file('Pages/admin/data_analitik_hari_ini.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/admin/data_analitik_hari_ini')
def admin_analytics_today_underscore():
    """Serve today analytics page (with underscore)"""
    try:
        return send_file('Pages/admin/data_analitik_hari_ini.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/admin/analitik-hari-ini.html')
def admin_analytics_today_html():
    """Serve today analytics page (with .html extension)"""
    try:
        return send_file('Pages/admin/data_analitik_hari_ini.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/admin/data_analitik_hari_ini.html')
def admin_analytics_today_underscore_html():
    """Serve today analytics page (with underscore and .html)"""
    try:
        return send_file('Pages/admin/data_analitik_hari_ini.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/admin/analitik-7-hari')
def admin_analytics_7days():
    """Serve 7 days analytics page"""
    try:
        return send_file('Pages/admin/data_analitik_7_hari.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/admin/data_analitik_7_hari')
def admin_analytics_7days_underscore():
    """Serve 7 days analytics page (with underscore)"""
    try:
        return send_file('Pages/admin/data_analitik_7_hari.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/admin/analitik-7-hari.html')
def admin_analytics_7days_html():
    """Serve 7 days analytics page (with .html extension)"""
    try:
        return send_file('Pages/admin/data_analitik_7_hari.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/admin/data_analitik_7_hari.html')
def admin_analytics_7days_underscore_html():
    """Serve 7 days analytics page (with underscore and .html)"""
    try:
        return send_file('Pages/admin/data_analitik_7_hari.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/admin/analitik-30-hari')
def admin_analytics_30days():
    """Serve 30 days analytics page"""
    try:
        return send_file('Pages/admin/data_analitik_30_hari.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/admin/data_analitik_30_hari')
def admin_analytics_30days_underscore():
    """Serve 30 days analytics page (with underscore)"""
    try:
        return send_file('Pages/admin/data_analitik_30_hari.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/admin/analitik-30-hari.html')
def admin_analytics_30days_html():
    """Serve 30 days analytics page (with .html extension)"""
    try:
        return send_file('Pages/admin/data_analitik_30_hari.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/admin/data_analitik_30_hari.html')
def admin_analytics_30days_underscore_html():
    """Serve 30 days analytics page (with underscore and .html)"""
    try:
        return send_file('Pages/admin/data_analitik_30_hari.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

# ===== STATIC FILES =====
@app.route('/assets/css/<path:filename>')
def serve_css(filename):
    """Serve CSS files"""
    try:
        return send_from_directory('assets/css', filename)
    except:
        return jsonify({'error': 'CSS file not found'}), 404

@app.route('/assets/js/<path:filename>')
def serve_js(filename):
    """Serve JavaScript files"""
    try:
        return send_from_directory('assets/js', filename)
    except:
        return jsonify({'error': 'JS file not found'}), 404

@app.route('/assets/models/<path:filename>')
def serve_models(filename):
    """Serve model files"""
    try:
        return send_from_directory('assets/models', filename)
    except:
        return jsonify({'error': 'Model file not found'}), 404

# ===== CATCH-ALL ROUTES FOR Pages/ PREFIX =====
@app.route('/Pages/user/landing.html')
def catch_pages_user_landing():
    """Catch Pages/user/landing.html request"""
    try:
        return send_file('Pages/user/landing.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/Pages/admin/dashboard.html')
def catch_pages_admin_dashboard():
    """Catch Pages/admin/dashboard.html request"""
    try:
        return send_file('Pages/admin/dashboard.html')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/Pages/user/<path:filename>')
def catch_pages_user_files(filename):
    """Catch any Pages/user/* request"""
    try:
        return send_file(f'Pages/user/{filename}')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/Pages/admin/<path:filename>')
def catch_pages_admin_files(filename):
    """Catch any Pages/admin/* request"""
    try:
        return send_file(f'Pages/admin/{filename}')
    except:
        return jsonify({'error': 'Page not found'}), 404

# ==================== API ENDPOINTS ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model_loaded,
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/api/inference', methods=['POST'])
def inference():
    """
    Perform inference on uploaded image
    Expected: JSON with 'image' as base64 encoded image
    """
    try:
        if not model_loaded or model is None:
            return jsonify({'error': 'Model not loaded'}), 503
        
        data = request.get_json()
        
        if 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
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
            'predictions': predictions.tolist(),
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

@app.route('/api/inference/file', methods=['POST'])
def inference_file():
    """
    Perform inference on uploaded file
    Expected: multipart form with 'file' parameter
    """
    try:
        if not model_loaded or model is None:
            return jsonify({'error': 'Model not loaded'}), 503
        
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], timestamp + filename)
        file.save(filepath)
        
        try:
            # Preprocess and predict
            img_input = preprocess_image_for_inference(filepath)
            predictions = model.predict(img_input, verbose=0)
            
            result = {
                'success': True,
                'filename': filename,
                'predictions': predictions.tolist(),
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

@app.route('/api/model/status', methods=['GET'])
def model_status():
    """Get model status and information"""
    try:
        if model is None:
            return jsonify({
                'status': 'not_loaded',
                'available_models': get_available_models()
            }), 200
        
        return jsonify({
            'status': 'loaded',
            'model_name': 'Visage Hybrid Baseline',
            'input_shape': (96, 96, 3),
            'available_models': get_available_models()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_available_models():
    """Get list of available saved models"""
    models_dir = 'saved_models'
    available = []
    
    if os.path.exists(models_dir):
        try:
            for file in os.listdir(models_dir):
                if file.endswith(('.keras', '.h5')):
                    available.append(file)
        except:
            pass
    
    return available

@app.route('/api/model/load/<model_name>', methods=['POST'])
def load_specific_model(model_name):
    """Load a specific model by name"""
    global model, model_loaded
    
    try:
        # Sanitize model name
        model_name = secure_filename(model_name)
        model_path = os.path.join('saved_models', model_name)
        
        if not os.path.exists(model_path):
            return jsonify({'error': f'Model {model_name} not found'}), 404
        
        print(f"Loading model: {model_path}")
        model = tf.keras.models.load_model(model_path)
        model_loaded = True
        
        return jsonify({
            'success': True,
            'message': f'Model {model_name} loaded successfully',
            'model_name': model_name
        }), 200
        
    except Exception as e:
        model_loaded = False
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle 413 errors (file too large)"""
    return jsonify({'error': 'File too large. Maximum size is 50MB'}), 413

# ==================== MAIN ====================

if __name__ == '__main__':
    print("=" * 50)
    print("Visage Metrics - Visual Fatigue Monitor")
    print("=" * 50)
    
    # Load model on startup
    print("\nLoading ML model...")
    load_model()
    
    # Create uploads directory if not exists
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    print("\n" + "=" * 50)
    print("Starting Flask application...")
    print("=" * 50)
    print("\n🚀 Server running at http://localhost:5000")
    print("📊 Health Check: http://localhost:5000/api/health")
    print("=" * 50 + "\n")
    
    # Run app
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        threaded=True,
        use_reloader=False
    )

def preprocess_image_for_inference(image_path, target_size=(96, 96)):
    """Preprocess image for model inference"""
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

# ==================== ROUTES ====================

@app.route('/')
def index():
    """Serve landing page"""
    return send_file('Pages/user/landing.html')

@app.route('/login')
def login_page():
    """Serve login page"""
    return send_file('login.html')

@app.route('/register')
def register_page():
    """Serve register page"""
    return send_file('register.html')

@app.route('/user/<path:subpath>')
def serve_user_pages(subpath):
    """Serve user pages"""
    try:
        return send_file(f'Pages/user/{subpath}')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/admin/<path:subpath>')
def serve_admin_pages(subpath):
    """Serve admin pages"""
    try:
        return send_file(f'Pages/admin/{subpath}')
    except:
        return jsonify({'error': 'Page not found'}), 404

@app.route('/assets/css/<path:filename>')
def serve_css(filename):
    """Serve CSS files"""
    return send_from_directory('assets/css', filename)

@app.route('/assets/js/<path:filename>')
def serve_js(filename):
    """Serve JavaScript files"""
    return send_from_directory('assets/js', filename)

@app.route('/assets/models/<path:filename>')
def serve_models(filename):
    """Serve model files"""
    return send_from_directory('assets/models', filename)

# ==================== API ENDPOINTS ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model_loaded,
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/api/inference', methods=['POST'])
def inference():
    """
    Perform inference on uploaded image
    Expected: JSON with 'image' as base64 encoded image
    """
    try:
        if not model_loaded:
            return jsonify({'error': 'Model not loaded'}), 503
        
        data = request.get_json()
        
        if 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
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
            'predictions': predictions.tolist(),
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

@app.route('/api/inference/file', methods=['POST'])
def inference_file():
    """
    Perform inference on uploaded file
    Expected: multipart form with 'file' parameter
    """
    try:
        if not model_loaded:
            return jsonify({'error': 'Model not loaded'}), 503
        
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], timestamp + filename)
        file.save(filepath)
        
        try:
            # Preprocess and predict
            img_input = preprocess_image_for_inference(filepath)
            predictions = model.predict(img_input, verbose=0)
            
            result = {
                'success': True,
                'filename': filename,
                'predictions': predictions.tolist(),
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

@app.route('/api/model/status', methods=['GET'])
def model_status():
    """Get model status and information"""
    try:
        if model is None:
            return jsonify({
                'status': 'not_loaded',
                'available_models': get_available_models()
            }), 200
        
        return jsonify({
            'status': 'loaded',
            'model_name': 'Visage Hybrid Baseline',
            'input_shape': (96, 96, 3),
            'model_summary': str(model.summary()) if hasattr(model, 'summary') else 'N/A',
            'available_models': get_available_models()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_available_models():
    """Get list of available saved models"""
    models_dir = 'saved_models'
    available = []
    
    if os.path.exists(models_dir):
        for file in os.listdir(models_dir):
            if file.endswith(('.keras', '.h5')):
                available.append(file)
    
    return available

@app.route('/api/model/load/<model_name>', methods=['POST'])
def load_specific_model(model_name):
    """Load a specific model by name"""
    global model, model_loaded
    
    try:
        # Sanitize model name
        model_name = secure_filename(model_name)
        model_path = os.path.join('saved_models', model_name)
        
        if not os.path.exists(model_path):
            return jsonify({'error': f'Model {model_name} not found'}), 404
        
        print(f"Loading model: {model_path}")
        model = tf.keras.models.load_model(model_path)
        model_loaded = True
        
        return jsonify({
            'success': True,
            'message': f'Model {model_name} loaded successfully',
            'model_name': model_name
        }), 200
        
    except Exception as e:
        model_loaded = False
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle 413 errors (file too large)"""
    return jsonify({'error': 'File too large. Maximum size is 50MB'}), 413

# ==================== MAIN ====================

if __name__ == '__main__':
    print("=" * 50)
    print("Visage Metrics - Visual Fatigue Monitor")
    print("=" * 50)
    
    # Load model on startup
    print("\nLoading ML model...")
    load_model()
    
    # Create uploads directory if not exists
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    print("\n" + "=" * 50)
    print("Starting Flask application...")
    print("=" * 50)
    
    # Run app
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        threaded=True,
        use_reloader=False
    )
