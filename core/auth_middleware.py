"""
Authentication middleware for protecting routes
Provides decorators for role-based access control
"""

from functools import wraps
from flask import session, jsonify, request, redirect, url_for
import logging

logger = logging.getLogger(__name__)


def login_required(f):
    """Decorator to require user to be logged in"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Not authenticated'}), 401
            return redirect('/')
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Not authenticated'}), 401
            return redirect('/')
        
        user_role = session.get('user_role', '').lower()
        if user_role != 'admin':
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Forbidden: Admin access required'}), 403
            return redirect('/')
        
        return f(*args, **kwargs)
    return decorated_function


def user_required(f):
    """Decorator to require user role (not admin)"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Not authenticated'}), 401
            return redirect('/')
        
        user_role = session.get('user_role', '').lower()
        if user_role == 'admin':
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Forbidden: User access only'}), 403
            return redirect('/')
        
        return f(*args, **kwargs)
    return decorated_function


def get_current_user():
    """Get current logged-in user info from session"""
    if 'user_id' not in session:
        return None
    
    return {
        'id': session.get('user_id'),
        'email': session.get('user_email'),
        'name': session.get('user_name'),
        'role': session.get('user_role')
    }


def is_authenticated():
    """Check if user is authenticated"""
    return 'user_id' in session


def is_admin():
    """Check if current user is admin"""
    return session.get('user_role', '').lower() == 'admin'


def is_user():
    """Check if current user is regular user (not admin)"""
    user_role = session.get('user_role', '').lower()
    return user_role != 'admin' and 'user_id' in session
