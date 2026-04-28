import { supabase } from './supabaseClient.js';

document.addEventListener("DOMContentLoaded", async function() {
    // --- EFEK NAVBAR SCROLL ---
    const nav = document.querySelector('nav');
    if(nav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                nav.classList.add('bg-white/95', 'shadow-md');
                nav.classList.remove('bg-white/80');
            } else {
                nav.classList.add('bg-white/80');
                nav.classList.remove('bg-white/95', 'shadow-md');
            }
        });
    }

    const userForm = document.getElementById('userDataForm');
    const errorMsg = document.getElementById('errorMsg');
    const btnSubmit = document.getElementById('btnSubmit');

    // 1. CEK AUTENTIKASI PENGGUNA
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!session) {
        alert("Akses ditolak! Anda harus login terlebih dahulu.");
        window.location.href = "../../login.html";
        return;
    }

    // 2. AMBIL DATA PROFIL (Pre-fill Form jika ada)
    const { data: profile } = await supabase
        .from('profil_pengguna')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

    if (profile) {
        if (document.getElementById('inputNama')) document.getElementById('inputNama').value = profile.nama_lengkap || '';
        if (document.getElementById('inputNIM')) document.getElementById('inputNIM').value = profile.nim || '';
        if (document.getElementById('inputGender')) document.getElementById('inputGender').value = profile.jenis_kelamin || '';
        if (document.getElementById('inputProdi')) document.getElementById('inputProdi').value = profile.prodi || '';
        if (document.getElementById('inputUsia') && profile.usia) document.getElementById('inputUsia').value = profile.usia;
        if (document.getElementById('inputAngkatan') && profile.angkatan) document.getElementById('inputAngkatan').value = profile.angkatan;
    }

    // --- 3. LOGIKA FORM SUBMIT ---
    if(userForm) {
        userForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            if (errorMsg) errorMsg.classList.add('hidden');
            
            const teksAsli = btnSubmit.innerHTML;
            btnSubmit.innerHTML = 'Memproses...';
            btnSubmit.disabled = true;

            const inputNama = document.getElementById('inputNama').value.trim();
            const inputNim = document.getElementById('inputNIM').value.trim();
            const inputGender = document.getElementById('inputGender').value;
            const inputProdi = document.getElementById('inputProdi').value.trim();
            const inputUsia = document.getElementById('inputUsia').value;
            const inputAngkatan = document.getElementById('inputAngkatan').value;

            try {
                // PERBAIKAN: Menambahkan status_akun agar sesuai dengan Schema Database
                const { error: upsertError } = await supabase
                    .from('profil_pengguna')
                    .upsert({
                        id: session.user.id, 
                        nama_lengkap: inputNama,
                        nim: inputNim,
                        jenis_kelamin: inputGender,
                        prodi: inputProdi,
                        usia: parseInt(inputUsia),
                        angkatan: parseInt(inputAngkatan),
                        status_akun: 'aktif', // <--- INI TAMBAHANNYA
                        role: 'mahasiswa' 
                    });

                if (upsertError) throw upsertError;

                localStorage.setItem('userName', inputNama);
                
                // Pindah ke sistem deteksi!
                window.location.href = "sistem.html";

            } catch (err) {
                if (errorMsg) {
                    errorMsg.innerText = "Gagal menyimpan data: " + err.message;
                    errorMsg.classList.remove('hidden');
                } else {
                    alert("Gagal: " + err.message);
                }
            } finally {
                btnSubmit.innerHTML = teksAsli;
                btnSubmit.disabled = false;
            }
        });
    }
});