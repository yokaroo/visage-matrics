// assets/js/analytics-helper.js
// Helper functions untuk Analytics Dashboard

import { 
    getDeteksiMataHariIni, 
    getDeteksiMata7Hari, 
    getDeteksiMata30Hari,
    getLogAktivitasUser 
} from './auth-helper.js';

/**
 * Hitung statistik deteksi untuk periode tertentu
 */
export async function getDetectionStats(userId, period = 'today') {
    let data = [];
    
    if (period === 'today') {
        const { data: deteksi } = await getDeteksiMataHariIni(userId);
        data = deteksi || [];
    } else if (period === '7days') {
        const { data: deteksi } = await getDeteksiMata7Hari(userId);
        data = deteksi || [];
    } else if (period === '30days') {
        const { data: deteksi } = await getDeteksiMata30Hari(userId);
        data = deteksi || [];
    }

    // Hitung statistik
    const stats = {
        totalDeteksi: data.length,
        lelah: 0,
        segar: 0,
        avgBlinkRate: 0,
        avgEyeClosure: 0,
        avgHeadTilt: 0,
        rataRataBlinkRate: 0,
        rataRataEyeClosure: 0,
        rataRataHeadTilt: 0
    };

    if (data.length > 0) {
        let totalBlinkRate = 0;
        let totalEyeClosure = 0;
        let totalHeadTilt = 0;

        data.forEach(item => {
            if (item.status_mata === 'lelah') stats.lelah++;
            if (item.status_mata === 'segar') stats.segar++;
            
            totalBlinkRate += item.blink_rate || 0;
            totalEyeClosure += item.eye_closure || 0;
            totalHeadTilt += item.head_tilt || 0;
        });

        stats.rataRataBlinkRate = (totalBlinkRate / data.length).toFixed(2);
        stats.rataRataEyeClosure = (totalEyeClosure / data.length).toFixed(2);
        stats.rataRataHeadTilt = (totalHeadTilt / data.length).toFixed(2);
    }

    return stats;
}

/**
 * Dapatkan data untuk line chart (tren per jam/hari)
 */
export async function getTrendChartData(userId, period = '7days') {
    let data = [];

    if (period === 'today') {
        const { data: deteksi } = await getDeteksiMataHariIni(userId);
        data = deteksi || [];
    } else if (period === '7days') {
        const { data: deteksi } = await getDeteksiMata7Hari(userId);
        data = deteksi || [];
    } else if (period === '30days') {
        const { data: deteksi } = await getDeteksiMata30Hari(userId);
        data = deteksi || [];
    }

    // Group by time
    const grouped = {};

    data.forEach(item => {
        const date = new Date(item.created_at);
        let timeKey;

        if (period === 'today') {
            // Group by hour
            timeKey = date.getHours().toString().padStart(2, '0') + ':00';
        } else {
            // Group by date
            timeKey = date.getDate().toString().padStart(2, '0');
        }

        if (!grouped[timeKey]) {
            grouped[timeKey] = { segar: 0, lelah: 0, total: 0 };
        }

        if (item.status_mata === 'segar') {
            grouped[timeKey].segar++;
        } else if (item.status_mata === 'lelah') {
            grouped[timeKey].lelah++;
        }
        grouped[timeKey].total++;
    });

    // Convert ke array
    const labels = Object.keys(grouped).sort();
    const segarData = labels.map(key => grouped[key].segar);
    const lelahData = labels.map(key => grouped[key].lelah);

    return { labels, segarData, lelahData };
}

/**
 * Dapatkan data untuk pie chart (persentase status)
 */
export async function getStatusPieChartData(userId, period = 'today') {
    const stats = await getDetectionStats(userId, period);

    return {
        labels: ['Segar', 'Lelah'],
        data: [stats.segar, stats.lelah],
        percentages: [
            stats.totalDeteksi > 0 ? ((stats.segar / stats.totalDeteksi) * 100).toFixed(1) : 0,
            stats.totalDeteksi > 0 ? ((stats.lelah / stats.totalDeteksi) * 100).toFixed(1) : 0
        ]
    };
}

/**
 * Dapatkan data untuk bar chart (perbandingan metrik)
 */
export async function getMetricsBarChartData(userId, period = 'today') {
    const stats = await getDetectionStats(userId, period);

    return {
        labels: ['Blink Rate', 'Eye Closure', 'Head Tilt'],
        data: [
            parseFloat(stats.rataRataBlinkRate),
            parseFloat(stats.rataRataEyeClosure),
            parseFloat(stats.rataRataHeadTilt)
        ]
    };
}

/**
 * Format data untuk Chart.js
 */
export function formatChartJsData(chartType, labels, datasets) {
    const colors = {
        segar: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
        lelah: { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
    };

    if (chartType === 'line') {
        return {
            labels: labels,
            datasets: [
                {
                    label: 'Optimal (Mata Segar)',
                    data: datasets.segarData,
                    borderColor: colors.segar.border,
                    backgroundColor: colors.segar.bg,
                    borderWidth: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: colors.segar.border,
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Lelah (Mata Sayu)',
                    data: datasets.lelahData,
                    borderColor: colors.lelah.border,
                    backgroundColor: colors.lelah.bg,
                    borderWidth: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: colors.lelah.border,
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    fill: true,
                    tension: 0.4
                }
            ]
        };
    } else if (chartType === 'pie') {
        return {
            labels: labels,
            datasets: [{
                data: datasets.data,
                backgroundColor: [colors.segar.border, colors.lelah.border],
                borderColor: ['#ffffff', '#ffffff'],
                borderWidth: 2
            }]
        };
    } else if (chartType === 'bar') {
        return {
            labels: labels,
            datasets: [{
                label: 'Rata-rata Nilai',
                data: datasets.data,
                backgroundColor: '#0ea5e9',
                borderColor: '#0284c7',
                borderWidth: 2
            }]
        };
    }
}
