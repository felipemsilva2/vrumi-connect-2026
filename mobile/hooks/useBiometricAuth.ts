import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_USER_ID_KEY = 'biometric_user_id';
const BIOMETRIC_REFRESH_TOKEN_KEY = 'biometric_refresh_token';

interface BiometricAuthResult {
    success: boolean;
    error?: string;
}

interface BiometricCredentials {
    userId: string;
    refreshToken: string;
}

interface UseBiometricAuthReturn {
    isBiometricSupported: boolean;
    isBiometricEnrolled: boolean;
    isBiometricEnabled: boolean;
    biometricType: 'face' | 'fingerprint' | 'none';
    loading: boolean;
    authenticate: () => Promise<BiometricAuthResult>;
    enableBiometric: () => Promise<void>;
    disableBiometric: () => Promise<void>;
    checkBiometricPreference: () => Promise<boolean>;
    saveCredentials: (userId: string, refreshToken: string) => Promise<void>;
    getCredentials: () => Promise<BiometricCredentials | null>;
    clearCredentials: () => Promise<void>;
    hasCredentials: () => Promise<boolean>;
}

export function useBiometricAuth(): UseBiometricAuthReturn {
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const [isBiometricEnrolled, setIsBiometricEnrolled] = useState(false);
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const [biometricType, setBiometricType] = useState<'face' | 'fingerprint' | 'none'>('none');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkBiometricCapabilities();
    }, []);

    const checkBiometricCapabilities = async () => {
        try {
            // Check if device has biometric hardware
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            setIsBiometricSupported(hasHardware);

            if (hasHardware) {
                // Check if biometric is enrolled
                const isEnrolled = await LocalAuthentication.isEnrolledAsync();
                setIsBiometricEnrolled(isEnrolled);

                // Get available biometric types
                const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
                if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
                    setBiometricType('face');
                } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
                    setBiometricType('fingerprint');
                }

                // Check user preference
                const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
                setIsBiometricEnabled(enabled === 'true');
            }
        } catch (error) {
            console.error('Error checking biometric capabilities:', error);
        } finally {
            setLoading(false);
        }
    };

    const authenticate = useCallback(async (): Promise<BiometricAuthResult> => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Desbloqueie o Vrumi',
                fallbackLabel: 'Usar senha',
                cancelLabel: 'Cancelar',
                disableDeviceFallback: false,
            });

            if (result.success) {
                return { success: true };
            } else {
                return {
                    success: false,
                    error: result.error === 'user_cancel' ? 'Cancelado' : 'Falha na autenticação'
                };
            }
        } catch (error: any) {
            console.error('Biometric authentication error:', error);
            return { success: false, error: error.message || 'Erro desconhecido' };
        }
    }, []);

    const enableBiometric = useCallback(async () => {
        // First, verify the user can authenticate
        const result = await authenticate();
        if (result.success) {
            await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
            setIsBiometricEnabled(true);
        } else {
            throw new Error(result.error || 'Não foi possível habilitar biometria');
        }
    }, [authenticate]);

    const disableBiometric = useCallback(async () => {
        await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
        setIsBiometricEnabled(false);
    }, []);

    const checkBiometricPreference = useCallback(async (): Promise<boolean> => {
        try {
            const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
            return enabled === 'true';
        } catch {
            return false;
        }
    }, []);

    const saveCredentials = useCallback(async (userId: string, refreshToken: string): Promise<void> => {
        try {
            await SecureStore.setItemAsync(BIOMETRIC_USER_ID_KEY, userId);
            await SecureStore.setItemAsync(BIOMETRIC_REFRESH_TOKEN_KEY, refreshToken);
            await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
            setIsBiometricEnabled(true);
        } catch (error) {
            console.error('Error saving biometric credentials:', error);
            throw new Error('Não foi possível salvar credenciais');
        }
    }, []);

    const getCredentials = useCallback(async (): Promise<BiometricCredentials | null> => {
        try {
            const userId = await SecureStore.getItemAsync(BIOMETRIC_USER_ID_KEY);
            const refreshToken = await SecureStore.getItemAsync(BIOMETRIC_REFRESH_TOKEN_KEY);

            if (userId && refreshToken) {
                return { userId, refreshToken };
            }
            return null;
        } catch (error) {
            console.error('Error getting biometric credentials:', error);
            return null;
        }
    }, []);

    const clearCredentials = useCallback(async (): Promise<void> => {
        try {
            await SecureStore.deleteItemAsync(BIOMETRIC_USER_ID_KEY);
            await SecureStore.deleteItemAsync(BIOMETRIC_REFRESH_TOKEN_KEY);
            await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
            setIsBiometricEnabled(false);
        } catch (error) {
            console.error('Error clearing biometric credentials:', error);
        }
    }, []);

    const hasCredentials = useCallback(async (): Promise<boolean> => {
        try {
            const userId = await SecureStore.getItemAsync(BIOMETRIC_USER_ID_KEY);
            const refreshToken = await SecureStore.getItemAsync(BIOMETRIC_REFRESH_TOKEN_KEY);
            return !!(userId && refreshToken);
        } catch {
            return false;
        }
    }, []);

    return {
        isBiometricSupported,
        isBiometricEnrolled,
        isBiometricEnabled,
        biometricType,
        loading,
        authenticate,
        enableBiometric,
        disableBiometric,
        checkBiometricPreference,
        saveCredentials,
        getCredentials,
        clearCredentials,
        hasCredentials,
    };
}
