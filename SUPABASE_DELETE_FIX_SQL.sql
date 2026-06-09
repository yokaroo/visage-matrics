-- ========================================
-- SUPABASE RLS POLICY FIX untuk DELETE USER
-- ========================================

-- LANGKAH 1: DROP policy yang ada (jika ada)
DROP POLICY IF EXISTS "Admin can delete any profile" ON profil_pengguna;
DROP POLICY IF EXISTS "Allow delete profil" ON profil_pengguna;
DROP POLICY IF EXISTS "Allow admin delete profil" ON profil_pengguna;
DROP POLICY IF EXISTS "Allow delete deteksi_mata" ON deteksi_mata;
DROP POLICY IF EXISTS "Allow admin delete deteksi_mata" ON deteksi_mata;
DROP POLICY IF EXISTS "Allow delete log_aktivitas" ON log_aktivitas;

-- LANGKAH 2: DISABLE RLS untuk tabel yang perlu di-delete (REKOMENDASI untuk Development/Testing)
ALTER TABLE profil_pengguna DISABLE ROW LEVEL SECURITY;
ALTER TABLE deteksi_mata DISABLE ROW LEVEL SECURITY;
ALTER TABLE log_aktivitas DISABLE ROW LEVEL SECURITY;

-- ========================================
-- JIKA INGIN PAKAI RLS (Production), gunakan ini:
-- ========================================

-- UNCOMMENT di bawah jika mau enable RLS kembali dengan policy yang bekerja

-- ALTER TABLE profil_pengguna ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE deteksi_mata ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE log_aktivitas ENABLE ROW LEVEL SECURITY;

-- -- Buat policy DELETE untuk profil_pengguna
-- CREATE POLICY "Allow delete profil_pengguna" ON profil_pengguna
--   FOR DELETE USING (TRUE);

-- -- Buat policy DELETE untuk deteksi_mata
-- CREATE POLICY "Allow delete deteksi_mata" ON deteksi_mata
--   FOR DELETE USING (TRUE);

-- -- Buat policy DELETE untuk log_aktivitas
-- CREATE POLICY "Allow delete log_aktivitas" ON log_aktivitas
--   FOR DELETE USING (TRUE);

-- ========================================
-- Verifikasi
-- ========================================
-- Run query di bawah untuk verify status RLS:

SELECT tablename, 
       (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count,
       EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t.tablename AND rowsecurity = true) as rls_enabled
FROM pg_tables t
WHERE schemaname = 'public' 
AND tablename IN ('profil_pengguna', 'deteksi_mata', 'log_aktivitas');
