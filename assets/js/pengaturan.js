// File: assets/js/pengaturan.js
import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {

    const formProfil = document.getElementById('formProfil');
    const btnSimpan = document.querySelector('button[form="formProfil"]');
    const inputNama = document.getElementById('input-nama');
    const inputId = document.getElementById('input-id');
    const sidebarNama = document.getElementById('sidebar-nama-admin');
    
    // --- 1. OTENTIKASI & TARIK DATA PROFIL AWAL ---
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!session) {
        alert("Akses ditolak! Sesi telah habis.");
        window.location.replace('../../login.html');
        return;
    }

    const loadProfileData = async () => {
        const { data: profile } = await supabase
            .from('profil_pengguna')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profile) {
            inputNama.value = profile.nama_lengkap || '';
            inputId.value = profile.nim || profile.id.substring(0, 8).toUpperCase(); // Pakai NIP atau UUID awal
            if(sidebarNama) sidebarNama.textContent = profile.nama_lengkap;
        }
    };
    
    await loadProfileData();

    // --- 2. LOGIKA LOGOUT ADMIN ---
    const btnLogoutAdmin = document.getElementById('btn-logout-admin');
    if(btnLogoutAdmin) {
        btnLogoutAdmin.addEventListener('click', async function() {
            if(confirm("Yakin ingin keluar dari Dashboard Admin?")) {
                await supabase.auth.signOut();
                window.location.replace('../../login.html'); 
            }
        });
    }

    // --- 3. LOGIKA FORM SUBMIT (UPDATE KE SUPABASE) ---
    if (formProfil && btnSimpan) {
        formProfil.addEventListener('submit', async function(e) {
            e.preventDefault(); 

            const inputs = formProfil.querySelectorAll('input');
            const namaBaru = inputs[0].value.trim();
            const pwLama = inputs[2].value; // Index 2 karena [1] adalah ID disabled
            const pwBaru = inputs[3].value;
            const pwKonfirm = inputs[4].value;

            // --- VALIDASI KEAMANAN (Jika user ingin ganti password) ---
            if (pwBaru !== "" || pwKonfirm !== "") {
                // Di Supabase modern, kita tidak bisa mengecek "Password Lama" secara langsung di sisi client (demi keamanan)
                // Oleh karena itu, kita cukup pastikan format password baru benar
                if (pwBaru.length < 8) {
                    alert("⚠️ Validasi Gagal: Password baru terlalu lemah. Minimal harus 8 karakter.");
                    inputs[3].focus();
                    return; 
                }
                if (pwBaru !== pwKonfirm) {
                    alert("⚠️ Validasi Gagal: Konfirmasi password tidak cocok dengan password baru.");
                    inputs[4].focus();
                    return; 
                }
            }

            // --- SIMULASI LOADING ---
            const originalContent = btnSimpan.innerHTML;
            btnSimpan.innerHTML = `<span class="inline-block animate-spin mr-2">⌛</span>Menyimpan...`;
            btnSimpan.disabled = true;
            btnSimpan.classList.add('opacity-70', 'cursor-not-allowed');

            try {
                // TUGAS 1: Update Nama di Tabel Profil_Pengguna
                const { error: updateProfileError } = await supabase
                    .from('profil_pengguna')
                    .update({ nama_lengkap: namaBaru })
                    .eq('id', session.user.id);

                if(updateProfileError) throw updateProfileError;

                let pesanSukses = `✅ Berhasil: Profil atas nama "${namaBaru}" telah diperbarui.`;

                // TUGAS 2: Update Password di Auth System (Jika diisi)
                if (pwBaru !== "") {
                    const { error: updateAuthError } = await supabase.auth.updateUser({
                        password: pwBaru
                    });

                    if(updateAuthError) {
                        alert("Gagal merubah password. Sesi Anda mungkin sudah terlalu lama. Silakan logout dan login kembali untuk mengubah password.");
                        throw updateAuthError;
                    }
                    pesanSukses += "\nKredensial password Anda juga telah berhasil diganti.";
                }
                
                alert(pesanSukses);
                
                // Refresh data di layar
                if(sidebarNama) sidebarNama.textContent = namaBaru;

                // Kosongkan form password
                inputs[2].value = "";
                inputs[3].value = "";
                inputs[4].value = "";

            } catch (err) {
                console.error("Gagal update profil:", err);
            } finally {
                // Kembalikan tombol
                btnSimpan.innerHTML = originalContent;
                btnSimpan.disabled = false;
                btnSimpan.classList.remove('opacity-70', 'cursor-not-allowed');
            }
        });
    }
});