import 'react-native-url-polyfill/polyfill';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// TODO: Replace these with your actual Supabase credentials
// You can get these from your .env file (VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY)
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

export const isSupabaseConfigured = !!SUPABASE_URL && SUPABASE_URL !== 'YOUR_SUPABASE_URL';
