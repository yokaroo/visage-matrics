// assets/js/about.js - Otak Halaman Tim Pengembang

document.addEventListener("DOMContentLoaded", function() {

    // --- 1. EFEK NAVBAR SCROLL ---
    // Membuat navbar berubah sedikit transparan/bayangan saat di-scroll
    const nav = document.querySelector('nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            nav.classList.add('bg-white/95', 'shadow-md');
            nav.classList.remove('bg-white/80');
        } else {
            nav.classList.add('bg-white/80');
            nav.classList.remove('bg-white/95', 'shadow-md');
        }
    });

    // --- 2. LOGIKA TOMBOL KEMBALI ---
    // Memberikan efek feedback saat tombol kembali diklik
    const backBtn = document.querySelector('a[href="landing.html"]');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            console.log("Navigasi kembali ke Beranda...");
        });
    }

    // --- 3. INTERAKSI KARTU TIM (OPSIONAL) ---
    // Bisa ditambahin efek log atau suara kecil kalau mau Wir
    const cards = document.querySelectorAll('.glass-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            const name = card.querySelector('h3').innerText;
            console.log("Viewing profile: " + name);
        });
    });

    console.log("Visage Metrics: About Page Loaded Successfully.");
});