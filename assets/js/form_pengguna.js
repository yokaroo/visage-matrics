// assets/js/form_pengguna.js

document.addEventListener("DOMContentLoaded", function() {

    // --- EFEK NAVBAR SCROLL ---
    const nav = document.querySelector('nav');
    if(nav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                nav.classList.add('bg-white/95', 'shadow-md');
                nav.classList.remove('bg-white/80');
            } else {
                nav.classList.add('bg-white/80');
                nav.classList.remove('bg-white/95', 'shadow-md');
            }
        });
    }

    // --- LOGIKA FORM SUBMIT ---
    // Diambil berdasarkan ID form di HTML (id="userDataForm")
    const userForm = document.getElementById('userDataForm');
    
    if(userForm) {
        userForm.addEventListener('submit', function(e) {
            // Mencegah browser nge-reload form
            e.preventDefault();

            // Simpan nama ke LocalStorage biar nanti bisa disapa di halaman sistem
            const inputNama = document.getElementById('inputNama');
            if(inputNama) {
                localStorage.setItem('userName', inputNama.value);
            }

            // Notifikasi berhasil di Console
            console.log("Data tervalidasi. Menginisialisasi sistem...");
            
            // ARAHKAN MAHASISWA KE RUANG KAMERA (sistem.html)
            // Pastikan file sistem.html berada dalam folder yang sama dengan form_pengguna.html
            window.location.href = "sistem.html";
        });
    } else {
         console.error("Form 'userDataForm' tidak ditemukan di HTML!");
    }

});