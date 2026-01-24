import 'react-native-url-polyfill';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const ExpoSecureStoreAdapter = {
    getItem: async (key: string) => {
        // Try getting a chunked value metadata
        const metadata = await SecureStore.getItemAsync(`${key}_metadata`);
        if (metadata) {
            const { chunks } = JSON.parse(metadata);
            let fullValue = '';
            for (let i = 0; i < chunks; i++) {
                const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
                if (chunk) fullValue += chunk;
            }
            return fullValue;
        }

        // Fallback to normal get (for small values or legacy)
        const secureValue = await SecureStore.getItemAsync(key);
        if (secureValue) return secureValue;

        // Migration for existing users: check AsyncStorage
        try {
            const asyncValue = await AsyncStorage.getItem(key);
            if (asyncValue) {
                // If found in Async, move to Secure (using the new setItem logic)
                await ExpoSecureStoreAdapter.setItem(key, asyncValue);
                await AsyncStorage.removeItem(key);
                return asyncValue;
            }
        } catch (e) {
            // Ignore error
        }
        return null;
    },
    setItem: async (key: string, value: string) => {
        // Android SecureStore has a 2048 bytes limit per entry.
        // We split the value if it exceeds a safe threshold (e.g. 2000 chars).
        const MAX_CHUNK_SIZE = 2000;

        if (value.length > MAX_CHUNK_SIZE) {
            const chunks = Math.ceil(value.length / MAX_CHUNK_SIZE);
            for (let i = 0; i < chunks; i++) {
                const chunk = value.slice(i * MAX_CHUNK_SIZE, (i + 1) * MAX_CHUNK_SIZE);
                await SecureStore.setItemAsync(`${key}_chunk_${i}`, chunk);
            }
            await SecureStore.setItemAsync(`${key}_metadata`, JSON.stringify({ chunks }));
            // Clean up potentially existing single key to avoid confusion
            await SecureStore.deleteItemAsync(key);
        } else {
            // Small enough, store directly
            await SecureStore.setItemAsync(key, value);
            // Clean up potential metadata/chunks if shrinking
            await SecureStore.deleteItemAsync(`${key}_metadata`);
        }
    },
    removeItem: async (key: string) => {
        // Check for metadata to remove chunks
        const metadata = await SecureStore.getItemAsync(`${key}_metadata`);
        if (metadata) {
            const { chunks } = JSON.parse(metadata);
            for (let i = 0; i < chunks; i++) {
                await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
            }
            await SecureStore.deleteItemAsync(`${key}_metadata`);
        }

        // Remove normal key
        await SecureStore.deleteItemAsync(key);
        await AsyncStorage.removeItem(key);
    },
};




const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('CRITICAL: Supabase environment variables are missing!');
    console.log('Available process.env keys:', Object.keys(process.env).filter(k => k.startsWith('EXPO_PUBLIC_')));
}

const FINAL_URL = SUPABASE_URL || 'https://setup-supabase.com';
const FINAL_KEY = SUPABASE_ANON_KEY || 'setup-supabase';

if (FINAL_URL === 'https://setup-supabase.com') {
    console.warn('WARNING: Using Supabase placeholder URL. Persistence will be lost between environment changes.');
}

export const supabase = createClient<Database>(FINAL_URL, FINAL_KEY, {
    auth: {
        storage: ExpoSecureStoreAdapter,
        storageKey: 'vrumi-auth-token', // Explicit key for consistency
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

export const isSupabaseConfigured = !!SUPABASE_URL && SUPABASE_URL !== 'https://setup-supabase.com';
