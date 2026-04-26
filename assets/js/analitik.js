// File: assets/js/analitik.js

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. KONFIGURASI GLOBAL CHART.JS ---
    // Menyesuaikan font dan warna dasar agar senada dengan UI Tailwind
    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.color = '#64748b'; // text-slate-500
    Chart.defaults.scale.grid.color = 'rgba(226, 232, 240, 0.5)'; // border-slate-200

    // --- 2. RENDER GRAFIK TREN (LINE CHART) ---
    // Grafik ini menunjukkan waktu kapan mahasiswa paling banyak terdeteksi lelah hari ini.
    const ctxTrend = document.getElementById('trendChart');
    if (ctxTrend) {
        new Chart(ctxTrend.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['08:00', '10:00', '12:00', '14:00', '16:00'],
                datasets: [
                    { 
                        label: 'Optimal (Mata Segar)', 
                        // TODO: Ganti array ini dengan data dari Supabase
                        data: [15, 28, 20, 35, 25], 
                        borderColor: '#10b981', // Emerald 500
                        backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                        borderWidth: 3, 
                        pointBackgroundColor: '#ffffff', 
                        pointBorderColor: '#10b981', 
                        pointBorderWidth: 2, 
                        pointRadius: 4, 
                        fill: true, 
                        tension: 0.4 // Membuat garis melengkung halus
                    },
                    { 
                        label: 'Lelah (Mata Sayu)', 
                        // TODO: Ganti array ini dengan data dari Supabase
                        data: [2, 5, 12, 18, 8], 
                        borderColor: '#ef4444', // Red 500
                        backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                        borderWidth: 3, 
                        pointBackgroundColor: '#ffffff', 
                        pointBorderColor: '#ef4444', 
                        pointBorderWidth: 2, 
                        pointRadius: 4, 
                        fill: true, 
                        tension: 0.4 
                    }
                ]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { 
                        display: true, 
                        position: 'top', 
                        labels: { boxWidth: 10, usePointStyle: true, padding: 15 } 
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(15, 23, 42, 0.9)', // Tooltip gelap estetik
                        titleFont: { size: 13, family: 'Poppins' },
                        bodyFont: { size: 12, family: 'Poppins' },
                        padding: 12,
                        cornerRadius: 8
                    }
                }, 
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                scales: { 
                    y: { 
                        beginAtZero: true, 
                        grid: { drawBorder: false } 
                    }, 
                    x: { 
                        grid: { display: false, drawBorder: false } 
                    } 
                } 
            }
        });
    }

    // --- 3. RENDER GRAFIK PER PRODI (BAR CHART) ---
    // Grafik ini membandingkan metrik kelelahan antar Program Studi
    const ctxProdi = document.getElementById('prodiCompareChart');
    if (ctxProdi) {
        new Chart(ctxProdi.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Sains Data', 'T. Informatika', 'Sistem Informasi', 'RPL', 'T. Telekomunikasi'],
                datasets: [
                    { 
                        label: 'Mata Segar', 
                        // TODO: Ganti dengan count() dari Supabase berdasarkan prodi
                        data: [25, 18, 15, 12, 10], 
                        backgroundColor: '#10b981', // Emerald
                        borderRadius: 6, // Ujung bar melengkung
                        barPercentage: 0.6,
                        categoryPercentage: 0.8
                    },
                    { 
                        label: 'Mata Sayu', 
                        // TODO: Ganti dengan count() dari Supabase berdasarkan prodi
                        data: [4, 8, 3, 5, 2], 
                        backgroundColor: '#ef4444', // Red
                        borderRadius: 6,
                        barPercentage: 0.6,
                        categoryPercentage: 0.8
                    }
                ]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { 
                        display: true, 
                        position: 'top', 
                        labels: { boxWidth: 10, usePointStyle: true, padding: 15 } 
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        padding: 12,
                        cornerRadius: 8
                    }
                }, 
                scales: { 
                    y: { 
                        beginAtZero: true,
                        stacked: false // Ubah ke true jika ingin bar ditumpuk ke atas
                    }, 
                    x: { 
                        grid: { display: false },
                        stacked: false // Ubah ke true jika y stacked diubah
                    } 
                } 
            }
        });
    }
    
    // --- 4. (OPSIONAL NANTI) FUNGSI FETCH DATA TABEL ---
    // Saat kamu sudah siap konek ke Supabase, logika pemanggilan data ditaruh di sini
    /*
    async function fetchKlasifikasiHariIni() {
        // Logika panggil API Supabase
        // Update DOM Tabel
    }
    fetchKlasifikasiHariIni();
    */
});