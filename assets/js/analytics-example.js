// assets/js/analytics-example.js
// Contoh implementasi Analytics Dashboard dengan Supabase

import { getCurrentUser } from './auth-helper.js';
import { 
    getDetectionStats, 
    getTrendChartData, 
    getStatusPieChartData,
    formatChartJsData 
} from './analytics-helper.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📊 Initializing Analytics Dashboard...');

    // Get current user
    const user = await getCurrentUser();
    if (!user) {
        console.error('❌ User tidak ditemukan. Silakan login terlebih dahulu.');
        window.location.href = '../../login.html';
        return;
    }

    const userId = user.id;

    // ===== LOAD DATA HARI INI =====
    const statsToday = await getDetectionStats(userId, 'today');
    console.log('📈 Stats hari ini:', statsToday);

    // Update UI dengan stats hari ini (jika ada element di HTML)
    const statsElements = {
        totalDeteksi: document.getElementById('total-deteksi-hari-ini'),
        lelaArray: document.getElementById('total-lelah-hari-ini'),
        segarCount: document.getElementById('total-segar-hari-ini'),
        avgBlinkRate: document.getElementById('avg-blink-rate'),
        avgEyeClosure: document.getElementById('avg-eye-closure'),
        avgHeadTilt: document.getElementById('avg-head-tilt')
    };

    Object.entries(statsElements).forEach(([key, element]) => {
        if (element) {
            element.textContent = statsToday[Object.keys(statsToday)[Object.keys(statsToday).indexOf(key)]] || 0;
        }
    });

    // ===== RENDER TREN CHART (LINE CHART) =====
    try {
        const trendData = await getTrendChartData(userId, 'today');
        const ctxTrend = document.getElementById('trendChart');
        
        if (ctxTrend && typeof Chart !== 'undefined') {
            const formattedData = formatChartJsData('line', trendData.labels, {
                segarData: trendData.segarData,
                lelahData: trendData.lelahData
            });

            new Chart(ctxTrend.getContext('2d'), {
                type: 'line',
                data: formattedData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: { boxWidth: 10, usePointStyle: true, padding: 15 }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('❌ Error rendering tren chart:', error);
    }

    // ===== RENDER PIE CHART =====
    try {
        const pieData = await getStatusPieChartData(userId, 'today');
        const ctxPie = document.getElementById('statusPieChart');
        
        if (ctxPie && typeof Chart !== 'undefined') {
            new Chart(ctxPie.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: pieData.labels,
                    datasets: [{
                        data: pieData.data,
                        backgroundColor: ['#10b981', '#ef4444'],
                        borderColor: ['#ffffff', '#ffffff'],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('❌ Error rendering pie chart:', error);
    }

    // ===== RENDER BAR CHART =====
    try {
        const metricsData = await getTrendChartData(userId, '7days');
        const ctxBar = document.getElementById('metricsBarChart');
        
        if (ctxBar && typeof Chart !== 'undefined') {
            new Chart(ctxBar.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: metricsData.labels,
                    datasets: [{
                        label: 'Deteksi (7 hari)',
                        data: metricsData.segarData,
                        backgroundColor: '#0ea5e9',
                        borderColor: '#0284c7',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('❌ Error rendering bar chart:', error);
    }

    console.log('✅ Analytics Dashboard loaded successfully!');
});
