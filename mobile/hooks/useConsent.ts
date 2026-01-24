import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase URL with fallback (same as used in supabase.ts)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://setup-supabase.com';

// Current versions of legal documents
export const CONSENT_VERSIONS = {
    terms: '1.0',
    privacy: '1.0',
    marketing: '1.0',
    cookies: '1.0',
} as const;

export type ConsentType = keyof typeof CONSENT_VERSIONS;

interface Consent {
    id: string;
    consentType: ConsentType;
    version: string;
    acceptedAt: string;
    revokedAt: string | null;
    ipAddress: string | null;
    userAgent: string | null;
}

interface UseConsentReturn {
    consents: Consent[];
    loading: boolean;
    error: string | null;
    hasValidConsent: (type: ConsentType, minVersion?: string) => boolean;
    recordConsent: (type: ConsentType, metadata?: Record<string, any>) => Promise<boolean>;
    revokeConsent: (type: ConsentType) => Promise<boolean>;
    getConsentHistory: (type?: ConsentType) => Consent[];
    needsConsent: boolean;
    checkAllRequiredConsents: () => boolean;
    refresh: () => Promise<void>;
}

export function useConsent(): UseConsentReturn {
    const { user } = useAuth();
    const [consents, setConsents] = useState<Consent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch user's consents
    const fetchConsents = useCallback(async (silent = false) => {
        if (!user?.id) {
            setConsents([]);
            setLoading(false);
            return;
        }

        try {
            if (!silent) setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('user_consents' as any)
                .select('*')
                .eq('user_id', user.id)
                .order('accepted_at', { ascending: false });

            if (fetchError) throw fetchError;

            const mappedConsents: Consent[] = ((data as any[]) || []).map(consent => ({
                id: consent.id,
                consentType: consent.consent_type as ConsentType,
                version: consent.version,
                acceptedAt: consent.accepted_at,
                revokedAt: consent.revoked_at,
                ipAddress: consent.ip_address,
                userAgent: consent.user_agent,
            }));

            setConsents(mappedConsents);

            // Update cache
            if (user?.id) {
                const cacheKey = `@vrumi_consents_${user.id}`;
                await AsyncStorage.setItem(cacheKey, JSON.stringify(mappedConsents));
            }
        } catch (err: any) {
            console.error('Error fetching consents:', err);
            setError(err.message || 'Failed to fetch consents');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    // Load initial state from cache to prevent flash
    useEffect(() => {
        const loadFromCache = async () => {
            if (!user?.id) {
                setLoading(false);
                return;
            }
            try {
                const cacheKey = `@vrumi_consents_${user.id}`;
                const cached = await AsyncStorage.getItem(cacheKey);
                if (cached) {
                    setConsents(JSON.parse(cached));
                    // If we have cache, we can stop the initial loading block
                    setLoading(false);
                }
            } catch (e) {
                console.error('Failed to load consents from cache:', e);
            } finally {
                // Trigger background refresh (silent)
                fetchConsents(true);
            }
        };
        loadFromCache();
    }, [user?.id, fetchConsents]);

    useEffect(() => {
        fetchConsents();
    }, [fetchConsents]);

    // Check if user has valid consent for a specific type
    const hasValidConsent = useCallback((type: ConsentType, minVersion?: string): boolean => {
        const activeConsents = consents.filter(
            c => c.consentType === type && !c.revokedAt
        );

        if (activeConsents.length === 0) return false;

        const latestConsent = activeConsents[0]; // Already sorted by accepted_at DESC

        if (minVersion) {
            return latestConsent.version >= minVersion;
        }

        return true;
    }, [consents]);

    // Record a new consent
    const recordConsent = useCallback(async (
        type: ConsentType,
        metadata?: Record<string, any>
    ): Promise<boolean> => {
        if (!user?.id) {
            setError('User not authenticated');
            return false;
        }

        try {
            // Insert consent directly into database (no Edge Function needed)
            const { data, error: insertError } = await supabase
                .from('user_consents' as any)
                .insert({
                    user_id: user.id,
                    consent_type: type,
                    version: CONSENT_VERSIONS[type],
                    metadata: {
                        ...metadata,
                        recorded_via: 'mobile_app',
                        timestamp: new Date().toISOString(),
                    },
                })
                .select()
                .single();

            if (insertError) {
                console.error('Error recording consent:', insertError);
                setError(insertError.message);
                return false;
            }

            // Refresh consents
            await fetchConsents();
            return true;
        } catch (err: any) {
            console.error('Error recording consent:', err);
            setError(err.message || 'Failed to record consent');
            return false;
        }
    }, [user?.id, fetchConsents]);

    // Revoke a consent
    const revokeConsent = useCallback(async (type: ConsentType): Promise<boolean> => {
        if (!user?.id) {
            setError('User not authenticated');
            return false;
        }

        try {
            // Find the latest active consent of this type
            const activeConsent = consents.find(
                c => c.consentType === type && !c.revokedAt
            );

            if (!activeConsent) {
                setError('No active consent found to revoke');
                return false;
            }

            const { error: updateError } = await supabase
                .from('user_consents' as any)
                .update({ revoked_at: new Date().toISOString() })
                .eq('id', activeConsent.id);

            if (updateError) throw updateError;

            // Log to audit
            try {
                await supabase.from('audit_logs').insert({
                    user_id: user.id,
                    action_type: 'consent_revoked',
                    entity_type: 'user_consent',
                    entity_id: activeConsent.id,
                    details: {
                        consent_type: type,
                        version: activeConsent.version,
                    },
                });
            } catch (auditError) {
                console.error('Failed to create audit log:', auditError);
            }

            // Refresh consents
            await fetchConsents();
            return true;
        } catch (err: any) {
            console.error('Error revoking consent:', err);
            setError(err.message || 'Failed to revoke consent');
            return false;
        }
    }, [user?.id, consents, fetchConsents]);

    // Get consent history for a specific type or all types
    const getConsentHistory = useCallback((type?: ConsentType): Consent[] => {
        if (type) {
            return consents.filter(c => c.consentType === type);
        }
        return consents;
    }, [consents]);

    // Check if all required consents are present
    const checkAllRequiredConsents = useCallback((): boolean => {
        const requiredTypes: ConsentType[] = ['terms', 'privacy'];
        return requiredTypes.every(type =>
            hasValidConsent(type, CONSENT_VERSIONS[type])
        );
    }, [hasValidConsent]);

    // Determine if user needs to provide consent
    const needsConsent = !loading && !checkAllRequiredConsents();

    return {
        consents,
        loading,
        error,
        hasValidConsent,
        recordConsent,
        revokeConsent,
        getConsentHistory,
        needsConsent,
        checkAllRequiredConsents,
        refresh: fetchConsents,
    };
}
