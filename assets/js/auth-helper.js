/**
 * Authentication Helper - Client-side auth utilities
 * Provides functions for checking auth status, role checking, logout, etc.
 */

// ===== SESSION-BASED AUTH FUNCTIONS =====

import { supabase } from './supabaseClient.js';

/**
 * Get current user profile from backend session
 */
export async function getCurrentUserProfile() {
    try {
        const response = await fetch('/api/auth/profile', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            return data.user;
        }
        return null;
    } catch (error) {
        console.error('[AuthHelper] Profile fetch error:', error);
        return null;
    }
}

export async function getCurrentUser() {
    return await getCurrentUserProfile();
}

/**
 * Login user melalui backend API
 */
export async function loginWithApi(email, password) {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
        const message = payload?.error || 'Login gagal. Silakan coba lagi.';
        throw new Error(message);
    }

    return payload;
}

/**
 * Register user melalui backend API
 */
export async function registerWithApi(email, password, name) {
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, name })
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
        const message = payload?.error || 'Registrasi gagal. Silakan coba lagi.';
        throw new Error(message);
    }

    return payload;
}

/**
 * Logout user
 */
export async function logoutWithApi() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Logout gagal');
        }

        // Clear local storage
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        sessionStorage.clear();

        return true;
    } catch (error) {
        console.error('[AuthHelper] Logout error:', error);
        throw error;
    }
}

/**
 * Check if user is authenticated (from server session)
 */
export async function isAuthenticated() {
    const user = await getCurrentUserProfile();
    return user !== null;
}

/**
 * Check if current user is admin
 */
export async function isAdmin() {
    const user = await getCurrentUserProfile();
    return user?.role?.toLowerCase() === 'admin';
}

/**
 * Check if current user is regular user
 */
export async function isUser() {
    const user = await getCurrentUserProfile();
    return user && user?.role?.toLowerCase() !== 'admin';
}

/**
 * Get user name
 */
export async function getUserName() {
    const user = await getCurrentUserProfile();
    return user?.name || 'Pengguna';
}

/**
 * Get user email
 */
export async function getUserEmail() {
    const user = await getCurrentUserProfile();
    return user?.email || null;
}

/**
 * Redirect to login if not authenticated
 */
export async function redirectIfNotAuthenticated() {
    const user = await getCurrentUserProfile();
    if (!user) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

/**
 * Redirect based on user role
 */
export async function redirectByRole() {
    const user = await getCurrentUserProfile();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    if (user.role?.toLowerCase() === 'admin') {
        window.location.href = '/admin/dashboard.html';
    } else {
        window.location.href = '/user/landing.html';
    }
}

/**
 * Require admin access - redirect if not admin
 */
export async function requireAdmin() {
    const user = await getCurrentUserProfile();
    if (!user) {
        window.location.href = '/login.html';
        return false;
    }
    if (user.role?.toLowerCase() !== 'admin') {
        window.location.href = '/user/landing.html';
        return false;
    }
    return true;
}

/**
 * Require user access - redirect if admin or not logged in
 */
export async function requireUser() {
    const user = await getCurrentUserProfile();
    if (!user) {
        window.location.href = '/login.html';
        return false;
    }
    if (user.role?.toLowerCase() === 'admin') {
        window.location.href = '/admin/dashboard.html';
        return false;
    }
    return true;
}

/**
 * Dapatkan profil pengguna berdasarkan user_id
 */
export async function getProfilPengguna(userId) {
    const { data, error } = await supabase
        .from('profil_pengguna')
        .select('*')
        .eq('id', userId)
        .single();

    return { data, error };
}

/**
 * Update profil pengguna
 */
export async function updateProfilPengguna(userId, updates) {
    const { data, error } = await supabase
        .from('profil_pengguna')
        .update(updates)
        .eq('id', userId);

    return { data, error };
}

// ===== DETEKSI MATA FUNCTIONS =====

/**
 * Insert hasil deteksi mata
 * @param {Object} detectionData - {blink_rate, eye_closure, head_tilt, status_mata, durasi_sesi}
 */
export async function insertDeteksiMata(detectionData) {
    const response = await fetch('/api/analytics/save-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(detectionData)
    });

    const payload = await response.json().catch(() => null);
    
    // Check for session expired or auth issues
    if (response.status === 401 || response.status === 403) {
        return { error: new Error(payload?.error || 'Sesi tidak valid, silakan login ulang.') };
    }
    
    if (!response.ok) {
        return { error: new Error(payload?.error || 'Gagal menyimpan hasil deteksi') };
    }

    return { error: null };
}

/**
 * Dapatkan semua deteksi mata user
 */
export async function getDeteksiMataUser(userId) {
    const { data, error } = await supabase
        .from('deteksi_mata')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    return { data, error };
}

/**
 * Dapatkan deteksi mata user hari ini
 */
export async function getDeteksiMataHariIni(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString();

    const { data, error } = await supabase
        .from('deteksi_mata')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', todayString)
        .order('created_at', { ascending: false });

    return { data, error };
}

/**
 * Dapatkan statistik deteksi mata user dalam 7 hari
 */
export async function getDeteksiMata7Hari(userId) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoString = sevenDaysAgo.toISOString();

    const { data, error } = await supabase
        .from('deteksi_mata')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgoString)
        .order('created_at', { ascending: false });

    return { data, error };
}

/**
 * Dapatkan statistik deteksi mata user dalam 30 hari
 */
export async function getDeteksiMata30Hari(userId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoString = thirtyDaysAgo.toISOString();

    const { data, error } = await supabase
        .from('deteksi_mata')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgoString)
        .order('created_at', { ascending: false });

    return { data, error };
}

// ===== LOG AKTIVITAS FUNCTIONS =====

/**
 * Insert log aktivitas
 * @param {Object} logData - {tipe_log, deskripsi, user_id (optional)}
 */
export async function insertLogAktivitas(logData) {
    const response = await fetch('/api/analytics/save-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(logData)
    });

    const payload = await response.json().catch(() => null);
    
    // Check for session expired or auth issues
    if (response.status === 401 || response.status === 403) {
        return { error: new Error(payload?.error || 'Sesi tidak valid, silakan login ulang.') };
    }
    
    if (!response.ok) {
        return { error: new Error(payload?.error || 'Gagal menyimpan log aktivitas') };
    }

    return { error: null };
}

/**
 * Dapatkan semua log aktivitas
 */
export async function getAllLogAktivitas() {
    const { data, error } = await supabase
        .from('log_aktivitas')
        .select('*')
        .order('created_at', { ascending: false });

    return { data, error };
}

/**
 * Dapatkan log aktivitas user tertentu
 */
export async function getLogAktivitasUser(userId) {
    const { data, error } = await supabase
        .from('log_aktivitas')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    return { data, error };
}

/**
 * Dapatkan log aktivitas dalam periode tertentu
 */
export async function getLogAktivitasByDate(startDate, endDate) {
    const { data, error } = await supabase
        .from('log_aktivitas')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

    return { data, error };
}
