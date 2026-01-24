import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../src/lib/supabase';
import Constants from 'expo-constants';
import { useTheme } from '../contexts/ThemeContext';

interface AppConfig {
    key: string;
    value: string;
}

const CURRENT_VERSION = Constants.expoConfig?.version || '1.0.0';

export default function VersionGate({ children }: { children: React.ReactNode }) {
    const { theme } = useTheme();
    const [config, setConfig] = useState<{
        minVersion: string;
        isMaintenance: boolean;
        message: string | null;
    }>({
        minVersion: '1.0.0',
        isMaintenance: false,
        message: null,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                // We try to fetch from a hipothetical app_config table
                // If it fails, we assume fallback values
                const { data, error } = await (supabase as any)
                    .from('app_config')
                    .select('key, value');

                if (!error && data) {
                    const mapped = (data as any[]).reduce((acc: any, item: AppConfig) => {
                        acc[item.key] = item.value;
                        return acc;
                    }, {});

                    setConfig({
                        minVersion: mapped.min_version || '1.0.0',
                        isMaintenance: mapped.maintenance_mode === 'true',
                        message: mapped.maintenance_message || null,
                    });
                }
            } catch (err) {
                console.log('[VersionGate] Error fetching config, using fallback:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    const isVersionOutdated = () => {
        // Simple version comparison (e.g. 1.0.0 vs 1.1.0)
        const current = CURRENT_VERSION.split('.').map(Number);
        const min = config.minVersion.split('.').map(Number);

        for (let i = 0; i < 3; i++) {
            if ((current[i] || 0) < (min[i] || 0)) return true;
            if ((current[i] || 0) > (min[i] || 0)) return false;
        }
        return false;
    };

    const handleUpdate = () => {
        const url = Platform.OS === 'ios'
            ? 'https://apps.apple.com/app/vrumi' // Replace with real ID
            : 'https://play.google.com/store/apps/details?id=com.vrumi.connect';
        Linking.openURL(url);
    };

    if (loading) return children;

    // 1. Maintenance Mode
    if (config.isMaintenance) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <Ionicons name="construct" size={80} color={theme.primary} />
                <Text style={[styles.title, { color: theme.text }]}>Estamos em Manutenção</Text>
                <Text style={[styles.description, { color: theme.textSecondary }]}>
                    {config.message || 'O Vrumi está passando por uma atualização rápida. Voltaremos em alguns minutos!'}
                </Text>
            </View>
        );
    }

    // 2. Force Update
    if (isVersionOutdated()) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <Ionicons name="arrow-up-circle" size={80} color={theme.primary} />
                <Text style={[styles.title, { color: theme.text }]}>Nova Versão Disponível</Text>
                <Text style={[styles.description, { color: theme.textSecondary }]}>
                    Sua versão do Vrumi ({CURRENT_VERSION}) não é mais compatível. Por favor, atualize para continuar.
                </Text>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={handleUpdate}
                >
                    <Text style={styles.buttonText}>Atualizar Agora</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return children;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 24,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 24,
    },
    button: {
        marginTop: 32,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
