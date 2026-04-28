// assets/js/supabaseClient.js
// Inisialisasi Supabase client
// Jangan commit file ini ke repo publik jika menyimpan kunci rahasia

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://matupwbsbobphzumkljw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-O-jVHa8P8LKAnz4Q-SPYg_DVVGwE6f';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
