// Import koneksi jantung Supabase
import { supabase } from './supabaseClient.js';

document.addEventListener("DOMContentLoaded", function() {
    const formLogin = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');
    const btnSubmit = document.getElementById('btnSubmit');

    if (formLogin) {
        formLogin.addEventListener('submit', async function(event) {
            // Mencegah reload halaman bawaan form
            event.preventDefault();

            // Sembunyikan error dan ubah tombol jadi loading
            errorMsg.classList.add('hidden');
            const teksAsli = btnSubmit.innerHTML;
            btnSubmit.innerHTML = 'Memverifikasi...';
            btnSubmit.disabled = true;

            const email = document.getElementById('inputEmail').value.trim();
            const password = document.getElementById('inputPassword').value;

            try {
                // 1. Eksekusi Login API Supabase
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) throw error; // Lempar ke blok catch di bawah jika gagal

                // 2. Ambil informasi Role/Peran dari tabel profil_pengguna
                // PERBAIKAN: Menggunakan .maybeSingle() agar tidak error jika data profil belum ada
                const { data: profileData, error: profileError } = await supabase
                    .from('profil_pengguna')
                    .select('role')
                    .eq('id', data.user.id)
                    .maybeSingle();

                if (profileError) throw profileError;

                // 3. Simpan preferensi "Remember Me"
                const checkRemember = document.getElementById('checkRemember');
                if (checkRemember && checkRemember.checked) {
                    localStorage.setItem('isLoggedIn', 'true');
                } else {
                    sessionStorage.setItem('isLoggedIn', 'true');
                }

                // 4. Redirect cerdas berdasarkan Role
                // Jika profil ditemukan dan role-nya admin, arahkan ke dashboard admin
                if (profileData && profileData.role && profileData.role.toLowerCase() === 'admin') {
                    window.location.href = "Pages/admin/dashboard.html";
                } else {
                    // Jika profil mahasiswa ATAU profilnya kosong (belum ada), arahkan ke landing page
                    window.location.href = "Pages/user/landing.html";
                }

            } catch (err) {
                // Tampilkan pesan error jika login gagal
                errorMsg.innerText = err.message || 'Login gagal. Periksa kembali email dan password Anda.';
                errorMsg.classList.remove('hidden');
            } finally {
                // Kembalikan kondisi tombol
                btnSubmit.innerHTML = teksAsli;
                btnSubmit.disabled = false;
            }
        });
    }
});