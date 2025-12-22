// Rate limiting helper for Supabase Edge Functions
// Uses Supabase to track request counts per IP/user

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

interface RateLimitConfig {
    windowMs: number;      // Time window in milliseconds
    maxRequests: number;   // Max requests per window
    identifier: string;    // IP, user_id, or custom identifier
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
}

// Simple in-memory rate limiter (per instance)
// Note: In serverless, each instance has its own memory, so this is approximate
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const key = `${config.identifier}`;

    const existing = requestCounts.get(key);

    if (!existing || now > existing.resetAt) {
        // New window
        requestCounts.set(key, {
            count: 1,
            resetAt: now + config.windowMs
        });
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetAt: new Date(now + config.windowMs)
        };
    }

    if (existing.count >= config.maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: new Date(existing.resetAt)
        };
    }

    existing.count++;
    return {
        allowed: true,
        remaining: config.maxRequests - existing.count,
        resetAt: new Date(existing.resetAt)
    };
}

// Default configurations for different endpoints
export const RATE_LIMITS = {
    // Payment creation: 5 requests per minute per user
    payment: { windowMs: 60000, maxRequests: 5 },

    // Account creation: 3 requests per hour per IP
    accountCreation: { windowMs: 3600000, maxRequests: 3 },

    // Refund: 10 requests per hour per user
    refund: { windowMs: 3600000, maxRequests: 10 },

    // General API: 100 requests per minute per user
    general: { windowMs: 60000, maxRequests: 100 },
};

// Helper to get client IP from request
export function getClientIP(req: Request): string {
    return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
        || req.headers.get('x-real-ip')
        || 'unknown';
}
