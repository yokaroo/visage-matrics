// File: assets/js/manajemen_user.js
import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // --- ELEMEN UI ---
    const tbody = document.getElementById('tabel-user');
    const elTotalMhs = document.getElementById('total-mahasiswa');
    const elTotalAdmin = document.getElementById('total-admin');
    const elTotalAktif = document.getElementById('total-aktif');
    const searchInput = document.getElementById('search-user');
    const filterRole = document.getElementById('filter-role');
    const infoPagination = document.getElementById('info-pagination');
    
    let allUsers = []; // Menyimpan semua data agar fitur search cepat (client-side)

    // --- 1. FUNGSI MENARIK DATA & STATISTIK ---
    const fetchUsersData = async () => {
        // Ambil Profil
        const { data: users, error } = await supabase
            .from('profil_pengguna')
            .select('*')
            .order('role', { ascending: false }); // Admin tampil duluan biasanya

        if (error) {
            console.error("Gagal memuat pengguna:", error);
            alert("Gagal terhubung ke database.");
            return;
        }

        allUsers = users || [];

        // Hitung Statistik
        const totalMhs = allUsers.filter(u => u.role === 'mahasiswa').length;
        const totalAdmin = allUsers.filter(u => u.role === 'admin').length;

        // Ambil log aktivitas unik hari ini untuk "Sesi Aktif"
        const hariIni = new Date();
        hariIni.setHours(0,0,0,0);
        const { data: logs } = await supabase
            .from('log_aktivitas')
            .select('user_id')
            .gte('created_at', hariIni.toISOString());
            
        // Hitung ID unik yang login/aktif hari ini
        const uniqueActiveUsers = new Set((logs || []).map(l => l.user_id)).size;

        // Update UI Statistik
        if(elTotalMhs) { elTotalMhs.textContent = totalMhs; elTotalMhs.classList.remove('animate-pulse'); }
        if(elTotalAdmin) { elTotalAdmin.textContent = totalAdmin; elTotalAdmin.classList.remove('animate-pulse'); }
        if(elTotalAktif) { elTotalAktif.textContent = uniqueActiveUsers; elTotalAktif.classList.remove('animate-pulse'); }

        // Tampilkan ke tabel
        renderTable(allUsers);
    };

    // --- 2. FUNGSI RENDER TABEL ---
    const renderTable = (dataToRender) => {
        if (!tbody) return;
        tbody.innerHTML = '';

        if (dataToRender.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-slate-400 font-medium">Tidak ada data pengguna yang ditemukan.</td></tr>';
            if(infoPagination) infoPagination.textContent = "Menampilkan 0 pengguna";
            return;
        }

        dataToRender.forEach(user => {
            const isAktif = user.status_akun.toLowerCase() === 'aktif';
            const isAdmin = user.role.toLowerCase() === 'admin';
            
            // Badge Styling
            const roleBadge = isAdmin 
                ? `<span class="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-200 text-[10px] font-bold rounded-md tracking-widest uppercase">Admin</span>`
                : `<span class="px-3 py-1 bg-sky-50 text-sky-600 border border-sky-200 text-[10px] font-bold rounded-md tracking-widest uppercase">Mahasiswa</span>`;
                
            const statusBadge = isAktif
                ? `<div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-emerald-500"></span><span class="text-xs font-bold text-slate-600">Aktif</span></div>`
                : `<div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-slate-300"></span><span class="text-xs font-bold text-slate-400">Nonaktif</span></div>`;

            // Membuat baris
            const tr = document.createElement('tr');
            tr.className = `hover:bg-slate-50 transition group border-b border-slate-100 ${!isAktif ? 'bg-slate-50/50' : ''}`;
            
            tr.innerHTML = `
                <td class="py-4 px-4 font-mono text-slate-500 font-bold">${user.nim || '-'}</td>
                <td class="py-4 px-4">
                    <p class="font-bold text-slate-800">${user.nama_lengkap}</p>
                    <p class="text-[10px] text-slate-500 uppercase tracking-wider font-bold">${user.prodi || 'Sistem Administrator'}</p>
                </td>
                <td class="py-4 px-4">${roleBadge}</td>
                <td class="py-4 px-4">${statusBadge}</td>
                <td class="py-4 px-4 text-center">
                    <div class="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button data-id="${user.id}" data-status="${user.status_akun}" class="btn-edit p-2 bg-white border border-slate-200 hover:border-sky-300 hover:text-sky-500 text-slate-400 rounded-lg transition" title="Ubah Status (Aktif/Nonaktif)">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button data-id="${user.id}" data-nama="${user.nama_lengkap}" class="btn-hapus p-2 bg-white border border-slate-200 hover:border-red-300 hover:text-red-500 text-slate-400 rounded-lg transition" title="Hapus Permanen">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        if(infoPagination) infoPagination.textContent = `Menampilkan total ${dataToRender.length} pengguna`;
        attachActionListeners();
    };

    // --- 3. FILTER DAN SEARCH ---
    const applyFilters = () => {
        const keyword = searchInput ? searchInput.value.toLowerCase() : '';
        const role = filterRole ? filterRole.value : 'semua';

        const filteredData = allUsers.filter(user => {
            const matchKeyword = user.nama_lengkap.toLowerCase().includes(keyword) || (user.nim && user.nim.toLowerCase().includes(keyword));
            const matchRole = role === 'semua' || user.role.toLowerCase() === role;
            return matchKeyword && matchRole;
        });

        renderTable(filteredData);
    };

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (filterRole) filterRole.addEventListener('change', applyFilters);

    // --- 4. AKSI EDIT & HAPUS ---
    const attachActionListeners = () => {
        // Aksi Edit (Ubah Status Aktif/Nonaktif)
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', async function(e) {
                e.preventDefault();
                const userId = this.getAttribute('data-id');
                const currentStatus = this.getAttribute('data-status').toLowerCase();
                const newStatus = currentStatus === 'aktif' ? 'nonaktif' : 'aktif';

                const konfirmasi = confirm(`Ubah status akun ini menjadi ${newStatus.toUpperCase()}?`);
                if(konfirmasi) {
                    const { error } = await supabase
                        .from('profil_pengguna')
                        .update({ status_akun: newStatus })
                        .eq('id', userId);

                    if(error) {
                        alert("Gagal merubah status: " + error.message);
                    } else {
                        fetchUsersData(); // Refresh tabel
                    }
                }
            });
        });

        // Aksi Hapus
        document.querySelectorAll('.btn-hapus').forEach(btn => {
            btn.addEventListener('click', async function(e) {
                e.preventDefault();
                const userId = this.getAttribute('data-id');
                const namaUser = this.getAttribute('data-nama');

                const konfirmasi = confirm(`TINDAKAN KRITIS!\nApakah Anda yakin ingin menghapus profil "${namaUser}"?\n\nPerhatian: Menghapus profil ini akan otomatis menghapus seluruh riwayat deteksi mata milik pengguna ini juga (Cascade Delete).`);
                
                if(konfirmasi) {
                    // Karena RLS, pastikan Admin punya hak menghapus di Supabase Policy Anda.
                    const { error } = await supabase
                        .from('profil_pengguna')
                        .delete()
                        .eq('id', userId);

                    if(error) {
                        alert("Gagal menghapus data. Pastikan RLS Policy Supabase Anda mengizinkan Admin melakukan Delete.\nError: " + error.message);
                    } else {
                        alert(`Data ${namaUser} berhasil dihapus.`);
                        fetchUsersData(); // Refresh tabel
                    }
                }
            });
        });
    };

    // Tombol Tambah User Placeholder
    const btnTambah = document.getElementById('btn-tambah-user');
    if (btnTambah) {
        btnTambah.addEventListener('click', () => {
            alert("Fitur ini biasanya dihubungkan dengan Admin API Supabase (auth.admin.createUser) yang harus dijalankan di sisi Server/Backend demi keamanan, atau arahkan Admin untuk menggunakan halaman Register.");
        });
    }

    // Jalankan pertama kali
    fetchUsersData();
});