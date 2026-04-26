// File: assets/js/landing.js

document.addEventListener('DOMContentLoaded', () => {

    // =========================================================
    // 1. EFEK NAVBAR SCROLL (Warna Background)
    // =========================================================
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('shadow-lg', 'bg-white/95');
            navbar.classList.remove('bg-white/80');
        } else {
            navbar.classList.remove('shadow-lg', 'bg-white/95');
            navbar.classList.add('bg-white/80');
        }
    });

    // =========================================================
    // 2. NAVIGASI LINKS (Hanya untuk Menu Tengah)
    // =========================================================
    
    // PERBAIKAN KRUSIAL: Kita ambil link yang ada di dalam div menu saja, 
    // bukan seluruh nav. Logo tidak akan tersentuh.
    const navMenuContainer = document.querySelector('.hidden.lg\\:flex'); 
    const navLinks = navMenuContainer.querySelectorAll('a[href^="#"]');
    
    // Ambil semua link berawalan '#' untuk smooth scroll (termasuk logo & tombol panah)
    const allScrollLinks = document.querySelectorAll('a[href^="#"]');

    // Smooth Scroll Logic
    allScrollLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // =========================================================
    // 3. LOGIKA GARIS BIRU (SPY SCROLL)
    // =========================================================
    const sections = document.querySelectorAll('section[id]');
    
    const observerOptions = {
        root: null,
        rootMargin: '-25% 0px -65% 0px', // Area deteksi diperketat
        threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentId = entry.target.getAttribute('id');
                
                navLinks.forEach(link => {
                    // Hapus class aktif (Garis Biru & Warna Biru) dari SEMUA menu tengah
                    link.classList.remove('text-sky-600', 'border-b-2', 'border-sky-500');
                    link.classList.add('text-slate-500');
                    
                    // Tambahkan kembali HANYA ke menu yang sedang aktif
                    if (link.getAttribute('href') === `#${currentId}`) {
                        link.classList.remove('text-slate-500');
                        link.classList.add('text-sky-600', 'border-b-2', 'border-sky-500');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        sectionObserver.observe(section);
    });

    // =========================================================
    // 4. SIDEBAR PROFIL (Tetap Sama)
    // =========================================================
    const btnProfile = document.getElementById('nav-profile-btn');
    const btnClose = document.getElementById('close-profile-btn');
    const backdrop = document.getElementById('profile-backdrop');
    const sidebar = document.getElementById('profile-sidebar');

    const openSidebar = () => {
        backdrop.classList.remove('hidden');
        setTimeout(() => {
            backdrop.classList.remove('opacity-0');
            sidebar.classList.remove('translate-x-full');
        }, 10);
    };

    const closeSidebar = () => {
        backdrop.classList.add('opacity-0');
        sidebar.classList.add('translate-x-full');
        setTimeout(() => backdrop.classList.add('hidden'), 500);
    };

    if (btnProfile) btnProfile.addEventListener('click', openSidebar);
    if (btnClose) btnClose.addEventListener('click', closeSidebar);
    if (backdrop) backdrop.addEventListener('click', closeSidebar);
});