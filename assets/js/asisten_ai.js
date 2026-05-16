// IMPORT API KEY DARI FILE RAHASIA
import { GEMINI_API_KEY } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. KONFIGURASI API & INSTRUKSI SISTEM KETAT
    // ==========================================
    
    // Fallback Endpoint: Jika model preview mati, sistem akan turun ke model stabil
    const ENDPOINTS = [
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateText?key=${GEMINI_API_KEY}`,
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateText?key=${GEMINI_API_KEY}`,
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateText?key=${GEMINI_API_KEY}`,
        // Backup paling aman jika model terbaru error/dihapus google:
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateText?key=${GEMINI_API_KEY}`
    ];

    // INSTRUKSI KETAT (GUARDRAIL) UNTUK AI
    const SYSTEM_INSTRUCTION = `Anda adalah Dr. Visage AI, asisten medis virtual spesialis kesehatan mata dari platform Visage Metrics.
ATURAN KETAT YANG TIDAK BOLEH DILANGGAR:
1. Jawab pertanyaan pengguna secara langsung dan spesifik sesuai topik kesehatan mata, kelelahan mata (Digital Eye Strain), penglihatan, dan ergonomi layar.
2. Jika pengguna bertanya tentang hal di luar topik kesehatan mata, jawab dengan sopan: "Maaf, sebagai Dr. Visage AI, saya hanya diprogram untuk mendiskusikan masalah kesehatan mata dan kelelahan visual."
3. Jangan menambahkan informasi tidak relevan atau pengantar panjang; fokus pada solusi konkret atau jawaban langsung.
4. Gunakan bahasa Indonesia yang profesional, empatik, mudah dimengerti oleh mahasiswa.
5. Jawab maksimal dalam 2 paragraf pendek.
6. Jangan gunakan simbol asterisk (*), markdown tebal, atau format kode karena akan dibaca oleh Text-to-Speech.`;

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
    
    const styleUser = {
        box: 'bg-sky-500 border-sky-400 rounded-3xl lg:rounded-tr-none shadow-[0_15px_40px_rgba(14,165,233,0.3)] text-white',
        tail: 'bg-sky-500 border-sky-400 rotate-45 -bottom-2.5 left-1/2 -translate-x-1/2 lg:rotate-45 lg:-right-3 lg:top-1/2 lg:-translate-y-1/2 lg:left-auto lg:translate-x-0',
        labelHtml: '<span class="text-[10px] font-black text-sky-200 uppercase tracking-widest">Wisnu (Anda)</span>'
    };

    // ==========================================
    // 4. FUNGSI UPDATE UI BUBBLE
    // ==========================================
    function updateBubble(sender, text, isTyping = false) {
        if (!bubbleContainer) return;

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
    
    // Kata Kunci Sederhana Untuk Pengecekan Awal
    const eyeKeywords = ["mata", "perih", "lelah", "kabur", "silau", "pusing", "layar", "kacamata", "tidur", "istirahat", "rabun", "ear", "visage"];

    async function getAIResponse(prompt) {
        const normalizedPrompt = prompt.trim();
        if (!normalizedPrompt) return "Silakan tulis pertanyaan tentang kesehatan mata supaya Dr. Visage dapat membantu.";

        const isRelated = eyeKeywords.some(keyword => normalizedPrompt.toLowerCase().includes(keyword));
        if (!isRelated) {
            return "Maaf, sebagai Dr. Visage AI, saya hanya diprogram untuk mendiskusikan masalah kesehatan mata dan kelelahan visual.";
        }

        const fullPrompt = `${SYSTEM_INSTRUCTION}\n\nPertanyaan Pengguna: ${normalizedPrompt}\n\nJawaban:`;

        if (!GEMINI_API_KEY || GEMINI_API_KEY.trim().length === 0) {
            return "Maaf, kunci API Dr. Visage belum dikonfigurasi. Hubungi administrator untuk mengaktifkan layanan.";
        }

        const contentRequestBody = {
            content: [{ type: 'text', text: fullPrompt }],
            temperature: 0.2,
            maxOutputTokens: 384,
            topP: 0.8,
            candidateCount: 1
        };

        const textRequestBody = {
            prompt: { text: fullPrompt },
            temperature: 0.2,
            maxOutputTokens: 384,
            topP: 0.8,
            candidateCount: 1
        };

        for (let url of ENDPOINTS) {
            try {
                const isTextEndpoint = url.includes(':generateText');
                const body = isTextEndpoint ? JSON.stringify(textRequestBody) : JSON.stringify(contentRequestBody);
                const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body
                });

                const data = await res.json();
                if (res.ok) {
                    const answer = data?.candidates?.[0]?.content?.[0]?.text
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

        return "Maaf Wisnu, koneksi sistem Dr. Visage ke server pusat sedang terputus. Pastikan Anda terhubung ke jaringan internet.";
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