// File: assets/js/analitik.js
import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // --- 1. KONFIGURASI GLOBAL CHART.JS ---
    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.color = '#64748b'; // text-slate-500
    Chart.defaults.scale.grid.color = 'rgba(226, 232, 240, 0.5)'; // border-slate-200

    // Siapkan wadah (canvas) grafik
    const ctxTrend = document.getElementById('trendChart');
    const ctxProdi = document.getElementById('prodiCompareChart');
    let trendChartInstance = null;
    let prodiChartInstance = null;

    // --- 2. AMBIL DATA HARI INI DARI SUPABASE ---
    const fetchHariIni = async () => {
        // Buat rentang waktu hari ini (Jam 00:00:00)
        const hariIni = new Date();
        hariIni.setHours(0, 0, 0, 0);

        // Tarik data deteksi sekaligus join dengan tabel profil_pengguna
        const { data, error } = await supabase
            .from('deteksi_mata')
            .select(`
                *,
                profil_pengguna (nama_lengkap, nim, prodi)
            `)
            .gte('created_at', hariIni.toISOString())
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Gagal memuat data analitik:", error);
            return [];
        }
        return data || [];
    };

    // --- 3. PROSES DATA UNTUK GRAFIK ---
    const dataHariIni = await fetchHariIni();

    // A. Olah Data Tren Waktu (Dikelompokkan per jam)
    const jamLabels = [];
    const segarTren = [];
    const lelahTren = [];

    // Buat label jam dari jam 06:00 sampai 18:00
    for(let i=6; i<=18; i+=2) {
        jamLabels.push(`${i < 10 ? '0'+i : i}:00`);
        segarTren.push(0);
        lelahTren.push(0);
    }

    dataHariIni.forEach(row => {
        const jam = new Date(row.created_at).getHours();
        // Masukkan ke bin waktu terdekat (misal jam 8-9 masuk bin 08:00)
        const binIndex = jamLabels.findIndex(label => parseInt(label.split(':')[0]) === (jam % 2 !== 0 ? jam - 1 : jam));
        
        if (binIndex !== -1) {
            if (row.status_mata.toLowerCase() === 'segar') {
                segarTren[binIndex]++;
            } else {
                lelahTren[binIndex]++;
            }
        }
    });

    // B. Olah Data Distribusi Prodi
    const prodiStats = {};
    dataHariIni.forEach(row => {
        const prodi = row.profil_pengguna?.prodi || 'Tidak Diketahui';
        if (!prodiStats[prodi]) {
            prodiStats[prodi] = { segar: 0, lelah: 0 };
        }
        
        if (row.status_mata.toLowerCase() === 'segar') {
            prodiStats[prodi].segar++;
        } else {
            prodiStats[prodi].lelah++;
        }
    });

    const prodiLabels = Object.keys(prodiStats);
    const segarProdi = prodiLabels.map(p => prodiStats[p].segar);
    const lelahProdi = prodiLabels.map(p => prodiStats[p].lelah);


    // --- 4. RENDER GRAFIK DENGAN DATA ASLI ---

    // Render Line Chart
    if (ctxTrend) {
        trendChartInstance = new Chart(ctxTrend.getContext('2d'), {
            type: 'line',
            data: {
                labels: jamLabels,
                datasets: [
                    { 
                        label: 'Optimal (Mata Segar)', 
                        data: segarTren, 
                        borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 3, pointBackgroundColor: '#ffffff', pointBorderColor: '#10b981', pointBorderWidth: 2, pointRadius: 4, fill: true, tension: 0.4 
                    },
                    { 
                        label: 'Lelah (Mata Sayu)', 
                        data: lelahTren, 
                        borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 3, pointBackgroundColor: '#ffffff', pointBorderColor: '#ef4444', pointBorderWidth: 2, pointRadius: 4, fill: true, tension: 0.4 
                    }
                ]
            },
            options: { 
                responsive: true, maintainAspectRatio: false, 
                plugins: { 
                    legend: { display: true, position: 'top', labels: { boxWidth: 10, usePointStyle: true, padding: 15 } },
                    tooltip: { mode: 'index', intersect: false, backgroundColor: 'rgba(15, 23, 42, 0.9)', titleFont: { size: 13, family: 'Poppins' }, bodyFont: { size: 12, family: 'Poppins' }, padding: 12, cornerRadius: 8 }
                }, 
                interaction: { mode: 'nearest', axis: 'x', intersect: false },
                scales: { y: { beginAtZero: true, grid: { drawBorder: false } }, x: { grid: { display: false, drawBorder: false } } } 
            }
        });
    }

    // Render Bar Chart
    if (ctxProdi) {
        prodiChartInstance = new Chart(ctxProdi.getContext('2d'), {
            type: 'bar',
            data: {
                labels: prodiLabels.length > 0 ? prodiLabels : ['Belum Ada Data'],
                datasets: [
                    { 
                        label: 'Mata Segar', data: prodiLabels.length > 0 ? segarProdi : [0], 
                        backgroundColor: '#10b981', borderRadius: 6, barPercentage: 0.6, categoryPercentage: 0.8
                    },
                    { 
                        label: 'Mata Sayu', data: prodiLabels.length > 0 ? lelahProdi : [0], 
                        backgroundColor: '#ef4444', borderRadius: 6, barPercentage: 0.6, categoryPercentage: 0.8
                    }
                ]
            },
            options: { 
                responsive: true, maintainAspectRatio: false, 
                plugins: { 
                    legend: { display: true, position: 'top', labels: { boxWidth: 10, usePointStyle: true, padding: 15 } },
                    tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 12, cornerRadius: 8 }
                }, 
                scales: { y: { beginAtZero: true, stacked: false }, x: { grid: { display: false }, stacked: false } } 
            }
        });
    }

    // --- 5. RENDER TABEL RIWAYAT ---
    const tbody = document.getElementById('tabel-riwayat');
    if (tbody) {
        tbody.innerHTML = ''; // Bersihkan tulisan "Memuat..."

        if (dataHariIni.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-slate-400 font-medium">Belum ada data deteksi hari ini.</td></tr>';
            return;
        }

        dataHariIni.forEach(row => {
            const dateObj = new Date(row.created_at);
            const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
            
            const nama = row.profil_pengguna?.nama_lengkap || 'Unknown User';
            const nim = row.profil_pengguna?.nim || 'N/A';
            const prodi = row.profil_pengguna?.prodi || '-';
            const isSayu = row.status_mata.toLowerCase() === 'lelah';
            
            // EAR kita ambil dari kolom eye_closure (sesuai trik sebelumnya)
            const earScore = row.eye_closure || 0; 
            const earText = isSayu ? `<span class="text-[10px] text-red-400">(Low)</span>` : `<span class="text-[10px] text-emerald-400">(Normal)</span>`;
            const statusBadge = isSayu 
                ? `<span class="px-3 py-1 bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold rounded-md tracking-widest uppercase">Mata Sayu</span>`
                : `<span class="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold rounded-md tracking-widest uppercase">Mata Segar</span>`;

            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50 transition cursor-pointer group';
            tr.innerHTML = `
                <td class="py-4 px-4 text-slate-500 font-medium">Hari Ini<br><span class="text-[10px] font-bold text-slate-400">${timeStr}</span></td>
                <td class="py-4 px-4"><p class="font-bold text-slate-800">${nama}</p><p class="text-[10px] text-slate-500 font-mono">${nim}</p></td>
                <td class="py-4 px-4 text-slate-600 font-medium">${prodi}</td>
                <td class="py-4 px-4 text-slate-600 font-medium font-mono text-xs">${earScore} ${earText}</td>
                <td class="py-4 px-4">${statusBadge}</td>
            `;
            tbody.appendChild(tr);
        });
    }
});