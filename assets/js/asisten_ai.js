// IMPORT API KEY DARI FILE RAHASIA
import { GEMINI_API_KEYS } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // ==========================================
    // 0. FETCH USER INFO DARI SESSION (ANTI CRASH JSON)
    // ==========================================
    let currentUserName = 'Pengguna';
    let currentUserRole = 'mahasiswa';
    
    try {
        const profileRes = await fetch('/api/auth/profile', { credentials: 'include' });
        const rawText = await profileRes.text(); // Baca teks mentah dulu untuk mencegah error JSON kosong
        
        if (profileRes.ok && rawText.trim() !== "") {
            const profileData = JSON.parse(rawText);
            currentUserName = profileData.user?.nama_lengkap || profileData.user?.name || 'Pengguna';
            currentUserRole = profileData.user?.role || 'mahasiswa';
        } else {
            console.warn('API Profil kosong. Lanjut pakai nama Pengguna default.');
        }
    } catch (e) {
        console.warn('Tidak bisa fetch user profile (berjalan di localhost tanpa backend):', e);
    }

    // ==========================================
    // 0.5. STATE MANAGEMENT (MEMORI PERCAKAPAN)
    // ==========================================
    let chatHistory = [];
    const MAX_HISTORY_LENGTH = 6; 

    function saveToMemory(sender, text) {
        chatHistory.push({ role: sender, content: text });
        if (chatHistory.length > MAX_HISTORY_LENGTH) {
            chatHistory.shift(); 
        }
    }
    
    // ==========================================
    // 1. KONFIGURASI API & INSTRUKSI SISTEM
    // ==========================================
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
        return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    }

    const SYSTEM_INSTRUCTION = `Anda adalah Dr. Visage AI, asisten medis virtual spesialis kesehatan mata dari platform Visage Metrics.
ATURAN KETAT YANG TIDAK BOLEH DILANGGAR:
1. Jawab pertanyaan pengguna secara spesifik sesuai topik kesehatan mata, kelelahan visual (Digital Eye Strain), dan ergonomi belajar di perpustakaan.
2. Jika pengguna melanjutkan obrolan sebelumnya, jawab dengan natural sesuai konteks.
3. Jika pengguna jelas-jelas bertanya tentang hal di luar topik (misal: resep masakan, cuaca), tolak dengan sopan: "Maaf, sebagai Dr. Visage AI, saya hanya diprogram untuk mendiskusikan kesehatan mata dan kelelahan visual."
4. Jangan menambahkan pengantar panjang; fokus pada rekomendasi praktis.
5. Gunakan bahasa Indonesia profesional dan empatik.
6. DILARANG KERAS menggunakan simbol asterisk (*), hashtag (#), atau markdown tebal karena merusak sistem Text-to-Speech klien.`;

    const eyeKeywords = [
        "mata","perih","lelah","kelelahan","kabur","silau","pusing","layar","laptop","monitor","handphone",
        "smartphone","tablet","membaca","buku","perpustakaan","kerja","tugas","belajar","ergonomi",
        "istirahat","kelopak","kering","pandangan","komputer","visi","nyeri","digital eye strain",
        "postur","kacamata","fokus","skripsi","makalah","fatigue","panda","bengkak","merah","iritasi",
        "sensasi","keluhan","gejala","kesehatan","medis","dokter","konsultasi","terapi","treatment"
    ];

    function getStaticAnswer(normalizedPrompt) {
        const promptLower = normalizedPrompt.toLowerCase();
        if (/\b(membaca|buku|perpustakaan|belajar|tugas|skripsi|makalah|catatan)\b/.test(promptLower)) {
            return "Saat membaca atau belajar lama, jaga jarak buku atau layar minimal 40-50 cm dari mata dan lakukan istirahat singkat setiap 20 menit. Coba aturan 20-20-20: setiap 20 menit, lihat objek sejauh 6 meter selama 20 detik.";
        }
        return "Mata lelah saat membaca atau berada di perpustakaan umumnya dapat diatasi dengan istirahat teratur, pencahayaan yang tepat, dan memastikan jarak pandang yang nyaman. Jika keluhan berlanjut, konsultasikan dengan tenaga medis.";
    }

    // ==========================================
    // 2. REFERENSI DOM & SANITASI TEKS
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

    // FUNGSI BARU: Sanitasi HTML untuk mencegah teks terpotong oleh simbol matematika (<, >)
    function formatTextSafe(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;') 
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>'); 
    }

    // ==========================================
    // 3 & 4. PENGATURAN GAYA BUBBLE & UPDATE UI
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
                
                // PENERAPAN SANITASI TEKS DI SINI
                bubbleContent.innerHTML = formatTextSafe(text);
                bubbleContent.scrollTop = 0; 
            }

            bubbleContainer.classList.remove('bubble-hidden');
            bubbleContainer.classList.add('bubble-visible');
        }, 400); 
    }

    // ==========================================
    // 5. FUNGSI FETCH API GEMINI TERBARU (INTI OTAK)
    // ==========================================
    async function getAIResponse(prompt) {
        const normalizedPrompt = prompt.trim();
        if (!normalizedPrompt) return "Silakan tulis pertanyaan tentang kesehatan mata supaya Dr. Visage dapat membantu.";

        if (chatHistory.length === 0) {
            const isRelated = eyeKeywords.some(keyword => normalizedPrompt.toLowerCase().includes(keyword));
            if (!isRelated) {
                return `Maaf ${currentUserName}, sebagai Dr. Visage AI, saya hanya diprogram untuk mendiskusikan masalah kesehatan mata dan kelelahan visual.`;
            }
        }

        saveToMemory('User', normalizedPrompt);

        let historyText = chatHistory.map(chat => `${chat.role === 'User' ? currentUserName : 'Dr. Visage'}: ${chat.content}`).join('\n');
        const fullPrompt = `${SYSTEM_INSTRUCTION}\n\nKonteks Pengguna: Nama pengguna adalah ${currentUserName}, seorang ${currentUserRole}.\n\nRiwayat Obrolan:\n${historyText}\n\nBerikan balasan Dr. Visage selanjutnya:`;

        if (!Array.isArray(GEMINI_API_KEYS) || GEMINI_API_KEYS.length === 0) {
            return getStaticAnswer(normalizedPrompt);
        }

        // FUNGSI BARU: Payload JSON lengkap dengan Bypass Sensor Medis Google
        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: fullPrompt }]
                }
            ],
            safetySettings: [
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ],
            generationConfig: {
                temperature: 0.4, 
                maxOutputTokens: 512, // Ditingkatkan agar jawaban medis tidak gampang terpotong
                topP: 0.8
            }
        };

        for (let model of GEMINI_MODELS) {
            const url = buildGeminiEndpoint(model);
            try {
                const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestBody)
                });

                // ANTI CRASH: Baca sebagai teks mentah dulu
                const rawGeminiText = await res.text(); 

                // === PASANG RADAR DETEKSI DI SINI ===
                console.log("=== HASIL RONTGEN AI ===");
                console.log("1. Alasan AI Berhenti:", data?.candidates?.[0]?.finishReason);
                console.log("2. Teks Mentah dari Server:", data?.candidates?.[0]?.content?.parts?.[0]?.text);
                console.log("========================");
                
                if (!rawGeminiText.trim()) {
                    console.warn(`Respons dari model ${model} kosong.`);
                    continue; 
                }

                const data = JSON.parse(rawGeminiText); 
                
                if (res.ok) {
                    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

                    if (answer) {
                        let finalAnswer = answer.trim();
                        saveToMemory('AI', finalAnswer);
                        return finalAnswer;
                    }
                }

                if (res.status === 404) {
                    console.warn(`Model API ${model} tidak ditemukan, mencoba fallback...`);
                    continue;
                }
                console.warn('Gemini error response:', res.status, data);

            } catch (e) {
                console.error("Kesalahan jaringan API:", e);
            }
        }

        return getStaticAnswer(normalizedPrompt);
    }

    // ==========================================
    // 6 & 7. ANIMASI, TTS & EVENT LISTENER
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