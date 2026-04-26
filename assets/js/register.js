document.addEventListener("DOMContentLoaded", function() {
    
    const formRegister = document.getElementById('registerForm');
    const inputPassword = document.getElementById('inputPasswordReg');
    const inputRepassword = document.getElementById('inputRepassword');
    const errorMsg = document.getElementById('errorMsg');

    if (formRegister) {
        formRegister.addEventListener('submit', function(event) {
            event.preventDefault();

            // Ambil nilai password
            const passValue = inputPassword.value;
            const repassValue = inputRepassword.value;

            // Validasi Password Cocok
            if (passValue !== repassValue) {
                errorMsg.innerText = "Password tidak cocok! Harap cek kembali.";
                errorMsg.classList.remove('hidden');
                inputRepassword.classList.add('border-red-500');
                
                // Hilangkan border merah setelah 3 detik
                setTimeout(() => inputRepassword.classList.remove('border-red-500'), 3000);
                return;
            }

            // Jika Berhasil
            errorMsg.classList.add('hidden');
            alert("Registrasi Berhasil! Silakan masuk menggunakan akun baru Anda.");
            
            // Pindah ke Login (Root ke Root)
            window.location.href = "login.html";
        });
    }

    // Sembunyikan error saat user mulai mengetik ulang
    inputRepassword.addEventListener('input', () => {
        errorMsg.classList.add('hidden');
    });
});