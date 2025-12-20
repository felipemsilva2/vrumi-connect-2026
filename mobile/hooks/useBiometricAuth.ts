import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

interface BiometricAuthResult {
    success: boolean;
    error?: string;
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
    };
}
