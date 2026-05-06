"""
Authentication routes for Visage Metrics
Handles login, register, logout, and user authentication
"""

from flask import Blueprint, request, jsonify, session
from datetime import datetime
import json

# Create blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Mock user database (replace with real database)
users_db = {
    'admin@visage.com': {
        'password': 'admin123',
        'name': 'Admin User',
        'role': 'admin'
    },
    'user@visage.com': {
        'password': 'user123',
        'name': 'Regular User',
        'role': 'user'
    }
}

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user
    Expected JSON: {
        "email": "user@example.com",
        "password": "password",
        "name": "User Name"
    }
    """
    try:
        data = request.get_json()
        
        # Validate input
        if not data or not all(k in data for k in ['email', 'password', 'name']):
            return jsonify({'error': 'Missing required fields'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        name = data['name'].strip()
        
        # Validate email
        if '@' not in email:
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if user already exists
        if email in users_db:
            return jsonify({'error': 'Email already registered'}), 409
        
        # Create new user
        users_db[email] = {
            'password': password,
            'name': name,
            'role': 'user',
            'created_at': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'email': email
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login user
    Expected JSON: {
        "email": "user@example.com",
        "password": "password"
    }
    """
    try:
        data = request.get_json()
        
        # Validate input
        if not data or not all(k in data for k in ['email', 'password']):
            return jsonify({'error': 'Missing email or password'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        # Check user
        if email not in users_db:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        user = users_db[email]
        if user['password'] != password:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Set session
        session['user_id'] = email
        session['user_name'] = user['name']
        session['user_role'] = user['role']
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'email': email,
                'name': user['name'],
                'role': user['role']
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Logout user"""
    try:
        session.clear()
        return jsonify({
            'success': True,
            'message': 'Logout successful'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile', methods=['GET'])
def get_profile():
    """Get current user profile"""
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user_id = session['user_id']
        user = users_db.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'success': True,
            'user': {
                'email': user_id,
                'name': user['name'],
                'role': user['role']
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/verify', methods=['GET'])
def verify_token():
    """Verify if user is authenticated"""
    try:
        if 'user_id' in session:
            return jsonify({
                'authenticated': True,
                'user_id': session['user_id'],
                'user_name': session.get('user_name', ''),
                'user_role': session.get('user_role', '')
            }), 200
        else:
            return jsonify({
                'authenticated': False
            }), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    """
    Change user password
    Expected JSON: {
        "old_password": "current_password",
        "new_password": "new_password",
        "confirm_password": "new_password"
    }
    """
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        data = request.get_json()
        
        if not data or not all(k in data for k in ['old_password', 'new_password', 'confirm_password']):
            return jsonify({'error': 'Missing required fields'}), 400
        
        user_id = session['user_id']
        user = users_db.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Verify old password
        if user['password'] != data['old_password']:
            return jsonify({'error': 'Incorrect old password'}), 401
        
        # Verify passwords match
        if data['new_password'] != data['confirm_password']:
            return jsonify({'error': 'Passwords do not match'}), 400
        
        # Update password
        user['password'] = data['new_password']
        
        return jsonify({
            'success': True,
            'message': 'Password changed successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def register_auth_routes(app):
    """Register authentication routes with Flask app"""
    app.register_blueprint(auth_bp)
