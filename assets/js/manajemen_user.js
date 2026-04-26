// File: assets/js/manajemen_user.js

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. LOGIKA TOMBOL TAMBAH USER ---
    const btnTambah = document.getElementById('btn-tambah-user');
    if (btnTambah) {
        btnTambah.addEventListener('click', () => {
            // Dalam implementasi nyata, ini akan membuka Modal HTML atau pindah ke halaman form.
            alert("Sistem: Membuka Form Tambah Pengguna Baru...\n(Fitur ini akan terhubung dengan fungsi Supabase 'auth.admin.createUser')");
        });
    }

    // --- 2. LOGIKA TOMBOL HAPUS USER ---
    // Menggunakan querySelectorAll karena tombol hapus ada banyak di dalam tabel
    const btnHapusList = document.querySelectorAll('.btn-hapus-user');
    btnHapusList.forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Mencegah klik menyebar ke elemen lain
            e.preventDefault(); 
            
            // Mencari elemen <tr> (baris tabel) terdekat dari tombol yang diklik
            const barisTabel = this.closest('tr');
            
            // Mengambil nama user dari kolom ke-2 untuk konfirmasi
            const namaUser = barisTabel.querySelector('td:nth-child(2) p.font-bold').innerText;

            // Memunculkan dialog konfirmasi bawaan browser
            const konfirmasi = confirm(`Tindakan Kritis: Apakah Anda yakin ingin menghapus data kredensial untuk "${namaUser}"? Data tidak dapat dipulihkan.`);
            
            if (konfirmasi) {
                // Efek visual menghapus baris (fade out lalu remove)
                barisTabel.style.transition = "all 0.4s ease";
                barisTabel.style.opacity = "0";
                barisTabel.style.transform = "translateX(20px)";
                
                setTimeout(() => {
                    barisTabel.remove();
                    // Simulasi pesan sukses
                    console.log(`[Supabase Log] Akses pengguna ${namaUser} berhasil dicabut.`);
                }, 400);
            }
        });
    });

    // --- 3. LOGIKA PENCARIAN (SIMULASI) ---
    const searchInput = document.getElementById('search-user');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            // Jika user menekan tombol Enter
            if (e.key === 'Enter') {
                const keyword = this.value;
                if(keyword !== "") {
                    console.log(`[Query] Menjalankan pencarian database untuk: "${keyword}"`);
                    // Logika filter tabel ditaruh di sini nanti
                }
            }
        });
    }

});