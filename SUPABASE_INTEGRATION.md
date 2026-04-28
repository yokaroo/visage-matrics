# Integrasi Supabase - Visage Metrics

Dokumentasi lengkap integrasi Supabase dengan website Visage Metrics.

## 🔑 Konfigurasi Supabase

Link: https://matupwbsbobphzumkljw.supabase.co
Publishable Key: sb*publishable*-O-jVHa8P8LKAnz4Q-SPYg_DVVGwE6f

File konfigurasi: `assets/js/supabaseClient.js`

## 📁 File-file yang Telah Diintegrasikan

### 1. **assets/js/supabaseClient.js** ✅

- Inisialisasi Supabase client
- Menggunakan CDN dari jsDelivr untuk library Supabase

### 2. **assets/js/auth-helper.js** ✅ (BARU)

File helper berisi semua fungsi untuk database operations:

- `loginUser(email, password)` - Login user
- `registerUser(email, password)` - Register user baru
- `logoutUser()` - Logout
- `getCurrentUser()` - Dapatkan user yang sedang login
- `insertProfilPengguna(profileData)` - Insert profil user
- `insertDeteksiMata(detectionData)` - Insert hasil deteksi
- `insertLogAktivitas(logData)` - Insert log aktivitas
- `getDeteksiMata7Hari(userId)` - Query deteksi 7 hari terakhir
- `getDeteksiMata30Hari(userId)` - Query deteksi 30 hari terakhir
- Dan fungsi query lainnya untuk analytics

### 3. **assets/js/login.js** ✅ (DIUPDATE)

- Login menggunakan EMAIL & PASSWORD
- Support username dengan format: `username@visagemetrics.local`
- Log aktivitas otomatis setelah login
- Redirect ke landing page user

### 4. **assets/js/register.js** ✅ (DIUPDATE)

- Register menggunakan EMAIL & PASSWORD
- Convert username ke email format otomatis
- Validasi password minimal 6 karakter
- Log aktivitas registrasi

### 5. **assets/js/form_pengguna.js** ✅ (DIUPDATE)

- Insert profil lengkap ke tabel `profil_pengguna`
- Field yang tersimpan:
  - nim (required, unique)
  - nama_lengkap
  - jenis_kelamin
  - prodi
  - usia
  - angkatan
  - status_akun (default: 'aktif')
  - role (default: 'mahasiswa')
- Log aktivitas otomatis

### 6. **assets/js/sistem.js** ✅ (DIUPDATE)

- Insert hasil deteksi ke tabel `deteksi_mata`
- Field yang tersimpan:
  - user_id (dari current user)
  - blink_rate
  - eye_closure
  - head_tilt
  - status_mata (lelah/segar)
  - durasi_sesi
- Log aktivitas otomatis
- Button save dengan loading indicator

## 📋 Alur Kerja Sistem

### 1. Registrasi User

```
Register Page → Input (nama, username, password)
→ Convert username menjadi email@visagemetrics.local
→ Create user di Supabase Auth
→ Log: REGISTER
→ Redirect ke Login
```

### 2. Login User

```
Login Page → Input (username/email, password)
→ Convert username menjadi email jika perlu
→ Auth user di Supabase
→ Save session (localStorage/sessionStorage)
→ Log: LOGIN
→ Redirect ke Landing Page
```

### 3. Lengkapi Profil

```
Form Pengguna → Input (nama, nim, jenis_kelamin, prodi, usia, angkatan)
→ Get current user dari Supabase Auth
→ Insert profil ke tabel profil_pengguna (id = auth.uid)
→ Log: PROFIL_LENGKAP
→ Redirect ke Sistem.html
```

### 4. Deteksi Mata & Simpan

```
Sistem.html → Analisis foto mata
→ Extract data: blink_rate, eye_closure, head_tilt, status_mata
→ Click tombol SIMPAN
→ Get current user
→ Insert ke tabel deteksi_mata
→ Log: DETEKSI_MATA
→ Show success notification
```

## 🗄️ Struktur Database

### Tabel: profil_pengguna

```sql
- id (uuid, PK) → dari auth.uid()
- nim (text, unique, not null)
- nama_lengkap (text, not null)
- jenis_kelamin (text, not null)
- prodi (text, not null)
- usia (smallint, not null)
- angkatan (integer, not null)
- status_akun (text, default: 'aktif')
- role (text, default: 'mahasiswa')
```

### Tabel: deteksi_mata

```sql
- id (bigint, PK)
- user_id (uuid, FK → profil_pengguna.id)
- blink_rate (numeric, not null)
- eye_closure (numeric, not null)
- head_tilt (numeric, not null)
- status_mata (text, not null)
- durasi_sesi (integer, default: 0)
- created_at (timestamp, auto)
```

### Tabel: log_aktivitas

```sql
- id (bigint, PK)
- tipe_log (text, not null) → LOGIN, REGISTER, PROFIL_LENGKAP, DETEKSI_MATA
- deskripsi (text, not null)
- user_id (uuid, FK → profil_pengguna.id, nullable)
- created_at (timestamp, auto)
```

## ⚠️ PENTING: Ubah Form HTML

### login.html

Ubah input dari:

```html
<input type="text" id="inputUsername" ... />
```

Menjadi:

```html
<input type="email" id="inputEmail" ... />
```

Atau tetap gunakan `inputUsername`, sistem akan convert ke email otomatis.

### register.html

Sudah support:

- inputNama
- inputUsernameReg (akan convert ke email)
- inputPasswordReg
- inputRepassword

Tidak ada perubahan form yang diperlukan.

### form_pengguna.html

Sudah support semua field yang diperlukan:

- inputNama
- inputNIM
- inputGender (select: L/P)
- inputProdi
- inputUsia
- inputAngkatan

Tidak ada perubahan form yang diperlukan.

## 🚀 Cara Menggunakan

### Di halaman lain (analytics, dashboard, dll):

```javascript
// Import helper functions
import {
  getDeteksiMata7Hari,
  getDeteksiMata30Hari,
  getProfilPengguna,
  getCurrentUser,
  getLogAktivitasUser,
} from "./auth-helper.js";

// Dapatkan data deteksi 7 hari terakhir
const user = await getCurrentUser();
const { data: deteksiData, error } = await getDeteksiMata7Hari(user.id);

if (!error) {
  console.log("Deteksi mata 7 hari:", deteksiData);
  // Gunakan data untuk chart/analytics
}

// Dapatkan profil pengguna
const { data: profil, error: profilError } = await getProfilPengguna(user.id);
console.log("Nama:", profil.nama_lengkap);
console.log("NIM:", profil.nim);
```

## 🔐 Keamanan

- ✅ Kunci Supabase disimpan di file JS terpisah (`supabaseClient.js`)
- ✅ Tidak ada hardcode di HTML
- ✅ Menggunakan Row Level Security (RLS) di Supabase
- ✅ User hanya bisa akses data mereka sendiri
- ⚠️ Jangan commit `supabaseClient.js` ke repo publik

## 📊 Analytics Dashboard

Untuk menampilkan data analytics, gunakan fungsi:

```javascript
// Data 7 hari
const { data: data7 } = await getDeteksiMata7Hari(userId);

// Data 30 hari
const { data: data30 } = await getDeteksiMata30Hari(userId);

// Data hari ini
const { data: dataToday } = await getDeteksiMataHariIni(userId);

// Process data untuk chart
const statusCount = {};
dataToday.forEach((item) => {
  statusCount[item.status_mata] = (statusCount[item.status_mata] || 0) + 1;
});
```

## ✅ Testing Checklist

- [ ] Register user baru (convert username ke email)
- [ ] Login dengan username/email
- [ ] Lengkapi profil user
- [ ] Jalankan deteksi mata
- [ ] Simpan hasil deteksi
- [ ] Cek database di Supabase UI
- [ ] Buka analytics dashboard
- [ ] Verifikasi data tampil di chart

## 🆘 Troubleshooting

### Error: "User tidak ditemukan. Silakan login terlebih dahulu."

- Pastikan user sudah login sebelum submit form
- Cek localStorage/sessionStorage untuk session

### Error: "Table does not exist"

- Pastikan tabel sudah dibuat di Supabase
- Cek nama tabel (case-sensitive): profil_pengguna, deteksi_mata, log_aktivitas

### Error: "Unique constraint violation"

- NIM sudah terdaftar di database
- Gunakan NIM yang berbeda saat registrasi

### Chart tidak menampilkan data

- Pastikan ada data deteksi di database
- Cek console untuk error message
- Verifikasi user_id di deteksi_mata match dengan user yang login

## 📞 Support

Untuk question atau issue, check:

1. Console browser (F12) untuk error details
2. Supabase dashboard untuk data integrity
3. Network tab untuk API calls
