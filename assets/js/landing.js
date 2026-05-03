import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {

    // =========================================================
    // 1. EFEK NAVBAR SCROLL
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
    // 3. LOGIKA GARIS BIRU (SPY SCROLL)
    // =========================================================
    const navMenuContainer = document.querySelector('.hidden.md\\:flex') || document.querySelector('.hidden.lg\\:flex'); 
    const navLinks = navMenuContainer ? navMenuContainer.querySelectorAll('a[href^="#"]') : [];
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

    sections.forEach(section => sectionObserver.observe(section));

    // =========================================================
    // 4. LOGIKA SUPABASE (AUTH & PROFIL)
    // =========================================================
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        // JIKA TIDAK ADA SESI -> TENDANG KE INDEX.HTML
        if (!session || !session.user) {
            alert("Sesi telah habis atau Anda belum login!");
            window.location.href = '../../index.html'; // Pindah ke index.html di root
            return;
        }

        // Tarik Data Profil
        const { data: profile } = await supabase
            .from('profil_pengguna')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

        if (profile) {
            // Isi UI Teks
            const elNama = document.getElementById('sidebar-nama');
            const elNim = document.getElementById('sidebar-nim');
            const elProdi = document.getElementById('sidebar-prodi');
            const dashNama = document.getElementById('dash-nama');

            if (elNama) elNama.textContent = profile.nama_lengkap || "Mahasiswa";
            if (elNim) elNim.textContent = "NIM: " + (profile.nim || "-");
            if (elProdi) elProdi.textContent = profile.prodi || "Sains Data";
            if (dashNama) dashNama.textContent = profile.nama_lengkap || "Mahasiswa";

            // Isi Input Form Edit
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
        } else {
            const editEmail = document.getElementById('edit-email');
            if (editEmail) editEmail.value = session.user.email;
        }
    } catch (err) {
        console.warn("Error saat load session Supabase:", err);
    }

    // =========================================================
    // 5. SIMPAN DATA PROFIL & GANTI SANDI
    // =========================================================
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btnSave = document.getElementById('btn-save-profile');
            const profileMsg = document.getElementById('profile-msg');
            const teksAsli = btnSave.innerHTML;

            btnSave.innerHTML = 'Menyimpan...';
            btnSave.disabled = true;
            profileMsg.classList.add('hidden');

            const newNama = document.getElementById('edit-nama').value.trim();
            const newNim = document.getElementById('edit-nim').value.trim();
            const newProdi = document.getElementById('edit-prodi').value;
            const newJk = document.getElementById('edit-jk').value;
            
            const newPassword = document.getElementById('edit-new-password')?.value;
            const confirmPassword = document.getElementById('edit-confirm-password')?.value;

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error("Sesi tidak valid, silakan login ulang.");
                
                // 1. Ganti Kata Sandi (Jika diisi)
                if (newPassword) {
                    if (newPassword !== confirmPassword) throw new Error("Konfirmasi sandi baru tidak cocok!");
                    if (newPassword.length < 6) throw new Error("Kata sandi baru minimal 6 karakter!");
                    
                    const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
                    if (authError) throw authError;

                    document.getElementById('edit-old-password').value = '';
                    document.getElementById('edit-new-password').value = '';
                    document.getElementById('edit-confirm-password').value = '';
                }

                // 2. Simpan Data Profil
                const { error: updateError } = await supabase
                    .from('profil_pengguna')
                    .upsert({
                        id: session.user.id,
                        nama_lengkap: newNama,
                        nim: newNim,
                        prodi: newProdi,
                        jenis_kelamin: newJk
                    }, { onConflict: 'id' });

                if (updateError) throw updateError;

                // Update UI Langsung
                const elNama = document.getElementById('sidebar-nama');
                const elNim = document.getElementById('sidebar-nim');
                const elProdi = document.getElementById('sidebar-prodi');
                const dashNama = document.getElementById('dash-nama');
                
                if (elNama) elNama.textContent = newNama;
                if (elNim) elNim.textContent = "NIM: " + newNim;
                if (elProdi) elProdi.textContent = newProdi;
                if (dashNama) dashNama.textContent = newNama;

                profileMsg.textContent = 'Profil & Keamanan berhasil diperbarui!';
                profileMsg.className = 'text-emerald-500 text-xs font-bold text-center bg-emerald-50 py-2 rounded-lg border border-emerald-100 block mt-4';
                
                setTimeout(() => profileMsg.classList.add('hidden'), 4000);

            } catch (err) {
                profileMsg.textContent = 'Gagal menyimpan: ' + err.message;
                profileMsg.className = 'text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg border border-red-100 block mt-4';
                profileMsg.classList.remove('hidden');
            } finally {
                btnSave.innerHTML = teksAsli;
                btnSave.disabled = false;
            }
        });
    }

    // =========================================================
    // 6. LOGOUT (TENDANG KE INDEX.HTML)
    // =========================================================
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async (e) => {
            e.preventDefault(); 
            btnLogout.innerHTML = 'Keluar...';
            
            try {
                await supabase.auth.signOut();
            } catch (err) {
                console.error("Gagal Logout:", err);
            }
            
            localStorage.clear();
            sessionStorage.clear();
            
            // Arahkan ke halaman depan
            window.location.href = '../../index.html'; 
        });
    }

});