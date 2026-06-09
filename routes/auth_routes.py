"""
Authentication routes for Visage Metrics
Handles login, register, logout, and user authentication with Supabase
"""

from flask import Blueprint, request, jsonify, session
from datetime import datetime
from dotenv import load_dotenv
import os
import logging

# Load environment variables
load_dotenv()

# Initialize logger
logger = logging.getLogger(__name__)

# Create blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Initialize Supabase client
try:
    from supabase import create_client, Client
    
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    SUPABASE_ANON_KEY = os.getenv('SUPABASE_KEY')
    
    if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        logger.info("[OK] Supabase client initialized with service role key")
        logger.info(f"[DEBUG] SERVICE_ROLE_KEY is set: {bool(SUPABASE_SERVICE_ROLE_KEY)}")
        logger.info(f"[DEBUG] SERVICE_ROLE_KEY length: {len(SUPABASE_SERVICE_ROLE_KEY) if SUPABASE_SERVICE_ROLE_KEY else 0}")
    elif SUPABASE_URL and SUPABASE_ANON_KEY:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        logger.warning("[WARNING] Supabase initialized with anon key. Table inserts may fail due to RLS if SUPABASE_SERVICE_ROLE_KEY is not configured.")
        logger.info(f"[DEBUG] SERVICE_ROLE_KEY is NOT set - using ANON_KEY instead")
    else:
        logger.error("[ERROR] Missing SUPABASE_URL or SUPABASE_KEY in .env")
        supabase = None
except ImportError:
    logger.warning("[WARNING] supabase module not installed. Install with: pip install supabase")
    supabase = None
except Exception as e:
    logger.error(f"[ERROR] Failed to initialize Supabase: {str(e)}")
    supabase = None


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user with Supabase
    Expected JSON: {
        "email": "user@example.com",
        "password": "password",
        "name": "User Name",
        "nim": "1234567890"
    }
    Note: usia, angkatan, jenis_kelamin, prodi are optional and can be filled in profile settings
    """
    try:
        if not supabase:
            return jsonify({'error': 'Database service unavailable'}), 503
        
        data = request.get_json()
        
        # Validate input - only email, password, name, nim are required
        required_fields = ['email', 'password', 'name', 'nim']
        if not data or not all(k in data for k in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        name = data['name'].strip()
        nim = data['nim'].strip()
        
        # Optional fields - will be filled in profile settings
        gender = data.get('jenis_kelamin', '').strip() if data.get('jenis_kelamin') else None
        prodi = data.get('prodi', '').strip() if data.get('prodi') else None
        usia_raw = data.get('usia')
        angkatan_raw = data.get('angkatan')
        
        usia = None
        angkatan = None
        
        if usia_raw:
            try:
                usia = int(usia_raw)
            except (TypeError, ValueError):
                return jsonify({'error': 'Usia harus angka yang valid'}), 400

        if angkatan_raw:
            try:
                angkatan = int(angkatan_raw)
            except (TypeError, ValueError):
                return jsonify({'error': 'Angkatan harus angka yang valid'}), 400
        
        # Validate email
        if '@' not in email:
            return jsonify({'error': 'Invalid email format'}), 400
        
        if not nim:
            return jsonify({'error': 'NIM tidak boleh kosong'}), 400
        
        # Validate password
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        # Try to register user with Supabase Auth
        try:
            auth_response = supabase.auth.sign_up({
                'email': email,
                'password': password
            })
            
            if getattr(auth_response, 'error', None):
                logger.error(f"Supabase auth sign up error: {auth_response.error}")
                return jsonify({'error': 'Registrasi gagal pada Supabase Auth'}), 400

            user_id = auth_response.user.id if getattr(auth_response, 'user', None) else None
            if not user_id:
                logger.error("Supabase sign_up returned no user id")
                return jsonify({'error': 'Registrasi gagal: tidak mendapatkan user id'}), 500
            
            # Insert profile data into profil_pengguna table
            profile_data = {
                'id': user_id,
                'nama_lengkap': name,
                'nim': nim,
                'status_akun': 'aktif',
                'role': 'mahasiswa'
            }
            
            # Add optional fields if provided
            if gender:
                profile_data['jenis_kelamin'] = gender
            if prodi:
                profile_data['prodi'] = prodi
            if usia:
                profile_data['usia'] = usia
            if angkatan:
                profile_data['angkatan'] = angkatan
            
            try:
                profile_result = supabase.table('profil_pengguna').insert([profile_data]).execute()
                profile_error = getattr(profile_result, 'error', None)
                if profile_error:
                    logger.error(f"Could not insert profile: {profile_error}")
                    if 'permission denied' in str(profile_error).lower() or 'not authorized' in str(profile_error).lower():
                        return jsonify({'error': 'Registrasi gagal: tidak memiliki izin untuk menulis ke profil_pengguna. Pastikan SUPABASE_SERVICE_ROLE_KEY digunakan di backend.'}), 500
                    return jsonify({'error': 'Registrasi gagal saat menyimpan data profil. Pastikan tabel profil_pengguna tersedia dan sesuai schema.'}), 500
            except Exception as profile_err:
                logger.exception(f"Could not insert profile: {str(profile_err)}")
                return jsonify({'error': 'Registrasi gagal saat menyimpan data profil.'}), 500
            
            logger.info(f"[OK] User registered: {email}")
            
            return jsonify({
                'success': True,
                'message': 'User registered successfully. Please login.',
                'email': email
            }), 201
            
        except Exception as auth_err:
            error_msg = str(auth_err)
            logger.error(f"[ERROR] Registration failed for {email}: {error_msg}")
            
            # Handle specific Supabase errors
            if 'already exists' in error_msg.lower():
                return jsonify({'error': 'Email already registered'}), 409
            
            return jsonify({'error': error_msg or 'Registration failed'}), 400
        
    except Exception as e:
        logger.exception("[ERROR] Unexpected error in register")
        return jsonify({'error': 'Server error during registration'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login user with Supabase
    Expected JSON: {
        "email": "user@example.com",
        "password": "password"
    }
    """
    try:
        if not supabase:
            return jsonify({'error': 'Database service unavailable'}), 503
        
        data = request.get_json()
        
        # Validate input
        if not data or not all(k in data for k in ['email', 'password']):
            return jsonify({'error': 'Missing email or password'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        # Try to login with Supabase Auth
        try:
            auth_response = supabase.auth.sign_in_with_password({
                'email': email,
                'password': password
            })
            
            user_id = auth_response.user.id
            user_email = auth_response.user.email
            
            # Try to fetch user profile
            try:
                profile_response = supabase.table('profil_pengguna').select('*').eq('id', user_id).execute()
                profile = profile_response.data[0] if profile_response.data else None
                
                if profile:
                    user_name = profile.get('nama_lengkap', 'Pengguna')
                    user_role = profile.get('role', 'mahasiswa')
                else:
                    user_name = user_email
                    user_role = 'mahasiswa'

                    # Create a minimal profile row if it is missing so later profile fetches work.
                    try:
                        insert_result = supabase.table('profil_pengguna').insert([{
                            'id': user_id,
                            'nama_lengkap': user_name,
                            'role': user_role
                        }]).execute()
                        if getattr(insert_result, 'error', None):
                            logger.warning(f"Could not create fallback profile for {user_id}: {insert_result.error}")
                    except Exception as create_err:
                        logger.warning(f"Could not create fallback profile for {user_id}: {str(create_err)}")
                
            except Exception as profile_err:
                logger.warning(f"Could not fetch profile for {user_id}: {str(profile_err)}")
                user_name = 'Pengguna'
                user_role = 'mahasiswa'
            
            # Set session
            session['user_id'] = user_id
            session['user_email'] = user_email
            session['user_name'] = user_name
            session['user_role'] = user_role
            session.permanent = True
            
            logger.info(f"[OK] User logged in: {email} (role: {user_role})")
            
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'user': {
                    'id': user_id,
                    'email': user_email,
                    'name': user_name,
                    'role': user_role
                }
            }), 200
            
        except Exception as auth_err:
            error_msg = str(auth_err).lower()
            logger.warning(f"[WARNING] Login failed for {email}: {str(auth_err)}")
            
            if 'invalid' in error_msg or 'credentials' in error_msg:
                return jsonify({'error': 'Invalid email or password'}), 401
            
            return jsonify({'error': 'Login failed. Please try again.'}), 401
        
    except Exception as e:
        logger.exception("[ERROR] Unexpected error in login")
        return jsonify({'error': 'Server error during login'}), 500


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Logout user"""
    try:
        if not supabase:
            session.clear()
            return jsonify({'success': True, 'message': 'Logged out'}), 200
        
        # Try to sign out from Supabase
        try:
            supabase.auth.sign_out()
        except Exception as err:
            logger.warning(f"Could not sign out from Supabase: {str(err)}")
        
        # Clear server session
        session.clear()
        
        logger.info("[OK] User logged out")
        
        return jsonify({
            'success': True,
            'message': 'Logout successful'
        }), 200
    except Exception as e:
        logger.exception("[ERROR] Error during logout")
        return jsonify({'error': 'Logout failed'}), 500


@auth_bp.route('/profile', methods=['PUT', 'POST'])
def update_profile():
    """Update current user profile"""
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401

        if not supabase:
            return jsonify({'error': 'Database service unavailable'}), 503

        data = request.get_json() or {}
        user_id = session['user_id']

        profile_updates = {}
        for key in ['nama_lengkap', 'nim', 'jenis_kelamin', 'prodi']:
            if key in data:
                profile_updates[key] = data[key]

        if profile_updates:
            try:
                # Fetch existing profile to avoid violating NOT NULL constraints on upsert
                existing_profile = None
                try:
                    resp = supabase.table('profil_pengguna').select('*').eq('id', user_id).execute()
                    existing_profile = resp.data[0] if getattr(resp, 'data', None) else None
                except Exception as fetch_err:
                    logger.warning(f"[WARNING] Could not fetch existing profile for merge: {fetch_err}")

                # Build merged payload: prefer incoming updates, fall back to existing values or safe defaults
                merged = {
                    'id': user_id,
                    'nama_lengkap': profile_updates.get('nama_lengkap') if 'nama_lengkap' in profile_updates else (existing_profile.get('nama_lengkap') if existing_profile else ''),
                    'nim': profile_updates.get('nim') if 'nim' in profile_updates else (existing_profile.get('nim') if existing_profile else ''),
                    'jenis_kelamin': profile_updates.get('jenis_kelamin') if 'jenis_kelamin' in profile_updates else (existing_profile.get('jenis_kelamin') if existing_profile else ''),
                    'prodi': profile_updates.get('prodi') if 'prodi' in profile_updates else (existing_profile.get('prodi') if existing_profile else ''),
                    'usia': profile_updates.get('usia') if 'usia' in profile_updates else (existing_profile.get('usia') if existing_profile else 0),
                    'angkatan': profile_updates.get('angkatan') if 'angkatan' in profile_updates else (existing_profile.get('angkatan') if existing_profile else 0),
                    'status_akun': existing_profile.get('status_akun') if existing_profile and existing_profile.get('status_akun') else 'aktif',
                    'role': existing_profile.get('role') if existing_profile and existing_profile.get('role') else 'mahasiswa'
                }

                # Ensure numeric fields are proper types
                try:
                    merged['usia'] = int(merged.get('usia') or 0)
                except Exception:
                    merged['usia'] = 0
                try:
                    merged['angkatan'] = int(merged.get('angkatan') or 0)
                except Exception:
                    merged['angkatan'] = 0

                profile_result = supabase.table('profil_pengguna').upsert(merged, on_conflict='id').execute()
                if getattr(profile_result, 'error', None):
                    logger.warning(f"[WARNING] Profile update error for {user_id}: {profile_result.error}")
                    return jsonify({'error': str(profile_result.error)}), 500
            except Exception as update_err:
                logger.exception(f"[ERROR] Could not update user profile for {user_id}")
                return jsonify({'error': 'Gagal menyimpan profil pengguna'}), 500

        if 'password' in data and data['password']:
            new_password = data['password']
            if len(new_password) < 6:
                return jsonify({'error': 'Kata sandi baru minimal 6 karakter'}), 400
            try:
                pwd_result = supabase.auth.admin.update_user_by_id(user_id, {'password': new_password})
                if getattr(pwd_result, 'error', None):
                    logger.warning(f"[WARNING] Password update error for {user_id}: {pwd_result.error}")
                    return jsonify({'error': 'Gagal memperbarui kata sandi. Silakan login ulang dan coba lagi.'}), 500
            except Exception as pwd_err:
                logger.warning(f"[WARNING] Could not update password for {user_id}: {str(pwd_err)}")
                return jsonify({'error': 'Gagal memperbarui kata sandi. Silakan login ulang dan coba lagi.'}), 500

        # Sync session values with the latest profile data
        if 'nama_lengkap' in profile_updates:
            session['user_name'] = profile_updates['nama_lengkap']

        return jsonify({'success': True, 'message': 'Profil berhasil diperbarui.'}), 200

    except Exception as e:
        logger.exception("[ERROR] Error updating profile")
        return jsonify({'error': 'Server error saat memperbarui profil'}), 500


@auth_bp.route('/profile', methods=['GET'])
def get_profile():
    """Get current user profile"""
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user_id = session['user_id']
        
        if not supabase:
            return jsonify({
                'success': True,
                'user': {
                    'id': user_id,
                    'email': session.get('user_email', ''),
                    'nama_lengkap': session.get('user_name', 'Pengguna'),
                    'role': session.get('user_role', 'mahasiswa')
                }
            }), 200
        
        # Fetch from Supabase
        try:
            response = supabase.table('profil_pengguna').select('*').eq('id', user_id).execute()
            profile = response.data[0] if response.data else None
            
            if not profile:
                # Profile row missing in `profil_pengguna`; return session values so the user remains logged in.
                return jsonify({
                    'success': True,
                    'user': {
                        'id': user_id,
                        'email': session.get('user_email', ''),
                        'nama_lengkap': session.get('user_name', 'Pengguna'),
                        'role': session.get('user_role', 'mahasiswa')
                    }
                }), 200
            
            return jsonify({
                'success': True,
                'user': {
                    'id': user_id,
                    'email': session.get('user_email', ''),
                    'nama_lengkap': profile.get('nama_lengkap', session.get('user_name', 'Pengguna')),
                    'role': profile.get('role', 'mahasiswa')
                }
            }), 200
        except Exception as err:
            logger.warning(f"Could not fetch profile: {str(err)}")
            return jsonify({
                'success': True,
                'user': {
                    'id': user_id,
                    'email': session.get('user_email', ''),
                    'name': session.get('user_name', ''),
                    'role': session.get('user_role', '')
                }
            }), 200
        
    except Exception as e:
        logger.exception("[ERROR] Error fetching profile")
        return jsonify({'error': 'Server error'}), 500


@auth_bp.route('/user-dashboard', methods=['GET'])
def get_user_dashboard():
    """Get current user dashboard statistics from Supabase"""
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401

        if not supabase:
            return jsonify({'error': 'Database service unavailable'}), 503

        user_id = session['user_id']

        # Fetch raw detection data
        deteksi_response = supabase.table('deteksi_mata').select('*', count='exact').eq('user_id', user_id).order('created_at', desc=True).execute()

        log_response = supabase.table('log_aktivitas').select('*').eq('user_id', user_id).order('created_at', desc=True).limit(5).execute()

        deteksi_data = deteksi_response.data or []
        log_data = log_response.data or []

        total_analisis = len(deteksi_data)
        eye_values = [item.get('eye_closure') for item in deteksi_data if item.get('eye_closure') is not None]
        average_ear = round(sum(eye_values) / len(eye_values), 3) if eye_values else 0.0
        critical_ear = round(min(eye_values), 3) if eye_values else 0.0

        last_detection = deteksi_data[0] if deteksi_data else None
        last_activity = next((item for item in log_data if item.get('tipe_log', '').upper() == 'DETEKSI_MATA'), None)
        if not last_activity and log_data:
            last_activity = log_data[0]

        recent_scans = []
        for scan in deteksi_data[:3]:
            recent_scans.append({
                'created_at': scan.get('created_at'),
                'eye_closure': scan.get('eye_closure'),
                'status_mata': scan.get('status_mata')
            })

        return jsonify({
            'success': True,
            'stats': {
                'last_scan_at': last_activity.get('created_at') if last_activity else (last_detection.get('created_at') if last_detection else None),
                'current_status': last_detection.get('status_mata') if last_detection else 'Optimal',
                'critical_ear': critical_ear,
                'average_ear': average_ear,
                'total_analisis': total_analisis,
                'last_scan_description': last_activity.get('deskripsi') if last_activity else None
            },
            'recent_scans': recent_scans,
            'logs': log_data[:3]
        }), 200

    except Exception as e:
        logger.exception("[ERROR] Error fetching user dashboard")
        return jsonify({'error': 'Tidak dapat mengambil dashboard user saat ini'}), 500


@auth_bp.route('/verify', methods=['GET'])
def verify_token():
    """Verify if user is authenticated"""
    try:
        if 'user_id' in session:
            return jsonify({
                'authenticated': True,
                'user_id': session.get('user_id'),
                'user_email': session.get('user_email', ''),
                'user_name': session.get('user_name', ''),
                'user_role': session.get('user_role', '')
            }), 200
        else:
            return jsonify({
                'authenticated': False
            }), 401
    except Exception as e:
        logger.exception("[ERROR] Error verifying token")
        return jsonify({'error': 'Server error'}), 500


@auth_bp.route('/admin/update-status/<user_id>', methods=['PUT', 'POST'])
def admin_update_status(user_id):
    """Admin: Update user account status (aktif/nonaktif)"""
    try:
        # Check if user is admin
        if 'user_role' not in session or session.get('user_role', '').lower() != 'admin':
            return jsonify({'error': 'Unauthorized. Admin access required.'}), 403

        if not supabase:
            return jsonify({'error': 'Database service unavailable'}), 503

        data = request.get_json() or {}
        new_status = data.get('status_akun', '').lower()

        # Validate status
        if new_status not in ['aktif', 'nonaktif']:
            return jsonify({'error': 'Status harus "aktif" atau "nonaktif"'}), 400

        # Update user status in profil_pengguna
        try:
            update_result = supabase.table('profil_pengguna').update({'status_akun': new_status}).eq('id', user_id).execute()
            if getattr(update_result, 'error', None):
                logger.warning(f"[WARNING] Status update error for {user_id}: {update_result.error}")
                return jsonify({'error': f'Gagal mengubah status: {str(update_result.error)}'}), 500
        except Exception as update_err:
            logger.exception(f"[ERROR] Could not update status for {user_id}")
            return jsonify({'error': 'Gagal mengubah status pengguna'}), 500

        logger.info(f"[OK] Admin {session.get('user_name')} changed status of {user_id} to {new_status}")
        return jsonify({
            'success': True,
            'message': f'Status pengguna berhasil diubah menjadi {new_status.upper()}',
            'status': new_status
        }), 200

    except Exception as e:
        logger.exception("[ERROR] Error updating user status")
        return jsonify({'error': 'Server error saat mengubah status'}), 500


@auth_bp.route('/admin/delete-user/<user_id>', methods=['DELETE', 'POST'])
def admin_delete_user(user_id):
    """Admin: Permanently delete user account and all related data"""
    try:
        # Check if user is admin
        if 'user_role' not in session or session.get('user_role', '').lower() != 'admin':
            return jsonify({'error': 'Unauthorized. Admin access required.'}), 403

        if not supabase:
            return jsonify({'error': 'Database service unavailable'}), 503

        # Prevent admin from deleting themselves
        if user_id == session.get('user_id'):
            return jsonify({'error': 'Tidak dapat menghapus akun admin sendiri'}), 400

        try:
            logger.info(f"[DEBUG] Starting delete process for user {user_id}")
            
            # First, delete all related data (deteksi_mata and log_aktivitas)
            # Delete deteksi_mata records
            logger.info(f"[DEBUG] Deleting deteksi_mata records for {user_id}")
            deteksi_delete = supabase.table('deteksi_mata').delete().eq('user_id', user_id).execute()
            logger.info(f"[DEBUG] Deteksi delete result: {deteksi_delete}")
            if getattr(deteksi_delete, 'error', None):
                logger.warning(f"[WARNING] Could not delete deteksi_mata for {user_id}: {deteksi_delete.error}")

            # Delete log_aktivitas records
            logger.info(f"[DEBUG] Deleting log_aktivitas records for {user_id}")
            logs_delete = supabase.table('log_aktivitas').delete().eq('user_id', user_id).execute()
            logger.info(f"[DEBUG] Logs delete result: {logs_delete}")
            if getattr(logs_delete, 'error', None):
                logger.warning(f"[WARNING] Could not delete log_aktivitas for {user_id}: {logs_delete.error}")

            # Finally, delete the user profile
            logger.info(f"[DEBUG] Deleting profil_pengguna record for {user_id}")
            profile_delete = supabase.table('profil_pengguna').delete().eq('id', user_id).execute()
            logger.info(f"[DEBUG] Profile delete result: {profile_delete}")
            if getattr(profile_delete, 'error', None):
                logger.warning(f"[WARNING] Profile delete error for {user_id}: {profile_delete.error}")
                logger.error(f"[ERROR] Detailed error: {profile_delete}")
                return jsonify({'error': f'Gagal menghapus profil: {str(profile_delete.error)}'}), 500

            # Try to delete user from Supabase Auth (optional - may fail if not using admin API)
            try:
                supabase.auth.admin.delete_user(user_id)
                logger.info(f"[OK] User {user_id} deleted from Supabase Auth")
            except Exception as auth_err:
                logger.warning(f"[WARNING] Could not delete user {user_id} from Supabase Auth: {str(auth_err)}")
                # Continue anyway - profile is already deleted from database

        except Exception as delete_err:
            logger.exception(f"[ERROR] Could not delete user {user_id}")
            return jsonify({'error': 'Gagal menghapus pengguna. Pastikan Anda memiliki akses admin.'}), 500

        logger.info(f"[OK] Admin {session.get('user_name')} deleted user {user_id} permanently")
        return jsonify({
            'success': True,
            'message': 'Akun pengguna berhasil dihapus secara permanen beserta semua data terkait'
        }), 200

    except Exception as e:
        logger.exception("[ERROR] Error deleting user")
        return jsonify({'error': 'Server error saat menghapus pengguna'}), 500


def register_auth_routes(app):
    """Register authentication routes with Flask app"""
    app.register_blueprint(auth_bp)
