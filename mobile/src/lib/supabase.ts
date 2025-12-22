import 'react-native-url-polyfill';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// TODO: Replace these with your actual Supabase credentials
// You can get these from your .env file (VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY)
const SUPABASE_URL = 'https://kyuaxjkokntdmcxjurhm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dWF4amtva250ZG1jeGp1cmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNTA5OTgsImV4cCI6MjA4MTkyNjk5OH0.MF7qrOQsvRvDzl1DKm7w9tnUYUN16sudyLVMdh1qzwM';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

export const isSupabaseConfigured = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
