// assets/js/admin_dashboard.js - Otak Halaman Admin Dashboard
import { supabase } from './supabaseClient.js';

document.addEventListener("DOMContentLoaded", async function() {

    // --- 1. LOGIKA LOGOUT ADMIN ---
    const btnLogoutAdmin = document.getElementById('btn-logout-admin');
    if(btnLogoutAdmin) {
        btnLogoutAdmin.addEventListener('click', async function() {
            if(confirm("Yakin ingin keluar dari Dashboard Admin?")) {
                await supabase.auth.signOut();
                window.location.replace('../../login.html'); 
            }
        });
    }

    // --- 2. INISIALISASI CHART.JS ---
    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.color = '#94a3b8';

    const ctxComp = document.getElementById('comparisonChart');
    const ctxProdi = document.getElementById('prodiChart');
    let comparisonChartInstance = null;
    let prodiChartInstance = null;

    // --- 3. FETCH DATA DARI SUPABASE (REAL-TIME FETCH) ---
    const fetchDashboardData = async () => {
        const hariIni = new Date();
        hariIni.setHours(0, 0, 0, 0);

        // A. Ambil Data Deteksi & Ukur Latensi Sistem
        const startTime = performance.now(); // Mulai timer latensi
        const { data: deteksiData, error: errDeteksi } = await supabase
            .from('deteksi_mata')
            .select(`*, profil_pengguna (nama_lengkap, nim, prodi)`)
            .gte('created_at', hariIni.toISOString());
        
        const latencyTime = Math.round(performance.now() - startTime); // Hitung selisih waktu

        // B. Ambil 5 Log Aktivitas Terakhir
        const { data: logData, error: errLog } = await supabase
            .from('log_aktivitas')
            .select(`*, profil_pengguna (nama_lengkap, prodi)`)
            .order('created_at', { ascending: false })
            .limit(5);

        if (errDeteksi) console.error("Error Deteksi:", errDeteksi);

        return { 
            deteksi: deteksiData || [], 
            logs: logData || [],
            latency: latencyTime
        };
    };

    // --- 4. OLAH DATA DAN UPDATE UI ---
    const updateDashboardUI = async () => {
        const db = await fetchDashboardData();

        // A. Update Kartu Ringkasan Atas
        const totalDeteksi = db.deteksi.length;
        const totalSegar = db.deteksi.filter(d => d.status_mata.toLowerCase() === 'segar').length;
        const totalSayu = db.deteksi.filter(d => d.status_mata.toLowerCase() === 'lelah').length;

        document.getElementById('stat-total').innerHTML = `${totalDeteksi} <span class="text-xs font-bold text-slate-500">Gambar</span>`;
        document.getElementById('stat-segar').innerHTML = `${totalSegar} <span class="text-xs font-bold text-emerald-500">Gambar</span>`;
        document.getElementById('stat-sayu').innerHTML = `${totalSayu} <span class="text-xs font-bold text-red-500">Gambar</span>`;
        document.getElementById('stat-latensi').innerHTML = `${db.latency}<span class="text-lg">ms</span> <span class="text-xs font-bold text-emerald-500 uppercase">Real</span>`;
        
        // Hapus efek pulse loading
        ['stat-total', 'stat-segar', 'stat-sayu', 'stat-latensi'].forEach(id => {
            document.getElementById(id).classList.remove('animate-pulse');
        });

        // B. Update Grafik Perbandingan Jam
        const jamLabels = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
        const segarTren = new Array(9).fill(0);
        const lelahTren = new Array(9).fill(0);

        db.deteksi.forEach(row => {
            const jam = new Date(row.created_at).getHours();
            // Memasukkan ke array berdasarkan jam kerja 08:00 (index 0) s/d 16:00 (index 8)
            if (jam >= 8 && jam <= 16) {
                const i = jam - 8;
                row.status_mata.toLowerCase() === 'segar' ? segarTren[i]++ : lelahTren[i]++;
            }
        });

        if (ctxComp) {
            const ctx = ctxComp.getContext('2d');
            const gradGreen = ctx.createLinearGradient(0, 0, 0, 350);
            gradGreen.addColorStop(0, 'rgba(16, 185, 129, 0.4)'); gradGreen.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
            const gradRed = ctx.createLinearGradient(0, 0, 0, 350);
            gradRed.addColorStop(0, 'rgba(239, 68, 68, 0.4)'); gradRed.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

            comparisonChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: jamLabels,
                    datasets: [
                        { label: 'Mata Segar', data: segarTren, borderColor: '#10b981', backgroundColor: gradGreen, borderWidth: 3, pointBackgroundColor: '#ffffff', pointBorderColor: '#10b981', fill: true, tension: 0.4 },
                        { label: 'Mata Sayu', data: lelahTren, borderColor: '#ef4444', backgroundColor: gradRed, borderWidth: 3, pointBackgroundColor: '#ffffff', pointBorderColor: '#ef4444', fill: true, tension: 0.4 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { usePointStyle: true } } }, scales: { y: { beginAtZero: true, suggestedMax: 10 }, x: { grid: { display: false } } } }
            });
        }

        // C. Update Grafik Prodi
        const prodiStats = {};
        db.deteksi.forEach(row => {
            const prodi = row.profil_pengguna?.prodi || 'Tidak Diketahui';
            if (!prodiStats[prodi]) prodiStats[prodi] = { segar: 0, lelah: 0 };
            row.status_mata.toLowerCase() === 'segar' ? prodiStats[prodi].segar++ : prodiStats[prodi].lelah++;
        });

        const prodiLabels = Object.keys(prodiStats);
        const segarProdi = prodiLabels.map(p => prodiStats[p].segar);
        const lelahProdi = prodiLabels.map(p => prodiStats[p].lelah);

        if (ctxProdi) {
            prodiChartInstance = new Chart(ctxProdi.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: prodiLabels.length ? prodiLabels : ['Belum Ada Data'],
                    datasets: [
                        { label: 'Mata Segar', data: prodiLabels.length ? segarProdi : [0], backgroundColor: '#10b981', borderRadius: 4 },
                        { label: 'Mata Sayu', data: prodiLabels.length ? lelahProdi : [0], backgroundColor: '#ef4444', borderRadius: 4 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } }, scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true } } }
            });
        }

        // D. Update Log Aktivitas
        const logContainer = document.getElementById('log-container');
        if (logContainer) {
            logContainer.innerHTML = '';
            
            if (db.logs.length === 0) {
                logContainer.innerHTML = '<div class="text-center py-10 text-slate-400 text-sm">Belum ada aktivitas terbaru.</div>';
            }

            db.logs.forEach(log => {
                const timeStr = new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
                const nama = log.profil_pengguna?.nama_lengkap || 'System';
                
                // Styling warna dot log berdasarkan deskripsi/tipe (Fleksibel)
                let dotColor = 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]'; 
                if(log.deskripsi.toLowerCase().includes('lelah') || log.deskripsi.toLowerCase().includes('sayu')) {
                    dotColor = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]';
                } else if(log.deskripsi.toLowerCase().includes('segar') || log.deskripsi.toLowerCase().includes('optimal')) {
                    dotColor = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]';
                }

                logContainer.innerHTML += `
                    <div class="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                        <div class="w-2 h-2 mt-1.5 rounded-full ${dotColor} shrink-0"></div>
                        <div class="flex-grow">
                            <p class="text-sm font-bold text-slate-700">${log.tipe_log.replace(/_/g, ' ')}</p>
                            <p class="text-xs text-slate-500 mt-0.5"><span class="font-bold text-slate-600">${nama}:</span> ${log.deskripsi}</p>
                        </div>
                        <span class="text-[10px] font-bold text-slate-400 shrink-0">${timeStr}</span>
                    </div>
                `;
            });
        }
    };

    // Jalankan Update UI
    updateDashboardUI();
});