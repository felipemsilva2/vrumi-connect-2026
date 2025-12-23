import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useBiometricAuth } from '../hooks/useBiometricAuth';

interface BiometricLockScreenProps {
    onUnlock: () => void;
}

export function BiometricLockScreen({ onUnlock }: BiometricLockScreenProps) {
    const { theme, isDark } = useTheme();
    const { authenticate, biometricType } = useBiometricAuth();
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const pulseAnim = new Animated.Value(1);

    useEffect(() => {
        // Auto-trigger authentication on mount
        handleAuthenticate();

        // Pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const handleAuthenticate = async () => {
        if (isAuthenticating) return;

        setIsAuthenticating(true);
        setError(null);

        const result = await authenticate();

        if (result.success) {
            onUnlock();
        } else if (result.error !== 'Cancelado') {
            setError(result.error || 'Falha na autenticação');
        }

        setIsAuthenticating(false);
    };

    const getIconName = () => {
        if (biometricType === 'face') return 'scan-outline';
        if (biometricType === 'fingerprint') return 'finger-print-outline';
        return 'lock-closed-outline';
    };

    const getLabel = () => {
        if (biometricType === 'face') return 'Face ID';
        if (biometricType === 'fingerprint') return 'Touch ID';
        return 'Biometria';
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Logo */}
            <View style={styles.logoContainer}>
                <Image
                    source={require('../assets/icon.png')}
                    style={styles.logo}
                    resizeMode="contain"
                    accessibilityLabel="Logo do Vrumi"
                />
                <Text style={[styles.appName, { color: theme.text }]}>Vrumi</Text>
            </View>

            {/* Biometric Button */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                    style={[styles.biometricButton, { backgroundColor: theme.primary }]}
                    onPress={handleAuthenticate}
                    disabled={isAuthenticating}
                    activeOpacity={0.8}
                    accessibilityLabel={`Autenticar com ${getLabel()}`}
                    accessibilityRole="button"
                    accessibilityHint="Toque para desbloquear o aplicativo"
                    accessibilityState={{ disabled: isAuthenticating }}
                >
                    <Ionicons
                        name={getIconName() as any}
                        size={48}
                        color="#fff"
                    />
                </TouchableOpacity>
            </Animated.View>

            <Text style={[styles.label, { color: theme.text }]}>
                {isAuthenticating ? 'Autenticando...' : `Toque para usar ${getLabel()}`}
            </Text>

            {error && (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={20} color="#ef4444" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* Retry button */}
            {error && (
                <TouchableOpacity
                    style={[styles.retryButton, { borderColor: theme.primary }]}
                    onPress={handleAuthenticate}
                    accessibilityLabel="Tentar novamente"
                    accessibilityRole="button"
                >
                    <Text style={[styles.retryText, { color: theme.primary }]}>
                        Tentar Novamente
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 60,
    },
    logo: {
        width: 80,
        height: 80,
        marginBottom: 16,
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    biometricButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    label: {
        fontSize: 16,
        marginTop: 24,
        opacity: 0.8,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
        padding: 12,
        backgroundColor: '#fef2f2',
        borderRadius: 8,
        gap: 8,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
    },
    retryButton: {
        marginTop: 16,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 1,
    },
    retryText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
