import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../src/lib/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://kyuaxjkokntdmcxjurhm.supabase.co';

interface OnboardingStatus {
    documents_status: 'pending' | 'submitted' | 'verified' | 'rejected';
    has_availability: boolean;
    stripe_complete: boolean;
    stripe_account_id: string | null;
}

export default function InstructorOnboardingView() {
    const { theme } = useTheme();
    const { user, session } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [status, setStatus] = useState<OnboardingStatus>({
        documents_status: 'pending',
        has_availability: false,
        stripe_complete: false,
        stripe_account_id: null
    });
    const [stripeLoading, setStripeLoading] = useState(false);

    const fetchStatus = useCallback(async () => {
        if (!user?.id) return;

        try {
            // 1. Get Instructor Info
            const { data: instructor, error } = await supabase
                .from('instructors')
                .select('id, documents_status, stripe_onboarding_complete, stripe_account_id')
                .eq('user_id', user.id)
                .single();

            if (error) throw error;

            // 2. Check Availability
            const { count } = await supabase
                .from('instructor_availability')
                .select('*', { count: 'exact', head: true })
                .eq('instructor_id', instructor.id)
                .eq('is_active', true);

            setStatus({
                documents_status: (instructor.documents_status as any) || 'pending',
                has_availability: (count || 0) > 0,
                stripe_complete: instructor.stripe_onboarding_complete || false,
                stripe_account_id: instructor.stripe_account_id
            });

        } catch (error) {
            console.error('Error fetching onboarding status:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            fetchStatus();
        }, [fetchStatus])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchStatus();
    };

    const handleActivateStripe = async () => {
        if (!session?.access_token) return;

        setStripeLoading(true);
        try {
            // Step 1: Create Stripe account if doesn't exist
            let accountId = status.stripe_account_id;

            if (!accountId) {
                const createResponse = await fetch(`${SUPABASE_URL}/functions/v1/connect-create-account`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                });

                const createResult = await createResponse.json();
                if (!createResponse.ok) throw new Error(createResult.error || 'Falha ao criar conta Stripe');
                accountId = createResult.accountId;
            }

            // Step 2: Get onboarding link
            const linkResponse = await fetch(`${SUPABASE_URL}/functions/v1/connect-onboarding-link`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            const linkResult = await linkResponse.json();
            if (!linkResponse.ok) throw new Error(linkResult.error || 'Falha ao gerar link');

            await Linking.openURL(linkResult.url);

        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Erro ao conectar com Stripe');
        } finally {
            setStripeLoading(false);
        }
    };

    const calculateProgress = () => {
        let total = 4; // Info(1) + Docs(1) + Avail(1) + Stripe(1)
        let current = 1; // Info always done if user exists
        if (status.documents_status !== 'pending' && status.documents_status !== 'rejected') current++;
        if (status.has_availability) current++;
        if (status.stripe_complete) current++;
        return Math.round((current / total) * 100);
    };

    const progress = calculateProgress();

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.greeting, { color: theme.textSecondary }]}>Bem-vindo,</Text>
                    <Text style={[styles.name, { color: theme.text }]}>{user?.user_metadata?.full_name?.split(' ')[0]}</Text>
                </View>

                {/* Status Banner */}
                <View style={[styles.statusBanner, { backgroundColor: '#fef3c7', borderColor: '#fcd34d' }]}>
                    <Ionicons name="time" size={24} color="#d97706" />
                    <View style={styles.statusTextContainer}>
                        <Text style={[styles.statusTitle, { color: '#92400e' }]}>Cadastro em Análise</Text>
                        <Text style={[styles.statusDesc, { color: '#b45309' }]}>
                            Complete os passos abaixo para ativar sua conta.
                        </Text>
                    </View>
                </View>

                {/* Progress Circle */}
                <View style={styles.progressSection}>
                    <View style={[styles.progressCircle, { borderColor: theme.cardBorder }]}>
                        <Text style={[styles.progressValue, { color: theme.primary }]}>{progress}%</Text>
                        <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>Completo</Text>
                    </View>
                    <Text style={[styles.progressMessage, { color: theme.textSecondary }]}>
                        Faltam poucos detalhes para você começar a receber alunos!
                    </Text>
                </View>

                {/* Steps List */}
                <View style={styles.stepsContainer}>

                    {/* Step 1: Info */}
                    <View style={[styles.stepCard, { backgroundColor: theme.card }]}>
                        <View style={[styles.stepIcon, { backgroundColor: '#dcfce7' }]}>
                            <Ionicons name="checkmark" size={20} color="#166534" />
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={[styles.stepTitle, { color: theme.text }]}>1. Dados Pessoais</Text>
                            <Text style={[styles.stepStatus, { color: '#166534' }]}>Concluído</Text>
                        </View>
                    </View>

                    {/* Step 2: Docs */}
                    <TouchableOpacity
                        style={[styles.stepCard, { backgroundColor: theme.card }]}
                        onPress={() => router.push('/connect/documentos')}
                    >
                        <View style={[styles.stepIcon, {
                            backgroundColor: status.documents_status === 'verified' ? '#dcfce7' :
                                status.documents_status === 'submitted' ? '#fef3c7' : '#fee2e2'
                        }]}>
                            <Ionicons
                                name={status.documents_status === 'verified' ? "checkmark" :
                                    status.documents_status === 'submitted' ? "time" : "document-text"}
                                size={20}
                                color={status.documents_status === 'verified' ? "#166534" :
                                    status.documents_status === 'submitted' ? "#d97706" : "#dc2626"}
                            />
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={[styles.stepTitle, { color: theme.text }]}>2. Enviar Documentos</Text>
                            <Text style={[styles.stepStatus, {
                                color: status.documents_status === 'verified' ? "#166534" :
                                    status.documents_status === 'submitted' ? "#d97706" : "#dc2626"
                            }]}>
                                {status.documents_status === 'verified' ? 'Verificado' :
                                    status.documents_status === 'submitted' ? 'Em Análise' : 'Pendente'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                    </TouchableOpacity>

                    {/* Step 3: Availability */}
                    <TouchableOpacity
                        style={[styles.stepCard, { backgroundColor: theme.card }]}
                        onPress={() => router.push('/connect/horarios')}
                    >
                        <View style={[styles.stepIcon, {
                            backgroundColor: status.has_availability ? '#dcfce7' : '#e0f2fe'
                        }]}>
                            <Ionicons
                                name={status.has_availability ? "checkmark" : "calendar"}
                                size={20}
                                color={status.has_availability ? "#166534" : "#0284c7"}
                            />
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={[styles.stepTitle, { color: theme.text }]}>3. Definir Horários</Text>
                            <Text style={[styles.stepStatus, {
                                color: status.has_availability ? "#166534" : "#0284c7"
                            }]}>
                                {status.has_availability ? 'Configurado' : 'Configurar Agora'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                    </TouchableOpacity>

                    {/* Step 4: Stripe */}
                    <TouchableOpacity
                        style={[styles.stepCard, { backgroundColor: theme.card }]}
                        onPress={handleActivateStripe}
                        disabled={loading || stripeLoading}
                    >
                        <View style={[styles.stepIcon, {
                            backgroundColor: status.stripe_complete ? '#dcfce7' : '#f3e8ff'
                        }]}>
                            {stripeLoading ? (
                                <ActivityIndicator size="small" color="#7e22ce" />
                            ) : (
                                <Ionicons
                                    name={status.stripe_complete ? "checkmark" : "wallet"}
                                    size={20}
                                    color={status.stripe_complete ? "#166534" : "#7e22ce"}
                                />
                            )}
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={[styles.stepTitle, { color: theme.text }]}>4. Dados Bancários</Text>
                            <Text style={[styles.stepStatus, {
                                color: status.stripe_complete ? "#166534" : "#7e22ce"
                            }]}>
                                {status.stripe_complete ? 'Conectado' : 'Conectar Stripe'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                    </TouchableOpacity>

                </View>

                {/* Support CTA */}
                <TouchableOpacity
                    style={[styles.supportButton, { backgroundColor: theme.card }]}
                    onPress={() => router.push('/connect/suporte')} // Assuming support route
                >
                    <Ionicons name="help-buoy-outline" size={20} color={theme.textSecondary} />
                    <Text style={[styles.supportText, { color: theme.textSecondary }]}>Precisa de ajuda com o cadastro?</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    header: {
        marginBottom: 24,
    },
    greeting: {
        fontSize: 16,
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    statusBanner: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 32,
        alignItems: 'center',
        gap: 16,
    },
    statusTextContainer: {
        flex: 1,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statusDesc: {
        fontSize: 13,
        lineHeight: 18,
    },
    progressSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
        gap: 20,
    },
    progressCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    progressLabel: {
        fontSize: 10,
        textTransform: 'uppercase',
        marginTop: 2,
    },
    progressMessage: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    stepsContainer: {
        gap: 16,
    },
    stepCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    stepIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    stepStatus: {
        fontSize: 13,
        fontWeight: '500',
    },
    supportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    supportText: {
        fontSize: 14,
        fontWeight: '500',
    }
});
