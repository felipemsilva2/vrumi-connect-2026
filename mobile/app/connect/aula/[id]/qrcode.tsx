import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Animated,
    Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../../src/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function QRCodeScreen() {
    const { id } = useLocalSearchParams();
    const [status, setStatus] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [studentName, setStudentName] = useState('');
    const [pulseAnim] = useState(new Animated.Value(1));

    useEffect(() => {
        if (!id) return;

        checkStatus();

        // Pulse animation for waiting state
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
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
                        Alert.alert(
                            '✅ Aula Finalizada!',
                            'O aluno confirmou a presença. A aula foi concluída com sucesso.',
                            [{ text: 'Ver Painel', onPress: () => router.push('/(tabs)/instrutor') }]
                        );
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
                .select(`
                    status,
                    student:profiles!bookings_student_id_fkey(full_name)
                `)
                .eq('id', id)
                .single();

            if (data) {
                setStatus(data.status);
                const student = Array.isArray(data.student) ? data.student[0] : data.student;
                setStudentName(student?.full_name || 'Aluno');

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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <View style={styles.roleBadge}>
                        <Ionicons name="car" size={14} color="#fff" />
                        <Text style={styles.roleBadgeText}>Instrutor</Text>
                    </View>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.content}>
                {/* Title */}
                <Text style={styles.title}>Finalizar Aula</Text>
                <Text style={styles.subtitle}>
                    Peça para <Text style={styles.studentName}>{studentName}</Text> escanear o código
                </Text>

                {/* QR Code Card */}
                <Animated.View
                    style={[
                        styles.qrCard,
                        { transform: [{ scale: pulseAnim }] }
                    ]}
                >
                    <LinearGradient
                        colors={['#064e3b', '#065f46']}
                        style={styles.qrCardHeader}
                    >
                        <Ionicons name="qr-code" size={20} color="#fff" />
                        <Text style={styles.qrCardHeaderText}>QR Code de Check-in</Text>
                    </LinearGradient>

                    <View style={styles.qrContainer}>
                        <QRCode
                            value={qrData}
                            size={SCREEN_WIDTH * 0.5}
                            color="#1f2937"
                            backgroundColor="#fff"
                        />
                    </View>

                    <View style={styles.qrFooter}>
                        <View style={styles.waitingIndicator}>
                            <View style={styles.waitingDot} />
                            <Text style={styles.waitingText}>Aguardando scan...</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Instructions */}
                <View style={styles.instructions}>
                    <View style={styles.instructionStep}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <Text style={styles.stepText}>
                            Mostre este código para o aluno
                        </Text>
                    </View>
                    <View style={styles.instructionStep}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <Text style={styles.stepText}>
                            O aluno escaneia com a câmera
                        </Text>
                    </View>
                    <View style={styles.instructionStep}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <Text style={styles.stepText}>
                            Aula finalizada automaticamente!
                        </Text>
                    </View>
                </View>

                {/* Help */}
                <TouchableOpacity style={styles.helpCard}>
                    <Ionicons name="help-circle" size={22} color="#f59e0b" />
                    <View style={styles.helpContent}>
                        <Text style={styles.helpTitle}>Aluno com problemas?</Text>
                        <Text style={styles.helpText}>
                            Se a câmera não funcionar, o aluno pode finalizar manualmente na tela de aulas
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        alignItems: 'center',
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#064e3b',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    roleBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    // Content
    content: {
        flex: 1,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1f2937',
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    studentName: {
        fontWeight: '700',
        color: '#1f2937',
    },
    // QR Card
    qrCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 6,
        marginBottom: 32,
    },
    qrCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
    },
    qrCardHeaderText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    qrContainer: {
        padding: 24,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    qrFooter: {
        paddingVertical: 16,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    waitingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    waitingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#f59e0b',
    },
    waitingText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6b7280',
    },
    // Instructions
    instructions: {
        width: '100%',
        gap: 12,
        marginBottom: 24,
    },
    instructionStep: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#ecfdf5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#10b981',
    },
    stepText: {
        fontSize: 14,
        color: '#4b5563',
    },
    // Help
    helpCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#fffbeb',
        borderRadius: 14,
        padding: 14,
        gap: 12,
        width: '100%',
    },
    helpContent: {
        flex: 1,
    },
    helpTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#92400e',
        marginBottom: 2,
    },
    helpText: {
        fontSize: 12,
        color: '#b45309',
        lineHeight: 18,
    },
});
