// Register Page - Using Backend API
document.addEventListener("DOMContentLoaded", function() {
    const formRegister = document.getElementById('registerForm');
    const inputPassword = document.getElementById('inputPasswordReg');
    const inputRepassword = document.getElementById('inputRepassword');
    const errorMsg = document.getElementById('errorMsg');
    const btnSubmit = document.getElementById('btnSubmit');
    
    // Track registration attempts
    let registrationInProgress = false;

    if (formRegister) {
        formRegister.addEventListener('submit', async function(event) {
            event.preventDefault();

            // Prevent double submission
            if (registrationInProgress) {
                showError('Proses registrasi sedang berlangsung. Harap tunggu...');
                return;
            }

            errorMsg.classList.add('hidden');

            const namaLengkap = document.getElementById('inputNama').value.trim();
            const nim = document.getElementById('inputNim').value.trim();
            const email = document.getElementById('inputEmail').value.trim();
            const passValue = inputPassword.value;
            const repassValue = inputRepassword.value;

            // Validasi
            if (!namaLengkap || !nim || !email || !passValue || !repassValue) {
                showError('Semua field harus diisi!');
                return;
            }

            if (passValue !== repassValue) {
                showError('Password tidak cocok! Harap cek kembali.');
                inputRepassword.classList.add('border-red-500');
                setTimeout(() => inputRepassword.classList.remove('border-red-500'), 3000);
                return;
            }

            if (passValue.length < 6) {
                showError('Password minimal harus 6 karakter!');
                return;
            }

            if (!email.includes('@')) {
                showError('Email tidak valid!');
                return;
            }

            const teksAsli = btnSubmit.innerHTML;
            btnSubmit.innerHTML = 'Memproses...';
            btnSubmit.disabled = true;
            registrationInProgress = true;

            try {
                // Kirim register request ke backend
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        password: passValue,
                        name: namaLengkap,
                        nim: nim
                    })
                });

                const payload = await response.json();
                console.log('Register response:', response.status, payload);

                if (!response.ok) {
                    // Handle specific error messages
                    let errorMessage = payload.error || 'Registrasi gagal. Silakan coba lagi.';
                    
                    if (response.status === 409) {
                        errorMessage = 'Email ini sudah terdaftar. Gunakan email lain atau gunakan fitur Login.';
                    } else if (response.status === 500) {
                        errorMessage = 'Terjadi kesalahan server. Silakan hubungi administrator atau coba lagi nanti.';
                    }
                    
                    throw new Error(errorMessage);
                }

                // Sukses - Show success message and redirect
                alert(`Registrasi Berhasil!\n\nEmail: ${email}\nAkun Anda telah terdaftar.\n\nSilakan Login menggunakan akun ini.`);
                
                // Save user name to localStorage for later use if profile database insert failed
                localStorage.setItem(`user_name_${email.toLowerCase()}`, namaLengkap);
                
                // Clear form
                formRegister.reset();
                
                // Redirect to login after a short delay
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 500);

            } catch (err) {
                showError(err.message || 'Terjadi kesalahan saat registrasi.');
                console.error('[REGISTER ERROR]', err.message);
            } finally {
                btnSubmit.innerHTML = teksAsli;
                btnSubmit.disabled = false;
                registrationInProgress = false;
            }

            function showError(msg) {
                errorMsg.innerText = msg;
                errorMsg.classList.remove('hidden');
                // Auto-scroll to error message
                errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    }

    // Validasi password real-time
    if (inputPassword) {
        inputPassword.addEventListener('input', function() {
            if (this.value.length > 0 && inputRepassword.value.length > 0) {
                if (this.value === inputRepassword.value) {
                    this.classList.remove('border-red-300');
                    inputRepassword.classList.remove('border-red-300');
                } else {
                    this.classList.add('border-red-300');
                    inputRepassword.classList.add('border-red-300');
                }
            }
        });
    }

    if (inputRepassword) {
        inputRepassword.addEventListener('input', function() {
            if (this.value.length > 0 && inputPassword.value.length > 0) {
                if (this.value === inputPassword.value) {
                    this.classList.remove('border-red-300');
                    inputPassword.classList.remove('border-red-300');
                } else {
                    this.classList.add('border-red-300');
                    inputPassword.classList.add('border-red-300');
                }
            }
        });
    }

    // Sembunyikan error otomatis saat user mulai memperbaiki input
    if (formRegister) {
        const allInputs = formRegister.querySelectorAll('input, select');
        allInputs.forEach(input => {
            input.addEventListener('focus', () => {
                errorMsg.classList.add('hidden');
            });
        });
    }
});