// assets/js/admin_dashboard.js - Otak Halaman Admin Dashboard

document.addEventListener("DOMContentLoaded", function() {

    // --- 1. LOGIKA LOGOUT ADMIN ---
    const btnLogoutAdmin = document.getElementById('btn-logout-admin');
    if(btnLogoutAdmin) {
        btnLogoutAdmin.addEventListener('click', function() {
            if(confirm("Yakin ingin keluar dari Dashboard Admin?")) {
                window.location.replace('../login.html'); 
            }
        });
    }

    // --- 2. NAVIGASI DARI DASHBOARD KE DATA ANALITIK ---
    // Logika ini untuk tombol "Lihat Detail Laporan" di halaman dashboard
    const btnDetailAnalitik = document.getElementById('btn-detail-analitik');
    if(btnDetailAnalitik) {
        btnDetailAnalitik.addEventListener('click', function(e) {
            e.preventDefault();
            // Arahkan ke halaman analitik hari ini
            window.location.href = 'data_analitik_hari_ini.html';
        });
    }

    // --- 3. INISIALISASI CHART.JS ---
    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.color = '#94a3b8';

    // A. Line Chart (Tren Ekstraksi Mata Segar vs Mata Sayu)
    const ctxComp = document.getElementById('comparisonChart');
    if (ctxComp) {
        const ctx = ctxComp.getContext('2d');
        
        // Gradient Hijau (Segar)
        const gradientGreen = ctx.createLinearGradient(0, 0, 0, 350);
        gradientGreen.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
        gradientGreen.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

        // Gradient Merah (Sayu)
        const gradientRed = ctx.createLinearGradient(0, 0, 0, 350);
        gradientRed.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
        gradientRed.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
                datasets: [
                    {
                        label: 'Mata Segar',
                        data: [43, 42, 40, 41, 37, 33, 30, 35, 39],
                        borderColor: '#10b981', 
                        backgroundColor: gradientGreen,
                        borderWidth: 3,
                        pointBackgroundColor: '#ffffff',
                        pointBorderColor: '#10b981',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Mata Sayu',
                        data: [2, 3, 5, 4, 8, 12, 15, 10, 6],
                        borderColor: '#ef4444', 
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
                        labels: {
                            usePointStyle: true,
                            boxWidth: 10,
                            padding: 20,
                            font: { family: 'Poppins', weight: 'bold' }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleFont: { size: 13, family: 'Poppins' },
                        bodyFont: { size: 14, weight: 'bold' },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                // REVISI: Mengubah "Orang" menjadi "Gambar Diproses" agar sesuai dengan CNN Image Batch
                                return context.dataset.label + ': ' + context.parsed.y + ' Gambar';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        min: 0,
                        suggestedMax: 50,
                        grid: { color: 'rgba(226, 232, 240, 0.5)', drawBorder: false },
                        ticks: { padding: 10, stepSize: 10 }
                    },
                    x: {
                        grid: { display: false, drawBorder: false },
                        ticks: { padding: 10 }
                    }
                }
            }
        });
    }

    // B. Bar Chart BINER (Distribusi Prodi)
    const ctxProdi = document.getElementById('prodiChart');
    if (ctxProdi) {
        new Chart(ctxProdi.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Sains Data', 'T. Informatika', 'Sistem Info'],
                datasets: [
                    {
                        label: 'Mata Segar',
                        data: [20, 16, 12],
                        backgroundColor: '#10b981', 
                        borderRadius: 4
                    },
                    {
                        label: 'Mata Sayu',
                        data: [5, 7, 3],
                        backgroundColor: '#ef4444', 
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 10, usePointStyle: true, padding: 20 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                // REVISI: Teks Tooltip disesuaikan
                                return context.dataset.label + ': ' + context.parsed.y + ' Inferensi';
                            }
                        }
                    }
                },
                scales: {
                    x: { stacked: true, grid: { display: false } },
                    y: { stacked: true, grid: { color: 'rgba(226, 232, 240, 0.5)' } }
                }
            }
        });
    }
});