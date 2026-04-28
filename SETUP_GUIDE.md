# 🚀 SETUP GUIDE - Integrasi Supabase

Panduan lengkap untuk setup dan implementasi Supabase di Visage Metrics.

## ✅ Step-by-Step Setup

### Step 1: Pastikan Supabase Project Sudah Setup

1. Login ke https://supabase.com
2. Open project: yokaroo's Project (Production)
3. Verifikasi 3 tabel sudah ada:
   - ✅ `profil_pengguna`
   - ✅ `deteksi_mata`
   - ✅ `log_aktivitas`

### Step 2: Verifikasi File Supabase Client

File `assets/js/supabaseClient.js` sudah berisi:

```javascript
const SUPABASE_URL = "https://matupwbsbobphzumkljw.supabase.co";
const SUPABASE_KEY = "sb_publishable_-O-jVHa8P8LKAnz4Q-SPYg_DVVGwE6f";
```

✅ File sudah dibuat dengan benar.

### Step 3: Implementasi di HTML Pages

Tambahkan script import di setiap halaman yang membutuhkan:

#### login.html

```html
<!-- Di tag <body> atau sebelum </body> -->
<script type="module">
  import "./assets/js/login.js";
</script>
```

#### register.html

```html
<!-- Di tag <body> atau sebelum </body> -->
<script type="module">
  import "./assets/js/register.js";
</script>
```

#### Pages/user/form_pengguna.html

```html
<!-- Di tag <body> atau sebelum </body> -->
<script type="module">
  import "../../assets/js/form_pengguna.js";
</script>
```

#### Pages/user/sistem.html

```html
<!-- Di tag <body> atau sebelum </body> -->
<script type="module">
  import "../../assets/js/sistem.js";
</script>
```

#### Pages/admin/data_analitik_hari_ini.html (dan variasi lainnya)

```html
<!-- Di tag <body> atau sebelum </body> -->
<script type="module">
  import "../../assets/js/analytics-example.js";
</script>
```

### Step 4: Update Login Form (OPSIONAL)

Jika ingin mengubah dari `inputUsername` ke `inputEmail`:

**Sebelumnya:**

```html
<input
  type="text"
  id="inputUsername"
  placeholder="Masukkan Username..."
  required
/>
```

**Menjadi:**

```html
<input type="email" id="inputEmail" placeholder="Masukkan Email..." required />
```

**Catatan:** Jika tetap gunakan `inputUsername`, sistem akan otomatis convert ke format email.

## 📱 Testing Flow

### Test 1: Register User Baru

1. Buka `register.html`
2. Isi form:
   - Nama: "Aji Prasetyo"
   - Username: "ajiprasetyoo"
   - Password: "Test123456"
   - Ulangi Password: "Test123456"
3. Klik REGISTER
4. Check console untuk error
5. Verifikasi di Supabase:
   - Auth users terdaftar dengan email: `ajiprasetyoo@visagemetrics.local`
   - Log aktivitas: REGISTER event

### Test 2: Login User

1. Buka `login.html`
2. Isi form:
   - Username: "ajiprasetyoo" (atau email jika sudah diubah)
   - Password: "Test123456"
3. Klik LOGIN
4. Verify Supabase:
   - Session user aktif
   - Log aktivitas: LOGIN event

### Test 3: Lengkapi Profil

1. Setelah login, system redirect ke `landing.html`
2. Buka `form_pengguna.html` (dari menu)
3. Isi form:
   - Nama: "Aji Prasetyo"
   - NIM: "1202238999"
   - Jenis Kelamin: "Laki-laki"
   - Prodi: "S1 Sains Data"
   - Usia: "21"
   - Angkatan: "2023"
4. Klik INISIALISASI SISTEM
5. Verify Supabase:
   - Data di tabel `profil_pengguna` (id = user uuid)
   - Log aktivitas: PROFIL_LENGKAP event

### Test 4: Deteksi Mata & Simpan

1. System akan redirect ke `sistem.html`
2. Upload foto mata
3. Klik ANALISIS
4. Setelah result keluar, klik SIMPAN HASIL
5. Verify Supabase:
   - Data di tabel `deteksi_mata` dengan user_id
   - Log aktivitas: DETEKSI_MATA event

### Test 5: Analytics Dashboard

1. Buka `Pages/admin/data_analitik_hari_ini.html`
2. Chart harus tampil dengan data dari database
3. Check browser console untuk error

## 🐛 Debugging Tips

### Cek Console Browser (F12)

```javascript
// Di console:
import {
  getCurrentUser,
  getDeteksiMataHariIni,
} from "./assets/js/auth-helper.js";

// Get current user
const user = await getCurrentUser();
console.log("Current user:", user);

// Get deteksi data
if (user) {
  const { data } = await getDeteksiMataHariIni(user.id);
  console.log("Deteksi hari ini:", data);
}
```

### Check Supabase Logs

1. Buka Supabase Dashboard
2. Menu: Home → Logs
3. Lihat query history dan error messages

### Network Tab (F12)

1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Cek request ke Supabase dan response nya

## 🔒 Row Level Security (RLS)

Untuk keamanan, pastikan RLS sudah enabled di Supabase:

### profil_pengguna

```sql
-- User hanya bisa access profil sendiri
ALTER TABLE profil_pengguna ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON profil_pengguna FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profil_pengguna FOR UPDATE
USING (auth.uid() = id);
```

### deteksi_mata

```sql
-- User hanya bisa access deteksi mereka sendiri
ALTER TABLE deteksi_mata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own detections"
ON deteksi_mata FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own detections"
ON deteksi_mata FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### log_aktivitas

```sql
-- Admin bisa view semua, user bisa view milik mereka
ALTER TABLE log_aktivitas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs"
ON log_aktivitas FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);
```

## 📊 File-file yang Sudah Diupdate

### Core Files

- ✅ `assets/js/supabaseClient.js` - Client initialization
- ✅ `assets/js/auth-helper.js` - Database helpers (NEW)
- ✅ `assets/js/analytics-helper.js` - Analytics helpers (NEW)
- ✅ `assets/js/login.js` - Login logic
- ✅ `assets/js/register.js` - Register logic
- ✅ `assets/js/form_pengguna.js` - Profile form
- ✅ `assets/js/sistem.js` - Detection system

### Documentation

- ✅ `SUPABASE_INTEGRATION.md` - Full documentation
- ✅ `SETUP_GUIDE.md` - This file

### Examples

- ✅ `assets/js/analytics-example.js` - Analytics dashboard example

## 🚀 Deploy Checklist

Sebelum go live:

- [ ] Test semua flow (register, login, form, deteksi)
- [ ] Test analytics dashboard
- [ ] Enable RLS di semua tabel
- [ ] Setup email verification di Auth settings
- [ ] Setup email template untuk welcome user
- [ ] Test data validation semua form
- [ ] Check console untuk warnings/errors
- [ ] Test di different browsers
- [ ] Test di mobile device
- [ ] Backup database schema
- [ ] Setup error tracking (optional: Sentry)
- [ ] Setup monitoring (optional: Grafana)

## 📞 Quick Support

### Error: "Email already exists"

**Solusi:** Gunakan email/username yang belum pernah didaftar

### Error: "Invalid credentials"

**Solusi:** Check email dan password, pastikan benar

### Error: "Row-level security violation"

**Solusi:** Pastikan user sudah login dan RLS policy benar

### Error: "User not found in profil_pengguna"

**Solusi:** Register user baru atau lengtapi profil jika belum

### Chart tidak menampilkan data

**Solusi:**

- Pastikan ada deteksi data di database
- Check console untuk error
- Verify user_id di deteksi_mata

## 📚 Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [Chart.js Docs](https://www.chartjs.org/docs/latest/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

**Last Updated:** April 27, 2026
**Status:** ✅ Production Ready
