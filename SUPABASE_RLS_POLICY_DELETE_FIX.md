# Supabase RLS Policy untuk Admin Delete User

## Problem

Tombol delete di admin panel mengembalikan success notification tapi akun masih ada di database. Kemungkinan penyebab:

- RLS (Row Level Security) policy tidak mengizinkan service role key untuk delete
- Atau policy terlalu ketat membatasi delete operation

## Solution

Anda perlu **disable RLS atau buat policy yang mengizinkan admin delete**. Ada 2 pilihan:

### Pilihan 1: Disable RLS (Rekomendasi untuk Development)

Jika aplikasi masih dalam tahap development, bisa disable RLS:

1. Buka **Supabase Dashboard**
2. Pilih Database → Tables
3. Untuk setiap table yang perlu diakses admin (`profil_pengguna`, `deteksi_mata`, `log_aktivitas`):
   - Klik table name
   - Pilih tab **Authentication** (atau **Security**)
   - Toggle off **Row Level Security (RLS)**

Kemudian **restart Flask server**:

```bash
cd d:\Yoka\visage-matrics\visage-matrics
python app.py
```

### Pilihan 2: Buat RLS Policy Untuk Admin (Rekomendasi untuk Production)

Jika ingin tetap pakai RLS, buat policy yang mengizinkan service role key:

#### A. Untuk table `profil_pengguna`:

Buka **Supabase Dashboard** → Database → SQL Editor → paste kode berikut:

```sql
-- Policy untuk allow service role delete di profil_pengguna
CREATE POLICY "Allow admin delete profil" ON profil_pengguna
  FOR DELETE USING (TRUE);

-- Atau jika lebih ketat, hanya izinkan dengan role='admin':
CREATE POLICY "Admin can delete any profile" ON profil_pengguna
  FOR DELETE USING (
    (select auth.jwt() ->> 'role')::text = 'admin' OR
    -- Service role bypass RLS
    current_user_id() IS NULL
  );
```

#### B. Untuk table `deteksi_mata`:

```sql
CREATE POLICY "Allow admin delete deteksi_mata" ON deteksi_mata
  FOR DELETE USING (TRUE);
```

#### C. Untuk table `log_aktivitas`:

```sql
CREATE POLICY "Allow admin delete log_aktivitas" ON log_aktivitas
  FOR DELETE USING (TRUE);
```

## Testing

1. Setelah update RLS policy atau disable RLS, **restart Flask server**:

```bash
python app.py
```

2. Buka admin panel: `http://127.0.0.1:5000/admin/manajemen_user.html`

3. Klik tombol **Hapus** pada salah satu user

4. **Check Flask console logs** untuk output debug:
   - Cari output seperti: `[DEBUG] Profile delete result:`
   - Lihat apakah ada error message

5. **Cek Supabase Dashboard** → Data/Browser untuk verifikasi user sudah terhapus

## Debugging

Jika masih gagal, check:

1. **Flask Console Log** - cari warning/error message
2. **Supabase Dashboard** → Logs → RLS Debugging
3. **Network Tab di Browser DevTools** - cek response dari endpoint
4. **Pastikan SUPABASE_SERVICE_ROLE_KEY di-set dengan benar di `.env`**

## Quick Test Script (Optional)

Jika ingin test delete secara manual via Supabase client:

```javascript
// Buka browser console dan test delete
import { supabase } from "./supabaseClient.js";

// Test delete deteksi_mata
const { error: err1 } = await supabase
  .from("deteksi_mata")
  .delete()
  .eq("user_id", "target_user_id");
console.log("Delete deteksi_mata:", err1);

// Test delete profil_pengguna
const { error: err2 } = await supabase
  .from("profil_pengguna")
  .delete()
  .eq("id", "target_user_id");
console.log("Delete profil:", err2);
```

## Konfigurasi yang Sudah Dilakukan di Backend

Backend sudah disiapkan dengan:

- ✅ Service role key untuk bypass RLS
- ✅ Cascade delete (hapus deteksi_mata + log_aktivitas + profil)
- ✅ Validation (admin check, prevent self-delete)
- ✅ Session-based auth
- ✅ Error handling dan logging

Yang tinggal adalah **RLS policy di Supabase** yang harus disesuaikan.

## Next Steps

1. **Pilih Pilihan 1 atau 2** di atas
2. **Restart Flask server**
3. **Test delete** di admin panel
4. **Report hasilnya** (berhasil atau masih error)
