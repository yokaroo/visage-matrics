// File: assets/js/pengaturan.js

document.addEventListener('DOMContentLoaded', () => {

    const formProfil = document.getElementById('formProfil');
    // Mencari tombol submit yang terhubung ke form tersebut
    const btnSimpan = document.querySelector('button[form="formProfil"]');

    if (formProfil && btnSimpan) {
        formProfil.addEventListener('submit', function(e) {
            // Mencegah browser melakukan reload halaman secara default
            e.preventDefault(); 

            // Mengambil semua elemen input di dalam form
            const inputs = formProfil.querySelectorAll('input');
            
            // Berdasarkan urutan HTML kita:
            // [0] Nama Lengkap
            // [1] ID Admin (disabled)
            // [2] Peran (disabled)
            // [3] Password Lama
            // [4] Password Baru
            // [5] Konfirmasi Password Baru
            
            const namaLengkap = inputs[0].value;
            const pwLama = inputs[3].value;
            const pwBaru = inputs[4].value;
            const pwKonfirm = inputs[5].value;

            // --- 1. LOGIKA VALIDASI KEAMANAN ---
            // Jika user mencoba mengubah password (salah satu kolom password baru diisi)
            if (pwBaru !== "" || pwKonfirm !== "") {
                if (pwLama === "") {
                    alert("⚠️ Validasi Gagal: Anda wajib memasukkan 'Password Saat Ini' untuk melakukan perubahan password.");
                    inputs[3].focus();
                    return; // Hentikan eksekusi
                }
                if (pwBaru.length < 8) {
                    alert("⚠️ Validasi Gagal: Password baru terlalu lemah. Minimal harus 8 karakter.");
                    inputs[4].focus();
                    return; 
                }
                if (pwBaru !== pwKonfirm) {
                    alert("⚠️ Validasi Gagal: Konfirmasi password tidak cocok dengan password baru.");
                    inputs[5].focus();
                    return; 
                }
            }

            // --- 2. SIMULASI LOADING & PENYIMPANAN DATA ---
            // Menyimpan elemen visual asli tombol
            const originalContent = btnSimpan.innerHTML;
            
            // Mengubah tombol menjadi state "Loading"
            btnSimpan.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Menyimpan...
            `;
            btnSimpan.disabled = true;
            btnSimpan.classList.add('opacity-70', 'cursor-not-allowed');

            // Simulasi proses pengiriman data ke server/Supabase (delay 1.5 detik)
            setTimeout(() => {
                let pesanSukses = `✅ Berhasil: Profil atas nama "${namaLengkap}" telah diperbarui.`;
                
                // Tambahkan pesan ekstra jika password ikut diubah
                if (pwBaru !== "") {
                    pesanSukses += "\nKredensial password Anda juga telah berhasil diganti.";
                }
                
                alert(pesanSukses);

                // Kembalikan tombol ke keadaan semula
                btnSimpan.innerHTML = originalContent;
                btnSimpan.disabled = false;
                btnSimpan.classList.remove('opacity-70', 'cursor-not-allowed');

                // Kosongkan kembali form password demi keamanan
                inputs[3].value = "";
                inputs[4].value = "";
                inputs[5].value = "";

            }, 1500);
        });
    }

});