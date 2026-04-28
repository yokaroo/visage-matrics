import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {

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
    // 2. NAVIGASI LINKS (Smooth Scroll)
    // =========================================================
    const navMenuContainer = document.querySelector('.hidden.lg\\:flex'); 
    const navLinks = navMenuContainer ? navMenuContainer.querySelectorAll('a[href^="#"]') : [];
    const allScrollLinks = document.querySelectorAll('a[href^="#"]');

    allScrollLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
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
        rootMargin: '-25% 0px -65% 0px',
        threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentId = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('text-sky-600', 'border-b-2', 'border-sky-500');
                    link.classList.add('text-slate-500');
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
    // 4. AUTHENTICATION, PENGUNCIAN FITUR, & EDIT PROFIL
    // =========================================================
    const btnProfile = document.getElementById('nav-profile-btn');
    const btnLogin = document.getElementById('nav-login-btn');
    const ctaAsisten = document.getElementById('cta-asisten-btn');
    const ctaSystem = document.getElementById('cta-auth-btn');
    const btnLogout = document.getElementById('btn-logout');

    let isLoggedIn = false;
    if (btnProfile) btnProfile.classList.add('hidden');
    if (btnLogin) btnLogin.classList.remove('hidden');

    // Cek Session Supabase
    const { data: { session }, error } = await supabase.auth.getSession();

    if (session && session.user) {
        isLoggedIn = true;
        if (btnProfile) btnProfile.classList.remove('hidden');
        if (btnLogin) btnLogin.classList.add('hidden');

        // Tarik Data Profil dari Supabase
        const { data: profile } = await supabase
            .from('profil_pengguna')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

        if (profile) {
            // A. Mengisi Teks Header Profil
            const elNama = document.getElementById('sidebar-nama');
            const elNim = document.getElementById('sidebar-nim');
            const elProdi = document.getElementById('sidebar-prodi');

            if (elNama) elNama.textContent = profile.nama_lengkap || "Mahasiswa";
            if (elNim) elNim.textContent = "NIM: " + (profile.nim || "-");
            if (elProdi) elProdi.textContent = profile.prodi || "Sains Data";

            // B. Mengisi Data Bawaan ke Input Form Edit
            const editEmail = document.getElementById('edit-email');
            const editNama = document.getElementById('edit-nama');
            const editNim = document.getElementById('edit-nim');
            const editProdi = document.getElementById('edit-prodi');
            const editJk = document.getElementById('edit-jk');

            if (editEmail) editEmail.value = session.user.email;
            if (editNama) editNama.value = profile.nama_lengkap || '';
            if (editNim) editNim.value = profile.nim || '';
            if (editProdi) editProdi.value = profile.prodi || 'S1 Sains Data';
            if (editJk) editJk.value = profile.jenis_kelamin || 'Laki-laki';
        }

        // C. Logika Menyimpan Perubahan Form
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const btnSave = document.getElementById('btn-save-profile');
                const profileMsg = document.getElementById('profile-msg');
                const teksAsli = btnSave.innerHTML;

                // Ubah status tombol menjadi loading
                btnSave.innerHTML = 'Menyimpan...';
                btnSave.disabled = true;
                profileMsg.classList.add('hidden');

                // Ambil nilai dari form
                const newNama = document.getElementById('edit-nama').value.trim();
                const newNim = document.getElementById('edit-nim').value.trim();
                const newProdi = document.getElementById('edit-prodi').value;
                const newJk = document.getElementById('edit-jk').value;

                try {
                    // Update ke Supabase
                    const { error: updateError } = await supabase
                        .from('profil_pengguna')
                        .update({
                            nama_lengkap: newNama,
                            nim: newNim,
                            prodi: newProdi,
                            jenis_kelamin: newJk
                        })
                        .eq('id', session.user.id);

                    if (updateError) throw updateError;

                    // Update UI Header Teks secara langsung tanpa perlu reload
                    const elNama = document.getElementById('sidebar-nama');
                    const elNim = document.getElementById('sidebar-nim');
                    const elProdi = document.getElementById('sidebar-prodi');
                    
                    if (elNama) elNama.textContent = newNama;
                    if (elNim) elNim.textContent = "NIM: " + newNim;
                    if (elProdi) elProdi.textContent = newProdi;

                    // Tampilkan notifikasi berhasil
                    profileMsg.textContent = 'Profil berhasil diperbarui!';
                    profileMsg.className = 'text-emerald-500 text-xs font-bold text-center bg-emerald-50 py-2 rounded-lg border border-emerald-100 block';
                    
                    // Hilangkan notifikasi setelah 3 detik
                    setTimeout(() => {
                        profileMsg.classList.add('hidden');
                    }, 3000);

                } catch (err) {
                    profileMsg.textContent = 'Gagal menyimpan: ' + err.message;
                    profileMsg.className = 'text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg border border-red-100 block';
                } finally {
                    btnSave.innerHTML = teksAsli;
                    btnSave.disabled = false;
                }
            });
        }
    }

    // Fungsi Penjaga Tombol
    const guardFeature = (e) => {
        if (!isLoggedIn) {
            e.preventDefault(); 
            alert("Akses Terkunci!\n\nSilakan Login atau Registrasi terlebih dahulu untuk menggunakan fitur ini. Hal ini wajib agar aktivitas riset Anda dapat dipantau oleh Admin di sistem.");
            window.location.href = '../../login.html'; 
        }
    };

    if (ctaAsisten) ctaAsisten.addEventListener('click', guardFeature);
    if (ctaSystem) ctaSystem.addEventListener('click', guardFeature);


    // =========================================================
    // 5. MANAJEMEN UI SIDEBAR & LOGOUT
    // =========================================================
    const backdrop = document.getElementById('profile-backdrop');
    const sidebar = document.getElementById('profile-sidebar');
    const btnClose = document.getElementById('close-profile-btn');

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

    // Logout Process
    if (btnLogout) {
        btnLogout.addEventListener('click', async (e) => {
            e.preventDefault();
            await supabase.auth.signOut();
            localStorage.clear();
            sessionStorage.clear();
            alert("Anda telah berhasil logout.");
            window.location.reload();
        });
    }
});