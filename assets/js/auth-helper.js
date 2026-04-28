// assets/js/auth-helper.js
// Helper functions untuk semua operasi Supabase

import { supabase } from './supabaseClient.js';

// ===== AUTH FUNCTIONS =====

/**
 * Login user dengan email dan password
 */
export async function loginUser(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    return { data, error };
}

/**
 * Register user dengan email dan password
 */
export async function registerUser(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });
    return { data, error };
}

/**
 * Logout user
 */
export async function logoutUser() {
    const { error } = await supabase.auth.signOut();
    return { error };
}

/**
 * Dapatkan user yang sedang login
 */
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/**
 * Dapatkan session
 */
export async function getCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

// ===== PROFIL PENGGUNA FUNCTIONS =====

/**
 * Insert profile pengguna ke database
 * @param {Object} profileData - {nim, nama_lengkap, jenis_kelamin, prodi, usia, angkatan, status_akun, role}
 */
export async function insertProfilPengguna(profileData) {
    const user = await getCurrentUser();
    
    if (!user) {
        return { error: 'User tidak ditemukan. Silakan login terlebih dahulu.' };
    }

    const { error } = await supabase
        .from('profil_pengguna')
        .insert([
            {
                id: user.id,
                nim: profileData.nim,
                nama_lengkap: profileData.nama_lengkap,
                jenis_kelamin: profileData.jenis_kelamin,
                prodi: profileData.prodi,
                usia: profileData.usia,
                angkatan: profileData.angkatan,
                status_akun: profileData.status_akun || 'aktif',
                role: profileData.role || 'mahasiswa'
            }
        ]);

    return { error };
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
    const user = await getCurrentUser();
    
    if (!user) {
        return { error: 'User tidak ditemukan. Silakan login terlebih dahulu.' };
    }

    const { error } = await supabase
        .from('deteksi_mata')
        .insert([
            {
                user_id: user.id,
                blink_rate: detectionData.blink_rate,
                eye_closure: detectionData.eye_closure,
                head_tilt: detectionData.head_tilt,
                status_mata: detectionData.status_mata,
                durasi_sesi: detectionData.durasi_sesi || 0
            }
        ]);

    return { error };
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
    let userId = logData.user_id;
    
    // Jika user_id tidak diberikan, coba ambil dari current user
    if (!userId) {
        const user = await getCurrentUser();
        userId = user ? user.id : null;
    }

    const { error } = await supabase
        .from('log_aktivitas')
        .insert([
            {
                tipe_log: logData.tipe_log,
                deskripsi: logData.deskripsi,
                user_id: userId
            }
        ]);

    return { error };
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
