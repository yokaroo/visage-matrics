import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.color = '#64748b';
    Chart.defaults.scale.grid.color = 'rgba(226, 232, 240, 0.5)';

    const ctxTrend = document.getElementById('trendChart');
    const ctxProdi = document.getElementById('prodiCompareChart');

    // --- 1. AMBIL DATA 30 HARI TERAKHIR ---
    const fetch30Hari = async () => {
        const tigaPuluhHariLalu = new Date();
        tigaPuluhHariLalu.setDate(tigaPuluhHariLalu.getDate() - 29); 
        tigaPuluhHariLalu.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('deteksi_mata')
            .select(`*, profil_pengguna (nama_lengkap, nim, prodi)`)
            .gte('created_at', tigaPuluhHariLalu.toISOString())
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Gagal memuat data analitik:", error);
            return [];
        }
        return data || [];
    };

    const data30Hari = await fetch30Hari();

    // --- 2. OLAH DATA TREN BULANAN (PER MINGGU) ---
    const mingguLabels = ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4', 'Minggu Ini'];
    const segarTren = [0, 0, 0, 0, 0];
    const lelahTren = [0, 0, 0, 0, 0];

    const hariIni = new Date();
    data30Hari.forEach(row => {
        const rowDate = new Date(row.created_at);
        const diffTime = Math.abs(hariIni - rowDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        let mingguIndeks = 4; // Default: Minggu Ini (0-6 hari lalu)
        if (diffDays > 28) mingguIndeks = 0;
        else if (diffDays > 21) mingguIndeks = 1;
        else if (diffDays > 14) mingguIndeks = 2;
        else if (diffDays > 7) mingguIndeks = 3;

        row.status_mata.toLowerCase() === 'segar' ? segarTren[mingguIndeks]++ : lelahTren[mingguIndeks]++;
    });

    // --- 3. OLAH DATA DISTRIBUSI PRODI ---
    const prodiStats = {};
    data30Hari.forEach(row => {
        const prodi = row.profil_pengguna?.prodi || 'Tidak Diketahui';
        if (!prodiStats[prodi]) prodiStats[prodi] = { segar: 0, lelah: 0 };
        row.status_mata.toLowerCase() === 'segar' ? prodiStats[prodi].segar++ : prodiStats[prodi].lelah++;
    });

    const prodiLabels = Object.keys(prodiStats);
    const segarProdi = prodiLabels.map(p => prodiStats[p].segar);
    const lelahProdi = prodiLabels.map(p => prodiStats[p].lelah);

    // --- 4. RENDER GRAFIK ---
    if (ctxTrend) {
        new Chart(ctxTrend.getContext('2d'), {
            type: 'line',
            data: {
                labels: mingguLabels,
                datasets: [
                    { label: 'Optimal (Mata Segar)', data: segarTren, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 3, pointBackgroundColor: '#ffffff', pointBorderColor: '#10b981', fill: true, tension: 0.4 },
                    { label: 'Lelah (Mata Sayu)', data: lelahTren, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 3, pointBackgroundColor: '#ffffff', pointBorderColor: '#ef4444', fill: true, tension: 0.4 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 15 } } }, scales: { y: { beginAtZero: true, grid: { drawBorder: false } }, x: { grid: { display: false } } } }
        });
    }

    if (ctxProdi) {
        new Chart(ctxProdi.getContext('2d'), {
            type: 'bar',
            data: {
                labels: prodiLabels.length ? prodiLabels : ['Belum Ada Data'],
                datasets: [
                    { label: 'Mata Segar', data: prodiLabels.length ? segarProdi : [0], backgroundColor: '#10b981', borderRadius: 6, barPercentage: 0.6, categoryPercentage: 0.8 },
                    { label: 'Mata Sayu', data: prodiLabels.length ? lelahProdi : [0], backgroundColor: '#ef4444', borderRadius: 6, barPercentage: 0.6, categoryPercentage: 0.8 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 15 } } }, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } } }
        });
    }

    // --- 5. RENDER TABEL RIWAYAT ---
    const tbody = document.getElementById('tabel-riwayat');
    if (tbody) {
        tbody.innerHTML = '';
        if (data30Hari.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-slate-400 font-medium">Belum ada data deteksi dalam 30 hari terakhir.</td></tr>';
            return;
        }

        data30Hari.reverse().forEach(row => {
            const dateObj = new Date(row.created_at);
            const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            
            const isSayu = row.status_mata.toLowerCase() === 'lelah';
            const statusBadge = isSayu 
                ? `<span class="px-3 py-1 bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold rounded-md tracking-widest uppercase">Mata Sayu</span>`
                : `<span class="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold rounded-md tracking-widest uppercase">Mata Segar</span>`;

            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50 transition cursor-pointer group';
            tr.innerHTML = `
                <td class="py-4 px-4 text-slate-500 font-medium">${dateStr}</td>
                <td class="py-4 px-4"><p class="font-bold text-slate-800">${row.profil_pengguna?.nama_lengkap || 'Unknown'}</p><p class="text-[10px] text-slate-500 font-mono">${row.profil_pengguna?.nim || '-'}</p></td>
                <td class="py-4 px-4 text-slate-600 font-medium">${row.profil_pengguna?.prodi || '-'}</td>
                <td class="py-4 px-4 text-slate-600 font-medium font-mono text-xs">${row.eye_closure || 0}</td>
                <td class="py-4 px-4">${statusBadge}</td>
            `;
            tbody.appendChild(tr);
        });
    }
});