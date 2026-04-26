// File: assets/js/asisten_ai.js

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. KONFIGURASI API (Dengan Fallback 'latest')
    // ==========================================
    const API_KEY = "AIzaSyBN5jHuxea67wSEKjG8nLy6aZiPA5elfCw"; 
    
    const ENDPOINTS = [
        // Prioritas Utama: Gemini 3 Flash Preview
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`,
        
        // Cadangan 1: Gemini 2.5 Flash (Stabil & Cepat)
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        
        // Cadangan 2: Gemini 2.0 Flash (Paling Stabil buat benteng terakhir)
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`
    ];

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
                bubbleContent.scrollTop = 0; // Reset scroll ke paling atas
            }

            bubbleContainer.classList.remove('bubble-hidden');
            bubbleContainer.classList.add('bubble-visible');
        }, 400); 
    }

    // ==========================================
    // 5. FUNGSI FETCH API GEMINI
    // ==========================================
    async function getAIResponse(prompt) {
        const context = "Kamu Dr. Visage, asisten medis AI dari Telkom Purwokerto. Jawab singkat maksimal 2 paragraf, ramah, bahasa Indonesia, tanpa simbol bintang (*). Pertanyaan: " + prompt;
        
        for(let url of ENDPOINTS) {
            try {
                const res = await fetch(url, { 
                    method: "POST", 
                    headers: { "Content-Type": "application/json" }, 
                    body: JSON.stringify({ contents: [{ parts: [{ text: context }] }] }) 
                });
                
                if(res.ok) {
                    const data = await res.json();
                    return data.candidates[0].content.parts[0].text;
                }
                
                if(res.status === 404) {
                    console.warn("Model API tidak ditemukan, mencoba fallback...");
                    continue; // Coba endpoint berikutnya
                }
            } catch(e) { 
                console.error("Kesalahan jaringan:", e); 
            }
        }
        return "Maaf Wisnu, koneksi otak saya ke server pusat terputus. Pastikan kamu terhubung ke jaringan internet yang stabil.";
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