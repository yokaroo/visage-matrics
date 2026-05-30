// Landing page untuk user yang sudah login

import { getCurrentUserProfile } from './auth-helper.js';

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
    // 4. LOGIKA LOGIN CHECK (dari Backend Session)
    // =========================================================
    const currentUser = await getCurrentUserProfile();

    if (!currentUser) {
        alert("Sesi telah habis atau Anda belum login!");
        window.location.href = '/index.html';
        return;
    }

    const userName = currentUser.name || 'Pengguna';
    const userRole = currentUser.role || 'user';

    // Periksa role - jika admin, redirect ke admin dashboard
    if (userRole.toLowerCase() === 'admin') {
        window.location.href = '/Pages/admin/dashboard.html';
        return;
    }

    // Tampilkan nama user di UI
    const elNama = document.getElementById('sidebar-nama');
    const dashNama = document.getElementById('dash-nama');

    if (elNama) elNama.textContent = userName;
    if (dashNama) dashNama.textContent = userName;

    await loadUserDashboard();

    async function loadUserDashboard() {
        const dashboardApi = '/api/auth/user-dashboard';
        const response = await fetch(dashboardApi, { credentials: 'include' });

        if (!response.ok) {
            console.warn('Gagal memuat dashboard user:', response.statusText);
            return;
        }

        const payload = await response.json();
        if (!payload || !payload.success) {
            console.warn('Dashboard tidak tersedia:', payload);
            return;
        }

        const stats = payload.stats || {};
        const recentScans = payload.recent_scans || [];

        const dashLastSeen = document.getElementById('dash-last-seen');
        const dashStatus = document.getElementById('dash-status');
        const dashStatusCard = document.getElementById('dash-status-card');
        const dashSummary = document.getElementById('dash-summary');
        const dashCriticalEar = document.getElementById('dash-critical-ear');
        const dashAverageEar = document.getElementById('dash-average-ear');
        const dashTotalCount = document.getElementById('dash-total-count');
        const historyBody = document.getElementById('histori-table-body');

        const formatDateTime = (value) => {
            if (!value) return 'Tidak tersedia';
            const date = new Date(value);
            const today = new Date();
            const isToday = date.toDateString() === today.toDateString();
            const isYesterday = date.toDateString() === new Date(today.getTime() - 86400000).toDateString();
            const time = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            if (isToday) return `Hari ini, ${time} WIB`;
            if (isYesterday) return `Kemarin, ${time} WIB`;
            return `${date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}, ${time} WIB`;
        };

        const normalizeStatus = (text) => {
            if (!text) return 'Normal';
            const normalized = text.toLowerCase();
            if (normalized.includes('lelah') || normalized.includes('capek') || normalized.includes('fatigue')) return 'TERINDIKASI LELAH';
            if (normalized.includes('optimal') || normalized.includes('segar')) return 'OPTIMAL';
            return text.toUpperCase();
        };

        const statusLabel = normalizeStatus(stats.current_status || stats.status || 'Normal');
        const isFatigue = statusLabel.includes('LELAH');

        if (dashLastSeen) dashLastSeen.textContent = formatDateTime(stats.last_scan_at || stats.last_detected_at);
        if (dashStatus) dashStatus.textContent = statusLabel;
        if (dashStatusCard) {
            dashStatusCard.classList.toggle('bg-red-50/90', isFatigue);
            dashStatusCard.classList.toggle('border-red-200', isFatigue);
            dashStatusCard.classList.toggle('text-red-600', isFatigue);
            dashStatusCard.classList.toggle('bg-emerald-50/90', !isFatigue);
            dashStatusCard.classList.toggle('border-emerald-200', !isFatigue);
            dashStatusCard.classList.toggle('text-emerald-600', !isFatigue);
        }

        if (dashSummary) {
            dashSummary.textContent = stats.summary || (isFatigue
                ? 'Hasil deteksi terakhir menunjukkan potensi kelelahan mata. Coba istirahat sejenak.'
                : 'Kondisi mata saat ini terlihat baik. Tetap pertahankan istirahat visual yang teratur.');
        }

        if (dashCriticalEar) dashCriticalEar.textContent = stats.critical_ear?.toFixed?.(3) ?? stats.critical_ear ?? '0.00';
        if (dashAverageEar) dashAverageEar.textContent = stats.average_ear?.toFixed?.(3) ?? stats.average_ear ?? '0.00';
        if (dashTotalCount) dashTotalCount.textContent = stats.total_analisis ?? 0;

        if (historyBody) {
            if (!recentScans.length) {
                historyBody.innerHTML = `<tr class="border-b border-slate-100"><td colspan="3" class="py-8 px-4 text-center text-slate-400">Belum ada riwayat pemindaian.</td></tr>`;
            } else {
                historyBody.innerHTML = recentScans.map(scan => {
                    const status = scan.status_mata || 'Normal';
                    const isScanFatigue = status.toLowerCase().includes('lelah');
                    const statusTag = isScanFatigue ? 'Lelah' : 'Optimal';
                    const badgeBg = isScanFatigue ? 'bg-red-50' : 'bg-emerald-50';
                    const badgeBorder = isScanFatigue ? 'border-red-100' : 'border-emerald-100';
                    const badgeText = isScanFatigue ? 'text-red-600' : 'text-emerald-600';
                    const badgeDot = isScanFatigue ? 'bg-red-500' : 'bg-emerald-500';
                    return `
                        <tr class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                            <td class="py-4 px-4 font-bold text-slate-700">${formatDateTime(scan.created_at)}</td>
                            <td class="py-4 px-4 font-mono text-slate-500">${scan.eye_closure?.toFixed?.(3) ?? scan.eye_closure ?? '-'}</td>
                            <td class="py-4 px-4">
                                <span class="inline-flex items-center gap-2 px-3 py-1 ${badgeBg} ${badgeBorder} ${badgeText} text-[10px] font-black rounded-lg uppercase tracking-widest">
                                    <span class="w-1.5 h-1.5 rounded-full ${badgeDot}"></span> ${statusTag}
                                </span>
                            </td>
                        </tr>`;
                }).join('');
            }
        }
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
                const body = {
                    nama_lengkap: newNama,
                    nim: newNim,
                    prodi: newProdi,
                    jenis_kelamin: newJk
                };

                if (newPassword) {
                    if (newPassword !== confirmPassword) throw new Error("Konfirmasi sandi baru tidak cocok!");
                    if (newPassword.length < 6) throw new Error("Kata sandi baru minimal 6 karakter!");
                    body.password = newPassword;
                }

                const response = await fetch('/api/auth/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(body)
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error || 'Gagal menyimpan profil. Silakan coba lagi.');
                }

                if (newPassword) {
                    document.getElementById('edit-old-password').value = '';
                    document.getElementById('edit-new-password').value = '';
                    document.getElementById('edit-confirm-password').value = '';
                }

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
                // Panggil logout API ke backend
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            } catch (err) {
                console.error("Gagal Logout:", err);
            }
            
            // Clear local storage
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userName');
            sessionStorage.clear();
            
            // Arahkan ke halaman depan
            window.location.href = '/index.html'; 
        });
    }

});