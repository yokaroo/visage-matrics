// Login Page - Using Backend API
import { supabase } from './supabaseClient.js';

document.addEventListener("DOMContentLoaded", function() {
    const formLogin = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');
    const btnSubmit = document.getElementById('btnSubmit');

    if (formLogin) {
        formLogin.addEventListener('submit', async function(event) {
            event.preventDefault();

            // Reset error message
            errorMsg.classList.add('hidden');
            const teksAsli = btnSubmit.innerHTML;
            btnSubmit.innerHTML = 'Memverifikasi...';
            btnSubmit.disabled = true;

            const email = document.getElementById('inputEmail').value.trim();
            const password = document.getElementById('inputPassword').value;

            // Validasi input
            if (!email || !password) {
                showError('Email dan password harus diisi!');
                resetButton();
                return;
            }

            try {
                // Kirim login request ke backend (include credentials so server session cookie is stored)
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                });

                const payload = await response.json();

                if (!response.ok) {
                    throw new Error(payload.error || 'Login gagal. Periksa kembali email dan password Anda.');
                }

                // Simpan preferensi "Remember Me"
                const checkRemember = document.getElementById('checkRemember');
                const loginName = payload.user.nama_lengkap || payload.user.name || payload.user.email || 'Pengguna';
                if (checkRemember && checkRemember.checked) {
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('userRole', payload.user.role);
                    localStorage.setItem('userName', loginName);
                    if (email) {
                        localStorage.setItem(`user_name_${email}`, loginName);
                    }
                } else {
                    sessionStorage.setItem('isLoggedIn', 'true');
                    sessionStorage.setItem('userRole', payload.user.role);
                    sessionStorage.setItem('userName', loginName);
                    if (email) {
                        localStorage.setItem(`user_name_${email}`, loginName);
                    }
                }

                try {
                    const { data: supaData, error: supaError } = await supabase.auth.signInWithPassword({
                        email: email,
                        password: password
                    });
                    if (supaError) {
                        console.warn('[LOGIN] Supabase client sign-in warning:', supaError.message || supaError);
                    }
                } catch (supaErr) {
                    console.warn('[LOGIN] Supabase client sign-in failed:', supaErr);
                }

                // Redirect berdasarkan role
                setTimeout(() => {
                    if (payload.user.role && payload.user.role.toLowerCase() === 'admin') {
                        window.location.href = '/admin/dashboard.html';
                    } else {
                        window.location.href = '/user/landing.html';
                    }
                }, 500);

            } catch (err) {
                showError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
            } finally {
                resetButton();
            }

            function showError(msg) {
                errorMsg.innerText = msg;
                errorMsg.classList.remove('hidden');
                console.error('[LOGIN ERROR]', msg);
            }

            function resetButton() {
                btnSubmit.innerHTML = teksAsli;
                btnSubmit.disabled = false;
            }
        });
    }
});