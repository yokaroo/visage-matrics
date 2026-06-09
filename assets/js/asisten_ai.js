// IMPORT API KEY DARI FILE RAHASIA
import { GEMINI_API_KEYS } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // ==========================================
    // 0. FETCH USER INFO DARI SESSION
    // ==========================================
    let currentUserName = 'Pengguna';
    let currentUserRole = 'mahasiswa';
    
    try {
        const profileRes = await fetch('/api/auth/profile', { credentials: 'include' });
        if (profileRes.ok) {
            const profileData = await profileRes.json();
            currentUserName = profileData.user?.nama_lengkap || profileData.user?.name || 'Pengguna';
            currentUserRole = profileData.user?.role || 'mahasiswa';
        }
    } catch (e) {
        console.warn('Tidak bisa fetch user profile:', e);
    }
    
    // ==========================================
    // 1. KONFIGURASI API & INSTRUKSI SISTEM KETAT
    // ==========================================
    
    // Fallback Endpoint: Jika model preview mati, sistem akan turun ke model stabil
    const GEMINI_MODELS = [
        'gemini-3-flash-preview',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash'
    ];

    function getRandomGeminiKey() {
        if (!Array.isArray(GEMINI_API_KEYS) || GEMINI_API_KEYS.length === 0) return '';
        const index = Math.floor(Math.random() * GEMINI_API_KEYS.length);
        return GEMINI_API_KEYS[index];
    }

    function buildGeminiEndpoint(model) {
        const key = getRandomGeminiKey();
        return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateText?key=${key}`;
    }

    // INSTRUKSI KETAT (GUARDRAIL) UNTUK AI
    const SYSTEM_INSTRUCTION = `Anda adalah Dr. Visage AI, asisten medis virtual spesialis kesehatan mata dari platform Visage Metrics.
ATURAN KETAT YANG TIDAK BOLEH DILANGGAR:
1. Jawab pertanyaan pengguna secara langsung dan spesifik sesuai topik kesehatan mata, kelelahan visual, kelelahan membaca, ergonomi belajar, dan kebiasaan membaca di perpustakaan.
2. Berikan solusi praktis untuk keluhan seperti mata perih, mata kering, pandangan kabur, sakit kepala, atau sensasi lelah saat membaca, belajar, atau menggunakan gadget.
3. Jika pengguna bertanya tentang hal di luar topik kesehatan mata, jawab dengan sopan: "Maaf, sebagai Dr. Visage AI, saya hanya diprogram untuk mendiskusikan masalah kesehatan mata, kelelahan visual, dan kebiasaan membaca."
4. Jangan menambahkan informasi tidak relevan atau pengantar panjang; fokus pada rekomendasi singkat dan mudah diikuti.
5. Gunakan bahasa Indonesia yang profesional, empatik, dan sesuai untuk mahasiswa.
6. Jawab maksimal dalam 2 paragraf pendek.
7. Jangan gunakan simbol asterisk (*), markdown tebal, atau format kode karena akan dibaca oleh Text-to-Speech.
8. Panggil pengguna dengan nama mereka jika relevan untuk memberikan respons yang personal dan empati.`;

    const eyeKeywords = [
        "mata","perih","lelah","kelelahan","kabur","silau","pusing","layar","laptop","monitor","handphone",
        "smartphone","tablet","membaca","buku","perpustakaan","kerja","tugas","belajar","ergonomi",
        "istirahat","kelopak","kering","pandangan","komputer","visi","nyeri","digital eye strain",
        "postur","kacamata","fokus","skripsi","makalah","fatigue","panda","bengkak","merah","iritasi",
        "sensasi","keluhan","gejala","kesehatan","medis","dokter","konsultasi","terapi","treatment"
    ];

    function getStaticAnswer(normalizedPrompt) {
        const promptLower = normalizedPrompt.toLowerCase();

        if (/\b(panda|lingkaran|hitam|dark circle|mata panda)\b/.test(promptLower)) {
            return "Lingkaran hitam atau mata panda biasanya disebabkan oleh kurang tidur, dehidrasi, atau alergi. Untuk menguranginya, pastikan tidur cukup 7-9 jam, minum air teratur, hindari alergen, dan kompres area mata dengan air dingin selama 5-10 menit setiap pagi. Jika berlanjut, konsultasikan dengan dokter.";
        }

        if (/\b(bengkak|pembengkakan|swelling|puffiness|bengkak mata)\b/.test(promptLower)) {
            return "Pembengkakan mata dapat disebabkan oleh kurang tidur, alergi, infeksi, atau retensi cairan. Coba kompres dingin atau teh hijau dingin di area mata selama 10-15 menit, tidur dengan bantal lebih tinggi, dan hindari makanan asin berlebihan. Jika bengkak tidak hilang dalam 3-5 hari atau ada rasa nyeri, segera periksa ke dokter mata.";
        }

        if (/\b(membaca|buku|perpustakaan|belajar|tugas|skripsi|makalah|catatan)\b/.test(promptLower)) {
            return "Saat membaca atau belajar lama, jaga jarak buku atau layar minimal 40-50 cm dari mata dan lakukan istirahat singkat setiap 20 menit. Coba aturan 20-20-20: setiap 20 menit, lihat objek sejauh 6 meter selama 20 detik untuk meredakan ketegangan mata.";
        }

        if (/\b(layar|laptop|monitor|handphone|smartphone|tablet|gadget)\b/.test(promptLower)) {
            return "Untuk mengurangi kelelahan mata akibat layar, atur kecerahan agar tidak terlalu terang dan gunakan pencahayaan ruangan lembut. Istirahatkan mata setiap 20 menit, berkedip lebih sering, dan posisikan layar sejajar atau sedikit di bawah tingkat mata.";
        }

        if (/\b(kelelahan|letih|capek|lelah)\b/.test(promptLower)) {
            return "Kelelahan visual sering terjadi karena mata terus fokus pada teks atau layar tanpa istirahat. Coba lakukan jeda singkat setiap 20 menit dan pastikan pencahayaan tidak membuat mata bekerja lebih keras.";
        }

        if (/\b(perih|kering|kabur|pusing|sakit kepala|nyeri|panas|bau)\b/.test(promptLower)) {
            return "Gejala seperti mata perih, kering, kabur, atau sakit kepala biasanya disebabkan oleh ketegangan visual. Istirahatkan mata secara teratur, berkedip lebih sering, dan pastikan penerangan cukup tanpa silau langsung.";
        }

        return "Mata lelah saat membaca atau berada di perpustakaan umumnya dapat diatasi dengan istirahat teratur, pencahayaan yang tepat, dan memastikan jarak pandang yang nyaman. Jika keluhan terus berlanjut, konsultasikan dengan tenaga medis.";
    }

    // ==========================================
    // 2. REFERENSI ELEMEN DOM
    // ==========================================
    const chatForm = document.getElementById('chat-form');
    const inputField = document.getElementById('chat-input');
    const bubbleContainer = document.getElementById('dynamic-bubble');
    const bubbleBox = document.getElementById('bubble-box');
    const bubbleTail = document.getElementById('bubble-tail');
    const speakerLabel = document.getElementById('speaker-label');
    const bubbleContent = document.getElementById('bubble-content');
    const typingAnim = document.getElementById('typing-anim');
    const robotImg = document.getElementById('robot-image');
    const robotGlow = document.getElementById('robot-glow');
    const btnMute = document.getElementById('btn-mute');

    let isMuted = false;

    // ==========================================
    // 3. PENGATURAN GAYA BUBBLE
    // ==========================================
    const styleRobot = {
        box: 'bg-white/95 border-sky-100 rounded-3xl lg:rounded-tl-none shadow-[0_15px_40px_rgba(14,165,233,0.15)] text-slate-700',
        tail: 'bg-white/95 border-sky-100 rotate-45 -top-2.5 left-1/2 -translate-x-1/2 lg:-rotate-45 lg:-left-3 lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-0',
        labelHtml: '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span class="text-[10px] font-black text-sky-600 uppercase tracking-widest">Dr. Visage</span>'
    };
    
    const getStyleUser = () => ({
        box: 'bg-sky-500 border-sky-400 rounded-3xl lg:rounded-tr-none shadow-[0_15px_40px_rgba(14,165,233,0.3)] text-white',
        tail: 'bg-sky-500 border-sky-400 rotate-45 -bottom-2.5 left-1/2 -translate-x-1/2 lg:rotate-45 lg:-right-3 lg:top-1/2 lg:-translate-y-1/2 lg:left-auto lg:translate-x-0',
        labelHtml: `<span class="text-[10px] font-black text-sky-200 uppercase tracking-widest">${currentUserName} (Anda)</span>`
    });

    // ==========================================
    // 4. FUNGSI UPDATE UI BUBBLE
    // ==========================================
    function updateBubble(sender, text, isTyping = false) {
        if (!bubbleContainer) return;

        const styleUser = getStyleUser();

        bubbleContainer.classList.remove('bubble-visible');
        bubbleContainer.classList.add('bubble-hidden');

        setTimeout(() => {
            bubbleBox.className = 'relative z-30 p-6 lg:p-8 transition-all duration-300 ' + (sender === 'user' ? styleUser.box : styleRobot.box);
            bubbleTail.className = 'absolute w-5 h-5 lg:w-6 lg:h-6 border-l border-t z-20 transition-all ' + (sender === 'user' ? styleUser.tail : styleRobot.tail);
            speakerLabel.innerHTML = sender === 'user' ? styleUser.labelHtml : styleRobot.labelHtml;

            if (isTyping) {
                bubbleContent.classList.add('hidden');
                typingAnim.classList.remove('hidden');
                speakerLabel.innerHTML = '<span class="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span><span class="text-[10px] font-black text-yellow-600 uppercase tracking-widest">Dr. Visage Berpikir...</span>';
            } else {
                bubbleContent.classList.remove('hidden');
                typingAnim.classList.add('hidden');
                bubbleContent.innerHTML = text;
                bubbleContent.scrollTop = 0; 
            }

            bubbleContainer.classList.remove('bubble-hidden');
            bubbleContainer.classList.add('bubble-visible');
        }, 400); 
    }

    // ==========================================
    // 5. FUNGSI FILTER OOT & FETCH API GEMINI
    // ==========================================
    
    async function getAIResponse(prompt) {
        const normalizedPrompt = prompt.trim();
        if (!normalizedPrompt) return "Silakan tulis pertanyaan tentang kesehatan mata supaya Dr. Visage dapat membantu.";

        const isRelated = eyeKeywords.some(keyword => normalizedPrompt.toLowerCase().includes(keyword));
        if (!isRelated) {
            return `Maaf ${currentUserName}, sebagai Dr. Visage AI, saya hanya diprogram untuk mendiskusikan masalah kesehatan mata dan kelelahan visual.`;
        }

        // Include user context di dalam prompt
        const fullPrompt = `${SYSTEM_INSTRUCTION}\n\nKonteks Pengguna: Nama pengguna adalah ${currentUserName}, seorang ${currentUserRole}.\n\nPertanyaan dari ${currentUserName}: ${normalizedPrompt}\n\nJawaban Dr. Visage:`;

        if (!Array.isArray(GEMINI_API_KEYS) || GEMINI_API_KEYS.length === 0) {
            return getStaticAnswer(normalizedPrompt);
        }

        const requestBody = {
            prompt: { text: fullPrompt },
            temperature: 0.2,
            maxOutputTokens: 384,
            topP: 0.8,
            candidateCount: 1
        };

        for (let model of GEMINI_MODELS) {
            const url = buildGeminiEndpoint(model);
            try {
                const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestBody)
                });

                const data = await res.json();
                if (res.ok) {
                    const answer = data?.candidates?.[0]?.output
                        || data?.candidates?.[0]?.content?.[0]?.text
                        || data?.candidates?.[0]?.content?.parts?.[0]?.text
                        || data?.output_text
                        || data?.candidates?.[0]?.text
                        || null;

                    if (answer) {
                        return answer.trim();
                    }

                    console.warn('Gemini respons tidak berbentuk yang diharapkan:', data);
                }

                if (res.status === 404) {
                    console.warn("Model API tidak ditemukan, mencoba fallback...");
                    continue;
                }

                console.warn('Gemini error response:', res.status, data);
            } catch (e) {
                console.error("Kesalahan jaringan:", e);
            }
        }

        return getStaticAnswer(normalizedPrompt);
    }

    // ==========================================
    // 6. FUNGSI ANIMASI & SPEECH SYNTHESIS
    // ==========================================
    function speak(text) {
        if (isMuted) return;
        window.speechSynthesis.cancel();
        
        const utter = new SpeechSynthesisUtterance(text.replace(/[*#_]/g, ''));
        utter.lang = 'id-ID';
        
        utter.onstart = () => {
            if(robotImg) {
                robotImg.classList.remove('animate-float');
                robotImg.classList.add('animate-talk');
            }
            if(robotGlow) {
                robotGlow.classList.remove('bg-sky-400/20');
                robotGlow.classList.add('bg-indigo-500/40', 'animate-pulse');
            }
        };
        
        utter.onend = () => {
            if(robotImg) {
                robotImg.classList.remove('animate-talk');
                robotImg.classList.add('animate-float');
            }
            if(robotGlow) {
                robotGlow.classList.remove('bg-indigo-500/40', 'animate-pulse');
                robotGlow.classList.add('bg-sky-400/20');
            }
        };
        window.speechSynthesis.speak(utter);
    }

    // ==========================================
    // 7. EVENT LISTENER (SUBMIT & MUTE)
    // ==========================================
    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = inputField.value.trim();
            if (!text) return;

            inputField.value = "";
            updateBubble('user', text);

            setTimeout(async () => {
                updateBubble('robot', '', true);
                const aiRes = await getAIResponse(text);
                updateBubble('robot', aiRes);
                speak(aiRes);
            }, 2000); 
        });
    }

    if (btnMute) {
        btnMute.addEventListener('click', () => {
            isMuted = !isMuted;
            window.speechSynthesis.cancel();
            btnMute.className = isMuted 
                ? "p-2.5 md:p-3 bg-red-50 border border-red-200 text-red-500 rounded-full transition shadow-sm" 
                : "p-2.5 md:p-3 bg-white/80 backdrop-blur-md border border-slate-200 text-slate-500 rounded-full hover:bg-slate-100 transition shadow-sm";
        });
    }
});