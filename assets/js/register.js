// Import koneksi jantung Supabase
import { supabase } from './supabaseClient.js';

document.addEventListener("DOMContentLoaded", function() {
    const formRegister = document.getElementById('registerForm');
    const inputPassword = document.getElementById('inputPasswordReg');
    const inputRepassword = document.getElementById('inputRepassword');
    const errorMsg = document.getElementById('errorMsg');
    const btnSubmit = document.getElementById('btnSubmit');

    if (formRegister) {
        formRegister.addEventListener('submit', async function(event) {
            // Mencegah reload halaman
            event.preventDefault();

            // Sembunyikan pesan error sebelumnya
            errorMsg.classList.add('hidden');

            // Ambil semua nilai dari form
            const namaLengkap = document.getElementById('inputNama').value.trim();
            const email = document.getElementById('inputEmail').value.trim();
            const nim = document.getElementById('inputNim').value.trim();
            const prodi = document.getElementById('inputProdi').value;
            const jenisKelamin = document.getElementById('inputJK').value;
            const passValue = inputPassword.value;
            const repassValue = inputRepassword.value;

            // 1. Validasi Password
            if (passValue !== repassValue) {
                errorMsg.innerText = "Password tidak cocok! Harap cek kembali.";
                errorMsg.classList.remove('hidden');
                inputRepassword.classList.add('border-red-500');
                setTimeout(() => inputRepassword.classList.remove('border-red-500'), 3000);
                return;
            }

            if (passValue.length < 6) {
                errorMsg.innerText = "Password minimal harus 6 karakter!";
                errorMsg.classList.remove('hidden');
                return;
            }

            // Ubah tombol jadi loading
            const teksAsli = btnSubmit.innerHTML;
            btnSubmit.innerHTML = 'Memproses...';
            btnSubmit.disabled = true;

            try {
                // 2. Daftarkan Akun ke Supabase Auth (Brankas Keamanan)
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: email,
                    password: passValue,
                    options: {
                        data: { full_name: namaLengkap } // Menyimpan nama di metadata auth
                    }
                });

                if (authError) throw authError;

                // 3. Simpan Data Diri ke Tabel "profil_pengguna"
                if (authData && authData.user) {
                    const { error: dbError } = await supabase
                        .from('profil_pengguna')
                        .insert([
                            { 
                                id: authData.user.id, // Menghubungkan ID Auth dengan ID Profil
                                nama_lengkap: namaLengkap, 
                                nim: nim, 
                                prodi: prodi, 
                                jenis_kelamin: jenisKelamin,
                                role: 'mahasiswa' // Default role
                            }
                        ]);

                    if (dbError) {
                        console.error("Gagal menyimpan profil:", dbError);
                        // Catatan: Jika ini gagal, akun Auth tetap terbuat. 
                        // Idealnya menggunakan Trigger Supabase, tapi insert manual ini sudah cukup untuk sekarang.
                    }
                }

                // 4. Jika semua berhasil
                alert(`Registrasi Berhasil!\n\nEmail: ${email}\nSilakan Login menggunakan akun ini.`);
                
                // Redirect ke halaman login
                window.location.href = "login.html";

            } catch (err) {
                // Tampilkan pesan error jika proses gagal
                errorMsg.innerText = err.message || 'Terjadi kesalahan saat registrasi. Silakan coba lagi.';
                errorMsg.classList.remove('hidden');
            } finally {
                // Kembalikan tombol ke semula
                btnSubmit.innerHTML = teksAsli;
                btnSubmit.disabled = false;
            }
        });
    }

    // Sembunyikan error otomatis saat user mulai memperbaiki input
    if (inputRepassword) {
        inputRepassword.addEventListener('input', () => {
            errorMsg.classList.add('hidden');
        });
    }
});