document.addEventListener("DOMContentLoaded", function() {
    
    const formLogin = document.getElementById('loginForm');

    if (formLogin) {
        formLogin.addEventListener('submit', function(event) {
            // Mencegah reload halaman
            event.preventDefault();

            // Simulasi proses login
            const checkRemember = document.getElementById('checkRemember');
            if (checkRemember && checkRemember.checked) {
                localStorage.setItem('isLoggedIn', 'true');
            } else {
                sessionStorage.setItem('isLoggedIn', 'true');
            }

            // Pindah ke Landing Page di dalam folder pages/user
            window.location.href = "pages/user/landing.html";
        });
    }

});