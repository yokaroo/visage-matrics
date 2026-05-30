/**
 * VISAGE METRICS - CORE ENGINE v7.0 (FINAL SAFE MODE - HYBRID FIXED)
 * Logic: Geometry EAR + CNN Ensemble (Input 224x224 + EAR)
 */

import { insertDeteksiMata, getCurrentUser, insertLogAktivitas } from './auth-helper.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Visage Metrics: Engine Start...");

    const elements = {
        imageInput: document.getElementById('imageInput'),
        imagePreview: document.getElementById('imagePreview'),
        uploadPlaceholder: document.getElementById('upload-placeholder'),
        btnAnalyze: document.getElementById('btn-analyze'),
        btnReset: document.getElementById('btn-reset'),
        btnUpload: document.getElementById('btn-upload'),
        dropzoneArea: document.getElementById('dropzone-area'),
        canvasKanan: document.getElementById('canvasKanan'),
        canvasKiri: document.getElementById('canvasKiri'),
        statusIndicator: document.getElementById('status-indicator'),
        scanEffect: document.getElementById('scan-effect'),
        resPlaceholder: document.getElementById('res-placeholder'),
        resSayu: document.getElementById('res-sayu'),
        resSegar: document.getElementById('res-segar'),
        btnSave: document.getElementById('btn-save')
    };

    let aiModel = null;
    let isModelLoaded = false;
    let currentUser = null;
    
    // Objek sementara penyimpan data
    let detectionData = {
        user_id: null,
        nilai_ear: 0,
        blink_rate: 0,
        eye_closure: 0,
        head_tilt: 0,
        status_mata: 'normal',
        durasi_sesi: 0
    };

    // Ambil data User saat halaman dimuat
    getCurrentUser().then(user => {
        if (user) {
            currentUser = user;
            detectionData.user_id = user.id;
        } else {
            alert("Akses Ditolak. Harap login kembali.");
            window.location.href = "../../login.html";
        }
    });

    // --- SIMPAN HASIL DETEKSI KE SUPABASE ---
    if (elements.btnSave) {
        elements.btnSave.addEventListener('click', async function(e) {
            e.preventDefault(); 

            // Double-check session before attempting save
            const user = await getCurrentUser();
            if(!user || !currentUser) {
                alert("Sesi Anda telah habis, silakan login ulang untuk melanjutkan analisis.");
                window.location.href = "../../login.html";
                return;
            }

            if(!detectionData.nilai_ear || detectionData.nilai_ear === 0) {
                alert("Data analisis tidak lengkap. Silakan lakukan analisis terlebih dahulu.");
                return;
            }

            const originalText = elements.btnSave.innerHTML;
            elements.btnSave.disabled = true;
            elements.btnSave.innerHTML = '<span class="inline-block animate-spin mr-2">⌛</span>Menyimpan...';

            try {
                console.log('[SAVE] Attempting to save detection data:', detectionData);
                
                // Insert ke database Supabase
                const { error } = await insertDeteksiMata(detectionData);

                if (error) {
                    const errorMsg = error.message || String(error);
                    console.error('[SAVE ERROR]', errorMsg);
                    
                    // Check if session expired or RLS error
                    if (errorMsg.toLowerCase().includes('sesi') || 
                        errorMsg.toLowerCase().includes('session') || 
                        errorMsg.toLowerCase().includes('authentica') || 
                        errorMsg.toLowerCase().includes('rls') ||
                        errorMsg.includes('401') ||
                        errorMsg.includes('403')) {
                        
                        alert("Sesi Anda telah habis atau akses ditolak. Silakan login ulang untuk melanjutkan.");
                        window.location.href = "../../login.html";
                        return;
                    }
                    throw error;
                }

                console.log('[SAVE SUCCESS] Detection saved successfully');

                // Log aktivitas - don't fail if log fails
                try {
                    await insertLogAktivitas({
                        tipe_log: 'DETEKSI_MATA',
                        deskripsi: `Analisis selesai: Status=${detectionData.status_mata.toUpperCase()}, EAR=${detectionData.nilai_ear}, AI=${detectionData.blink_rate}%`,
                        user_id: currentUser.id
                    });
                    console.log('[LOG] Activity logged successfully');
                } catch (logErr) {
                    console.warn('[LOG WARNING] Could not log activity:', logErr);
                    // Continue anyway - detection was saved
                }

                alert('✅ Hasil klasifikasi berhasil disimpan ke database!');
            } catch (err) {
                const errorMsg = err.message || String(err);
                console.error('[EXCEPTION]', errorMsg);
                
                if (errorMsg.toLowerCase().includes('sesi') || 
                    errorMsg.toLowerCase().includes('session') || 
                    errorMsg.toLowerCase().includes('authentica')) {
                    alert("Sesi tidak valid. Silakan login ulang untuk melanjutkan.");
                    window.location.href = "../../login.html";
                } else if (errorMsg.toLowerCase().includes('rls') || 
                           errorMsg.toLowerCase().includes('row-level security')) {
                    alert("❌ Gagal menyimpan: Akses ditolak. Silakan logout dan login ulang.");
                    window.location.href = "../../login.html";
                } else {
                    alert('❌ Gagal menyimpan hasil deteksi: ' + errorMsg);
                }
            } finally {
                elements.btnSave.disabled = false;
                elements.btnSave.innerHTML = originalText;
            }
        });
    }

    const enableAnalyzeButton = () => {
        if (elements.btnAnalyze) {
            elements.btnAnalyze.disabled = false;
            elements.btnAnalyze.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    };

    const waitForImageReady = (img) => new Promise((resolve, reject) => {
        if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
            resolve(); return;
        }
        const onLoad = () => { img.removeEventListener('load', onLoad); resolve(); };
        const onError = (err) => { img.removeEventListener('error', onError); reject(err); };
        img.addEventListener('load', onLoad);
        img.addEventListener('error', onError);
        setTimeout(() => reject(new Error('Image load timeout')), 5000);
    });

    // --- UI EVENTS FILE UPLOAD ---
    elements.imageInput.onclick = (e) => e.stopPropagation(); 
    const triggerUpload = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        elements.imageInput.click();
    };

    if (elements.btnUpload) elements.btnUpload.onclick = triggerUpload;
    if (elements.dropzoneArea) elements.dropzoneArea.onclick = triggerUpload;

    elements.imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                elements.imagePreview.onload = () => {
                    elements.imagePreview.classList.remove('hidden');
                    elements.imagePreview.style.display = "block";
                    if (elements.uploadPlaceholder) elements.uploadPlaceholder.style.display = "none";
                    if (isModelLoaded) enableAnalyzeButton();
                    elements.btnReset.disabled = false;
                    elements.btnReset.classList.remove('opacity-50', 'cursor-not-allowed');
                    resetResultUI();
                };
                elements.imagePreview.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // --- LOAD RESOURCES (MODEL) ---
    async function loadResources() {
        try {
            // Try absolute path first (served from assets static folder)
            aiModel = await tf.loadLayersModel('/assets/models/web_model/model.json', {compile: false});
            console.log("✅ TensorFlow: Model Hybrid Loaded (absolute path).");
            isModelLoaded = true;
            if (elements.imagePreview.complete && elements.imagePreview.naturalWidth > 0) {
                enableAnalyzeButton();
            }
        } catch (err) {
            console.warn("⚠️ Primary model path failed, trying relative path...", err);
            try {
                const rel = new URL('../../assets/models/web_model/model.json', window.location.href).href;
                aiModel = await tf.loadLayersModel(rel, {compile: false});
                console.log("✅ TensorFlow: Model Hybrid Loaded (relative path).");
                isModelLoaded = true;
                if (elements.imagePreview.complete && elements.imagePreview.naturalWidth > 0) {
                    enableAnalyzeButton();
                }
            } catch (err2) {
                console.error("❌ FATAL: Gagal memuat model CNN pada kedua path.", err2);
            }
        }

        const faceMesh = new FaceMesh({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`});
        faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5 });
        faceMesh.onResults(processAnalysis);
        return faceMesh;
    }

    const faceMeshEngine = loadResources();

    // --- GEOMETRY ---
    function calculateEAR(landmarks, indices, imgWidth, imgHeight) {
        const p = indices.map(i => ({ x: landmarks[i].x * imgWidth, y: landmarks[i].y * imgHeight }));
        const a = Math.hypot(p[1].x - p[5].x, p[1].y - p[5].y);
        const b = Math.hypot(p[2].x - p[4].x, p[2].y - p[4].y);
        const c = Math.hypot(p[0].x - p[3].x, p[0].y - p[3].y);
        return (a + b) / (2.0 * c);
    }

    // --- AI ENGINE (REVISED) ---
    // FIX: Menambahkan parameter earValue untuk dikirim ke model Hybrid
    async function getEyePrediction(landmarks, indices, targetCanvas, earValue) {
        const w = elements.imagePreview.naturalWidth;
        const h = elements.imagePreview.naturalHeight;
        const padding = 20;

        const xs = indices.map(i => landmarks[i].x * w);
        const ys = indices.map(i => landmarks[i].y * h);
        let x1 = Math.max(0, Math.min(...xs) - padding);
        let x2 = Math.min(w, Math.max(...xs) + padding);
        let y1 = Math.max(0, Math.min(...ys) - padding);
        let y2 = Math.min(h, Math.max(...ys) + padding);

        // FIX: Resolusi MobileNetV2 Wajib 224x224
        targetCanvas.width = 224; 
        targetCanvas.height = 224;
        
        const ctx = targetCanvas.getContext('2d');
        ctx.clearRect(0, 0, 224, 224);
        ctx.drawImage(elements.imagePreview, x1, y1, x2 - x1, y2 - y1, 0, 0, 224, 224);

        if (!aiModel) return 0.5;

        try {
            return tf.tidy(() => {
                // Tensor 1: Gambar 224x224
                let imgTensor = tf.browser.fromPixels(targetCanvas);
                let batchedTensor = imgTensor.expandDims(0);
                // FIX: Normalisasi MobileNetV2 (Pixel / 127.5 - 1)
                let normalizedImg = batchedTensor.toFloat().div(127.5).sub(1.0); 

                // Tensor 2: Nilai EAR
                let earTensor = tf.tensor2d([[earValue]]);

                // FIX: Memasukkan dua tensor sekaligus ke otak AI
                const prediction = aiModel.predict([normalizedImg, earTensor]);
                return prediction.dataSync()[0]; 
            });
        } catch (err) {
            console.error("TFJS Engine Error:", err);
            return 0.5;
        }
    }

    // --- EXECUTION PIPELINE ---
    elements.btnAnalyze.onclick = async (e) => {
        e.preventDefault();
        const engine = await faceMeshEngine;
        elements.scanEffect.classList.remove('hidden');
        elements.statusIndicator.style.backgroundColor = "#0ea5e9";
        elements.btnAnalyze.disabled = true;
        
        try {
            await waitForImageReady(elements.imagePreview);
            await engine.send({image: elements.imagePreview});
        } catch (error) {
            console.error("Error MediaPipe:", error);
            elements.scanEffect.classList.add('hidden');
            alert("Gambar tidak dapat diproses. Coba gambar yang wajahnya lebih jelas.");
            elements.btnAnalyze.disabled = false;
        }
    };

    async function processAnalysis(results) {
        elements.scanEffect.classList.add('hidden');
        elements.resPlaceholder.classList.add('hidden');
        elements.btnAnalyze.disabled = false; 

        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            alert("⚠️ Wajah tidak terdeteksi! Gunakan foto yang lebih jelas.");
            resetResultUI();
            return;
        }

        const landmarks = results.multiFaceLandmarks[0];
        const RIGHT_EYE = [33, 160, 158, 133, 153, 144];
        const LEFT_EYE = [362, 385, 387, 263, 373, 380];
        const imgW = elements.imagePreview.naturalWidth;
        const imgH = elements.imagePreview.naturalHeight;

        // Geometri
        const avgEAR = (calculateEAR(landmarks, RIGHT_EYE, imgW, imgH) + calculateEAR(landmarks, LEFT_EYE, imgW, imgH)) / 2.0;

        // CNN
        let rawAI = 0.5;
        if (aiModel) {
            // FIX: Mengirimkan avgEAR ke fungsi getEyePrediction
            const scoreR = await getEyePrediction(landmarks, RIGHT_EYE, elements.canvasKanan, avgEAR);
            const scoreL = await getEyePrediction(landmarks, LEFT_EYE, elements.canvasKiri, avgEAR);
            rawAI = (scoreR + scoreL) / 2.0;
        }

        // Ensemble Gating
        let finalAI = rawAI < 0.5 ? Math.pow(rawAI * 2, 3) / 2 : 1 - (Math.pow((1 - rawAI) * 2, 3) / 2);
        if (avgEAR >= 0.31) finalAI = Math.min(finalAI, 0.15); 
        if (avgEAR <= 0.23) finalAI = Math.max(finalAI, 0.85); 

        // Update UI
        elements.resSayu.classList.add('hidden');
        elements.resSegar.classList.add('hidden');

        // Menyusun Data untuk dikirim ke Database
        detectionData.nilai_ear = parseFloat(avgEAR.toFixed(3));
        detectionData.eye_closure = parseFloat(avgEAR.toFixed(3));
        detectionData.blink_rate = parseFloat((finalAI * 100).toFixed(1));
        detectionData.head_tilt = 0; 

        if (avgEAR < 0.25 || finalAI > 0.55) {
            elements.resSayu.classList.remove('hidden');
            elements.statusIndicator.style.backgroundColor = "#ef4444";
            detectionData.status_mata = 'lelah';
            detectionData.durasi_sesi = 0; // Default session duration
            elements.resSayu.querySelector('p').innerHTML = `AI Confidence: <b>${(finalAI * 100).toFixed(1)}%</b><br>Eye Aspect Ratio: <b>${avgEAR.toFixed(3)}</b>`;
        } else {
            elements.resSegar.classList.remove('hidden');
            elements.statusIndicator.style.backgroundColor = "#10b981";
            detectionData.status_mata = 'segar';
            detectionData.durasi_sesi = 0; // Default session duration
            elements.resSegar.querySelector('p').innerHTML = `Freshness Index: <b>${((1 - finalAI) * 100).toFixed(1)}%</b><br>Eye Aspect Ratio: <b>${avgEAR.toFixed(3)}</b>`;
        }

        if (elements.btnSave) {
            elements.btnSave.disabled = false;
            elements.btnSave.classList.remove('opacity-50', 'cursor-not-allowed');
            elements.btnSave.classList.add('hover:bg-slate-100', 'text-slate-700', 'border-slate-300');
        }
    }

    elements.btnReset.onclick = (e) => { e.preventDefault(); location.reload(); };

    function resetResultUI() {
        if(elements.resSayu) elements.resSayu.classList.add('hidden');
        if(elements.resSegar) elements.resSegar.classList.add('hidden');
        if(elements.resPlaceholder) elements.resPlaceholder.classList.remove('hidden');
        if(elements.statusIndicator) elements.statusIndicator.style.backgroundColor = "#cbd5e1";
    }
});