// @ts-nocheck - Deno Edge Function utility
// Shared CORS utility for Supabase Edge Functions
// This file provides secure CORS handling with environment-aware defaults

// Default production origins - add your production domains here
const DEFAULT_PRODUCTION_ORIGINS = [
    'https://vrumi.com.br',
    'https://www.vrumi.com.br',
    'https://app.vrumi.com.br',
    // Supabase project URL
    'https://kyuaxjkokntdmcxjurhm.supabase.co',
];

// Development origins - only used when ENVIRONMENT !== 'production'
const DEV_PATTERNS = [
    'localhost',
    '127.0.0.1',
    'exp://',  // Expo development
    'http://192.168.',  // Local network for mobile testing
];

interface CorsResult {
    headers: Record<string, string>;
    allowed: boolean;
}

/**
 * Get CORS headers with secure defaults
 * 
 * Behavior:
 * - Production: Only allows origins in ALLOWED_ORIGINS or DEFAULT_PRODUCTION_ORIGINS
 * - Development: Also allows localhost and local network IPs
 * - Empty ALLOWED_ORIGINS in production: Falls back to DEFAULT_PRODUCTION_ORIGINS (not wildcard)
 */
export const getSecureCors = (req: Request): CorsResult => {
    const origin = req.headers.get('origin') || '';
    const environment = Deno.env.get('ENVIRONMENT') || 'development';
    const isProduction = environment === 'production';

    // Get configured allowed origins
    const configuredOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    // Build allowed list based on environment
    let allowedList: string[];

    if (isProduction) {
        // Production: Use configured origins, or fall back to safe defaults
        allowedList = configuredOrigins.length > 0
            ? configuredOrigins
            : DEFAULT_PRODUCTION_ORIGINS;
    } else {
        // Development: Be more permissive
        allowedList = configuredOrigins.length > 0
            ? configuredOrigins
            : []; // Empty means check dev patterns below
    }

    // Check if origin is allowed
    let allowed = false;

    if (allowedList.length > 0) {
        allowed = allowedList.includes(origin);
    } else if (!isProduction) {
        // Development fallback: allow dev patterns
        allowed = DEV_PATTERNS.some(pattern => origin.includes(pattern)) || origin === '';
    }

    const headers = {
        'Access-Control-Allow-Origin': allowed ? origin : '',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    };

    return { headers, allowed };
};

/**
 * Legacy getCors for backward compatibility during migration
 * Use getSecureCors for new functions
 */
export const getCors = getSecureCors;
