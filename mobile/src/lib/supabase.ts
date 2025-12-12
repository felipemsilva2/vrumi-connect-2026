import 'react-native-url-polyfill';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// TODO: Replace these with your actual Supabase credentials
// You can get these from your .env file (VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY)
const SUPABASE_URL = 'https://owtylihsslimxdiovxia.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93dHlsaWhzc2xpbXhkaW92eGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODAyMDksImV4cCI6MjA3Nzc1NjIwOX0.rq-v6F39L39DX5AoGTfv12puiLELoB0TIp59g44XrP4';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

export const isSupabaseConfigured = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
