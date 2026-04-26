// File: assets/js/analitik_7_hari.js

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. KONFIGURASI GLOBAL CHART.JS ---
    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.color = '#64748b'; // text-slate-500
    Chart.defaults.scale.grid.color = 'rgba(226, 232, 240, 0.5)'; // border-slate-200

    // --- 2. RENDER GRAFIK TREN MINGGUAN (LINE CHART) ---
    const ctxWeeklyElement = document.getElementById('weeklyTrendChart');
    if (ctxWeeklyElement) {
        const ctxWeekly = ctxWeeklyElement.getContext('2d');
        
        // Gradient Hijau (Segar)
        const gradientGreen = ctxWeekly.createLinearGradient(0, 0, 0, 300);
        gradientGreen.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
        gradientGreen.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

        // Gradient Merah (Sayu)
        const gradientRed = ctxWeekly.createLinearGradient(0, 0, 0, 300);
        gradientRed.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
        gradientRed.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

        new Chart(ctxWeekly, {
            type: 'line',
            data: {
                labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
                datasets: [
                    {
                        label: 'Optimal (Mata Segar)',
                        // TODO: Ganti array ini dengan query Supabase (Total Segar per hari selama 7 hari)
                        data: [120, 150, 140, 180, 130, 90, 110], 
                        borderColor: '#10b981', // Emerald 500
                        backgroundColor: gradientGreen, 
                        borderWidth: 3, 
                        pointBackgroundColor: '#ffffff', 
                        pointBorderColor: '#10b981', 
                        pointBorderWidth: 2, 
                        pointRadius: 4, 
                        pointHoverRadius: 6,
                        fill: true, 
                        tension: 0.4 // Garis melengkung
                    },
                    {
                        label: 'Lelah (Mata Sayu)',
                        // TODO: Ganti array ini dengan query Supabase (Total Sayu per hari selama 7 hari)
                        data: [20, 45, 30, 60, 55, 15, 10], 
                        borderColor: '#ef4444', // Red 500
                        backgroundColor: gradientRed, 
                        borderWidth: 3, 
                        pointBackgroundColor: '#ffffff', 
                        pointBorderColor: '#ef4444', 
                        pointBorderWidth: 2, 
                        pointRadius: 4,
                        pointHoverRadius: 6,
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
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleFont: { size: 13, family: 'Poppins' },
                        bodyFont: { size: 12, family: 'Poppins' },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                // Menyesuaikan teks dengan arsitektur CNN Gambar
                                return context.dataset.label + ': ' + context.parsed.y + ' Inferensi';
                            }
                        }
                    }
                },
                interaction: { mode: 'nearest', axis: 'x', intersect: false },
                scales: { 
                    y: { beginAtZero: true, grid: { drawBorder: false } },
                    x: { grid: { display: false, drawBorder: false } }
                }
            }
        });
    }

// --- 3. RENDER GRAFIK DISTRIBUSI PRODI (BAR CHART 7 HARI) ---
    // Menampilkan perbandingan berdampingan (Segar vs Sayu) selama seminggu
    const ctxProdiElement = document.getElementById('weeklyProdiChart');
    if (ctxProdiElement) {
        new Chart(ctxProdiElement.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Sains Data', 'Informatika', 'Sist. Informasi', 'RPL', 'Telkom'],
                datasets: [
                    {
                        label: 'Mata Segar (Optimal)',
                        // TODO: Ganti dengan akumulasi query Supabase (Total Segar per prodi 7 hari)
                        data: [185, 142, 120, 95, 110],
                        backgroundColor: '#10b981', // Emerald
                        borderRadius: 4
                    },
                    {
                        label: 'Mata Sayu (Lelah)',
                        // TODO: Ganti dengan akumulasi query Supabase (Total Sayu per prodi 7 hari)
                        data: [45, 82, 35, 50, 28],
                        backgroundColor: '#ef4444', // Merah peringatan
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { 
                        display: true, // Dimunculkan kembali karena ada 2 dataset
                        position: 'top',
                        labels: { boxWidth: 10, usePointStyle: true, padding: 15 }
                    }, 
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y + ' Inferensi';
                            }
                        }
                    }
                },
                scales: { 
                    y: { 
                        beginAtZero: true, 
                        grid: { color: 'rgba(226, 232, 240, 0.5)' } 
                    },
                    x: { 
                        grid: { display: false } 
                    }
                }
            }
        });
    }

});