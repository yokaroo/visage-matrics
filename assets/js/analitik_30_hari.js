// File: assets/js/analitik_30_hari.js

document.addEventListener('DOMContentLoaded', () => {
    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.color = '#64748b';

    // 1. GRAFIK TREN BULANAN (Per Minggu)
    const ctxMonthly = document.getElementById('monthlyTrendChart');
    if (ctxMonthly) {
        new Chart(ctxMonthly.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'],
                datasets: [
                    {
                        label: 'Mata Segar',
                        data: [450, 520, 480, 600],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Mata Sayu',
                        data: [80, 120, 150, 95],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // 2. GRAFIK DISTRIBUSI PRODI (30 Hari)
    const ctxProdi = document.getElementById('monthlyProdiChart');
    if (ctxProdi) {
        new Chart(ctxProdi.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Sains Data', 'Informatika', 'Sist. Informasi', 'RPL', 'Telkom'],
                datasets: [
                    {
                        label: 'Mata Segar',
                        data: [650, 580, 420, 390, 410],
                        backgroundColor: '#10b981',
                        borderRadius: 6
                    },
                    {
                        label: 'Mata Sayu',
                        data: [120, 210, 85, 130, 95],
                        backgroundColor: '#ef4444',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: { 
                    y: { beginAtZero: true },
                    x: { grid: { display: false } }
                }
            }
        });
    }
});