"""
Analytics routes for Visage Metrics
Handles analytics data, reports, and statistics
"""

from flask import Blueprint, request, jsonify, session
from datetime import datetime, timedelta
import json

# Import Supabase client from auth routes to allow server-side inserts
from routes.auth_routes import supabase

# Create blueprint
analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

# Mock analytics database
analytics_db = {}

@analytics_bp.route('/today', methods=['GET'])
def get_today_analytics():
    """
    Get analytics for today
    Returns: Daily statistics and fatigue detection results
    """
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user_id = session['user_id']
        today = datetime.now().date()
        
        return jsonify({
            'success': True,
            'date': str(today),
            'user_id': user_id,
            'total_detections': 0,
            'fatigue_count': 0,
            'normal_count': 0,
            'accuracy_score': 0.0,
            'timeline': []
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/7days', methods=['GET'])
def get_7days_analytics():
    """
    Get analytics for last 7 days
    Returns: Weekly statistics and trends
    """
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user_id = session['user_id']
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=7)
        
        daily_data = []
        for i in range(7):
            date = start_date + timedelta(days=i)
            daily_data.append({
                'date': str(date),
                'detections': 0,
                'fatigue_ratio': 0.0
            })
        
        return jsonify({
            'success': True,
            'period': {
                'start': str(start_date),
                'end': str(end_date)
            },
            'user_id': user_id,
            'total_detections': 0,
            'average_fatigue_ratio': 0.0,
            'daily_data': daily_data,
            'trend': 'stable'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/30days', methods=['GET'])
def get_30days_analytics():
    """
    Get analytics for last 30 days
    Returns: Monthly statistics and detailed trends
    """
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user_id = session['user_id']
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)
        
        daily_data = []
        for i in range(30):
            date = start_date + timedelta(days=i)
            daily_data.append({
                'date': str(date),
                'detections': 0,
                'fatigue_ratio': 0.0
            })
        
        return jsonify({
            'success': True,
            'period': {
                'start': str(start_date),
                'end': str(end_date)
            },
            'user_id': user_id,
            'total_detections': 0,
            'average_fatigue_ratio': 0.0,
            'peak_day': None,
            'daily_data': daily_data,
            'trend': 'stable'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/summary', methods=['GET'])
def get_analytics_summary():
    """
    Get overall analytics summary
    Returns: Overall statistics and key metrics
    """
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user_id = session['user_id']
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'overall_stats': {
                'total_detections': 0,
                'total_sessions': 0,
                'average_session_duration': 0,
                'total_fatigue_time': 0,
                'avg_fatigue_ratio': 0.0
            },
            'recent_activity': {
                'last_detection': None,
                'last_session': None
            },
            'health_score': 0.0
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/save-detection', methods=['POST'])
def save_detection():
    """
    Save a detection record to Supabase deteksi_mata table
    Expected JSON:
    {
        "nilai_ear": number (required),
        "blink_rate": number,
        "eye_closure": number,
        "head_tilt": number,
        "status_mata": string (required),
        "durasi_sesi": number
    }
    """
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Sesi telah habis. Silakan login ulang untuk melanjutkan.', 'session_expired': True}), 401

        if not supabase:
            return jsonify({'error': 'Database service unavailable'}), 503

        data = request.get_json() or {}
        required_fields = ['nilai_ear', 'status_mata']
        if any(field not in data for field in required_fields):
            return jsonify({'error': f'Missing required fields: {required_fields}'}), 400

        user_id = session['user_id']
        
        # Build record with required fields
        record = {
            'user_id': user_id,
            'nilai_ear': float(data.get('nilai_ear', 0)),
            'blink_rate': float(data.get('blink_rate', 0)),
            'eye_closure': float(data.get('eye_closure', 0)),
            'head_tilt': float(data.get('head_tilt', 0)),
            'status_mata': str(data.get('status_mata', 'normal')).lower(),
            'durasi_sesi': int(data.get('durasi_sesi', 0))
        }

        try:
            result = supabase.table('deteksi_mata').insert([record]).execute()
            if getattr(result, 'error', None):
                error_msg = str(result.error)
                if 'row-level security' in error_msg.lower() or '42501' in error_msg:
                    return jsonify({'error': 'Akses ditolak: Silakan login ulang untuk melanjutkan.', 'code': 42501}), 403
                return jsonify({'error': error_msg}), 500

            return jsonify({'success': True, 'message': 'Detection saved successfully'}), 201
        except Exception as db_err:
            error_msg = str(db_err)
            if 'row-level security' in error_msg.lower() or '42501' in error_msg:
                return jsonify({'error': 'RLS Policy Error: Silakan login ulang.', 'session_expired': True}), 403
            raise
    except Exception as e:
        error_msg = str(e)
        if 'session' in error_msg.lower() or 'authenticated' in error_msg.lower():
            return jsonify({'error': 'Sesi tidak valid. Silakan login ulang.', 'session_expired': True}), 401
        return jsonify({'error': error_msg}), 500


@analytics_bp.route('/save-log', methods=['POST'])
def save_log():
    """
    Save an activity log record to Supabase log_aktivitas table
    Expected JSON: {
        "tipe_log": string,
        "deskripsi": string
    }
    """
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Sesi telah habis. Silakan login ulang untuk melanjutkan.', 'session_expired': True}), 401

        if not supabase:
            return jsonify({'error': 'Database service unavailable'}), 503

        data = request.get_json() or {}
        if not data.get('tipe_log') or not data.get('deskripsi'):
            return jsonify({'error': 'Missing required fields'}), 400

        user_id = session['user_id']
        log_record = {
            'user_id': user_id,
            'tipe_log': data['tipe_log'],
            'deskripsi': data['deskripsi']
        }

        try:
            result = supabase.table('log_aktivitas').insert([log_record]).execute()
            if getattr(result, 'error', None):
                error_msg = str(result.error)
                if 'row-level security' in error_msg.lower() or '42501' in error_msg:
                    return jsonify({'error': 'Akses ditolak: Silakan login ulang.', 'session_expired': True}), 403
                return jsonify({'error': error_msg}), 500

            return jsonify({'success': True, 'message': 'Log saved successfully'}), 201
        except Exception as db_err:
            error_msg = str(db_err)
            if 'row-level security' in error_msg.lower() or '42501' in error_msg:
                return jsonify({'error': 'RLS Policy Error: Silakan login ulang.', 'session_expired': True}), 403
            raise
    except Exception as e:
        error_msg = str(e)
        if 'session' in error_msg.lower() or 'authenticated' in error_msg.lower():
            return jsonify({'error': 'Sesi tidak valid. Silakan login ulang.', 'session_expired': True}), 401
        return jsonify({'error': error_msg}), 500


@analytics_bp.route('/export/<period>', methods=['GET'])
def export_analytics(period):
    """
    Export analytics data in CSV format
    
    Args:
        period: 'today', '7days', '30days'
    """
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        if period not in ['today', '7days', '30days']:
            return jsonify({'error': 'Invalid period'}), 400
        
        return jsonify({
            'success': True,
            'message': f'Analytics export for {period} is ready',
            'download_url': f'/api/analytics/download/{period}'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/health-report', methods=['GET'])
def get_health_report():
    """
    Get detailed health report
    Returns: Comprehensive health analysis and recommendations
    """
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user_id = session['user_id']
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'overall_health': 'good',
            'health_score': 85,
            'recommendations': [
                'Maintain regular eye rest schedule',
                'Take short breaks every hour',
                'Ensure adequate lighting'
            ],
            'key_metrics': {
                'avg_daily_fatigue_time': '2h 15m',
                'peak_fatigue_time': '14:00-16:00',
                'improvement_trend': 'positive'
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def register_analytics_routes(app):
    """Register analytics routes with Flask app"""
    app.register_blueprint(analytics_bp)
