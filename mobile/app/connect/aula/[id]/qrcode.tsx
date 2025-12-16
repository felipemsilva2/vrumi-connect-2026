import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../contexts/ThemeContext';
import { supabase } from '../../../../src/lib/supabase';

export default function QRCodeScreen() {
    const { id } = useLocalSearchParams();
    const { theme, isDark } = useTheme();
    const [status, setStatus] = useState('pending');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        // Initial check
        checkStatus();

        // Subscribe to changes
        const subscription = supabase
            .channel(`booking_${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'bookings',
                    filter: `id=eq.${id}`,
                },
                (payload) => {
                    if (payload.new.status === 'completed') {
                        setStatus('completed');
                        Alert.alert('Sucesso!', 'Aula concluída com sucesso!');
                        router.back();
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [id]);

    const checkStatus = async () => {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('status')
                .eq('id', id)
                .single();

            if (data) {
                setStatus(data.status);
                if (data.status === 'completed') {
                    Alert.alert('Aviso', 'Esta aula já foi concluída.');
                    router.back();
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const qrData = JSON.stringify({
        bookingId: id,
        action: 'complete',
        timestamp: new Date().getTime(),
    });

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Finalizar Aula</Text>
            </View>

            <View style={styles.content}>
                <Text style={[styles.instruction, { color: theme.textSecondary }]}>
                    Peça para o aluno escanear este código para confirmar a aula.
                </Text>

                <View style={[styles.qrContainer, { backgroundColor: '#fff' }]}>
                    <QRCode
                        value={qrData}
                        size={250}
                        color="black"
                        backgroundColor="white"
                    />
                </View>

                <View style={styles.pinContainer}>
                    <Text style={[styles.pinLabel, { color: theme.textSecondary }]}>
                        O aluno está com problemas na câmera?
                    </Text>
                    <Text style={[styles.pinText, { color: theme.text }]}>
                        Aguardando confirmação...
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    backButton: {
        padding: 8,
        marginRight: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    instruction: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 40,
    },
    qrContainer: {
        padding: 20,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
        marginBottom: 40,
    },
    pinContainer: {
        alignItems: 'center',
    },
    pinLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    pinText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
