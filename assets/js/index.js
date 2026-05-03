import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {

    // =========================================================
    // 1. EFEK NAVBAR SCROLL (Warna Background)
    // =========================================================
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('shadow-lg', 'bg-white/95');
                navbar.classList.remove('bg-white/80');
            } else {
                navbar.classList.remove('shadow-lg', 'bg-white/95');
                navbar.classList.add('bg-white/80');
            }
        });
    }

    // =========================================================
    // 2. NAVIGASI LINKS (Smooth Scroll Anti-Macet)
    // =========================================================
    const allScrollLinks = document.querySelectorAll('a[href^="#"]');
    allScrollLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                e.preventDefault(); 
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // =========================================================
    // 3. LOGIKA GARIS BIRU (SPY SCROLL) - FIX ANTI KENA LOGO!
    // =========================================================
    const navbarElement = document.getElementById('navbar');
    
    // KUNCI PERBAIKAN: Kita FILTER! 
    // Cuma ambil link berawalan '#' yang punya class 'pb-1' (Menu Navigasi).
    // Logo 'Visage Metrics' nggak punya class 'pb-1', jadi nggak bakal ikut digaris-biruin!
    const navLinks = navbarElement ? Array.from(navbarElement.querySelectorAll('a[href^="#"]')).filter(link => link.classList.contains('pb-1')) : [];
    
    const sections = document.querySelectorAll('section[id]');
    
    const observerOptions = {
        root: null,
        rootMargin: '-25% 0px -65% 0px',
        threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentId = entry.target.getAttribute('id');
                
                navLinks.forEach(link => {
                    // Reset semua gaya link menu jadi abu-abu
                    link.classList.remove('text-sky-600', 'border-b-2', 'border-sky-500');
                    link.classList.add('text-slate-500');
                    
                    // Kalau id section sama dengan href link menu, kasih garis biru
                    if (link.getAttribute('href') === `#${currentId}`) {
                        link.classList.remove('text-slate-500');
                        link.classList.add('text-sky-600', 'border-b-2', 'border-sky-500');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => sectionObserver.observe(section));


    // =========================================================
    // 4. LOGIKA CEK LOGIN (Untuk Ubah Tombol Saja)
    // =========================================================
    let isLoggedIn = false;
    const loginBtn = document.getElementById('nav-login-btn');
    
    // Cari tombol "Mulai Konsultasi Gratis" di Asisten AI
    const ctaAsistenBtns = document.querySelectorAll('a[href*="asisten_visage.html"]');

    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (session && session.user) {
            isLoggedIn = true;
            
            // Kalau udah login, tombol di navbar ganti jadi WORKSPACE
            if (loginBtn) {
                loginBtn.textContent = 'WORKSPACE';
                // Arahkan ke file landing.html yang ada di dalam folder Pages/user
                loginBtn.href = 'Pages/user/landing.html'; 
            }
        }
    } catch (err) {
        console.warn("Cek sesi Supabase error:", err);
    }

    // =========================================================
    // 5. PENJAGA FITUR (CTA ASISTEN AI)
    // =========================================================
    ctaAsistenBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!isLoggedIn) {
                e.preventDefault(); 
                alert("Akses Terkunci!\n\nSilakan Login atau Registrasi terlebih dahulu untuk menggunakan fitur ini.");
                window.location.href = 'Pages/user/login.html'; // Usir ke halaman login
            } else {
                e.preventDefault();
                window.location.href = 'Pages/user/asisten_visage.html'; // Izinkan masuk
            }
        });
    });

});