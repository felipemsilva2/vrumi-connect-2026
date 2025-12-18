import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../src/lib/supabase';
import { useStripe } from '@stripe/stripe-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Supabase Edge Function URL
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xzpfutgktapdqfyqnqxq.supabase.co';

interface Booking {
    id: string;
    scheduled_date: string;
    scheduled_time: string;
    price: number;
    instructor_id: string;
    instructor: {
        full_name: string;
        photo_url: string | null;
        city: string;
        state: string;
        stripe_account_id: string | null;
    };
}

interface StudentPackage {
    id: string;
    lessons_total: number;
    total_paid: number;
    instructor_id: string;
    instructor: {
        full_name: string;
        photo_url: string | null;
        stripe_account_id: string | null;
    };
}

export default function CheckoutScreen() {
    const { id, type, action, old_id } = useLocalSearchParams<{
        id: string,
        type: 'booking' | 'package',
        action?: 'sum' | 'switch',
        old_id?: string
    }>();
    const { theme, isDark } = useTheme();
    const { user, session } = useAuth();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [data, setData] = useState<any>(null);
    const [paymentReady, setPaymentReady] = useState(false);

    useEffect(() => {
        if (id) {
            fetchOrderData();
        }
    }, [id, type]);

    const fetchOrderData = async () => {
        try {
            if (type === 'booking') {
                const { data: booking, error } = await supabase
                    .from('bookings')
                    .select(`
                        id,
                        scheduled_date,
                        scheduled_time,
                        price,
                        instructor_id,
                        instructor:instructors(full_name, photo_url, city, state, stripe_account_id)
                    `)
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setData(booking);

                // Initialize payment sheet after fetching data
                if (booking) {
                    await initializePaymentSheet(booking.instructor_id, booking.price * 100, booking.id);
                }
            } else {
                const { data: pkg, error } = await supabase
                    .from('student_packages')
                    .select(`
                        id,
                        lessons_total,
                        total_paid,
                        instructor_id,
                        instructor:instructors(full_name, photo_url, stripe_account_id)
                    `)
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setData(pkg);

                // Initialize payment sheet after fetching data
                if (pkg && pkg.instructor_id) {
                    await initializePaymentSheet(pkg.instructor_id, pkg.total_paid * 100);
                }
            }
        } catch (error) {
            console.error('Error fetching checkout data:', error);
            Alert.alert('Erro', 'Não foi possível carregar os dados do pedido.');
        } finally {
            setLoading(false);
        }
    };

    const initializePaymentSheet = async (instructorId: string, amountCents: number, bookingId?: string) => {
        try {
            if (!session?.access_token) {
                console.warn('No session token for payment initialization');
                return;
            }

            // Call Edge Function to create PaymentIntent
            const response = await fetch(`${SUPABASE_URL}/functions/v1/connect-create-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    instructorId,
                    amount: Math.round(amountCents),
                    bookingId,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create payment intent');
            }

            console.log('PaymentIntent created:', result.paymentIntentId);

            // Initialize the Payment Sheet
            const { error: initError } = await initPaymentSheet({
                paymentIntentClientSecret: result.clientSecret,
                merchantDisplayName: 'Vrumi Connect',
                returnURL: 'vrumi://checkout/complete',
                allowsDelayedPaymentMethods: false,
            });

            if (initError) {
                console.error('Payment Sheet init error:', initError);
                // Don't throw - allow fallback to mock
            } else {
                setPaymentReady(true);
            }
        } catch (error) {
            console.error('Payment initialization error:', error);
            // Don't show alert - allow fallback to mock payment
        }
    };

    const handlePayment = async () => {
        setSubmitting(true);
        try {
            // Check if instructor has Stripe account
            const instructorData = data?.instructor;
            const hasStripeAccount = instructorData?.stripe_account_id;

            if (paymentReady && hasStripeAccount) {
                // Use real Stripe Payment Sheet
                const { error: paymentError } = await presentPaymentSheet();

                if (paymentError) {
                    if (paymentError.code === 'Canceled') {
                        // User cancelled - just return silently
                        setSubmitting(false);
                        return;
                    }
                    throw new Error(paymentError.message);
                }

                // Payment succeeded - update database
                await updateDatabaseAfterPayment();
            } else {
                // Fallback: Mock payment (instructor doesn't have Stripe account yet)
                Alert.alert(
                    'Instrutor não configurado',
                    'Este instrutor ainda não configurou o recebimento de pagamentos. Deseja prosseguir com pagamento simulado para teste?',
                    [
                        { text: 'Cancelar', style: 'cancel', onPress: () => setSubmitting(false) },
                        {
                            text: 'Simular',
                            onPress: async () => {
                                await new Promise(resolve => setTimeout(resolve, 1500));
                                await updateDatabaseAfterPayment();
                            }
                        }
                    ]
                );
                return;
            }
        } catch (error: any) {
            console.error('Payment error:', error);
            Alert.alert('Erro no Pagamento', error.message || 'Tente novamente em alguns instantes.');
        } finally {
            setSubmitting(false);
        }
    };

    const updateDatabaseAfterPayment = async () => {
        // Update status in DB
        if (type === 'booking') {
            const { error } = await supabase
                .from('bookings')
                .update({ payment_status: 'paid' })
                .eq('id', id);
            if (error) throw error;
        } else {
            if (action === 'sum' && old_id) {
                // 1. Get current package lessons
                const { data: oldPkg } = await supabase
                    .from('student_packages')
                    .select('lessons_total')
                    .eq('id', old_id)
                    .single();

                if (oldPkg) {
                    // 2. Add new lessons to old package
                    const { error: sumError } = await supabase
                        .from('student_packages')
                        .update({
                            lessons_total: oldPkg.lessons_total + data.lessons_total,
                            status: 'active'
                        })
                        .eq('id', old_id);

                    if (sumError) throw sumError;

                    // 3. Mark the NEW package as merged/completed
                    await supabase
                        .from('student_packages')
                        .update({ status: 'completed' })
                        .eq('id', id);
                }
            } else if (action === 'switch' && old_id) {
                // 1. Mark OLD as completed
                const { error: oldError } = await supabase
                    .from('student_packages')
                    .update({ status: 'completed', completed_at: new Date().toISOString() })
                    .eq('id', old_id);
                if (oldError) throw oldError;

                // 2. Mark NEW as active
                const { error: newError } = await supabase
                    .from('student_packages')
                    .update({ status: 'active' })
                    .eq('id', id);
                if (newError) throw newError;
            } else {
                // Standard activation
                const { error } = await supabase
                    .from('student_packages')
                    .update({ status: 'active' })
                    .eq('id', id);
                if (error) throw error;
            }
        }

        Alert.alert(
            'Pagamento Confirmado! 🎉',
            type === 'booking'
                ? 'Seu instrutor foi notificado e logo confirmará a aula.'
                : 'Seu pacote já está disponível para uso.',
            [{ text: 'OK', onPress: () => router.push(type === 'booking' ? '/(tabs)/aulas' : `/connect/instrutor/${data.instructor_id}`) }]
        );
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(price);
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.textMuted }]}>Preparando pagamento...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!data) return null;

    const totalAmount = type === 'booking' ? data.price : data.total_paid;
    const hasStripeAccount = data.instructor?.stripe_account_id;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: theme.card }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Checkout</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Order Summary Card */}
                <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
                    <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>RESUMO DO PEDIDO</Text>

                    <View style={styles.instructorRow}>
                        <Image
                            source={{ uri: data.instructor?.photo_url || 'https://via.placeholder.com/60' }}
                            style={styles.instructorPhoto}
                        />
                        <View style={styles.instructorInfo}>
                            <Text style={[styles.instructorName, { color: theme.text }]}>{data.instructor?.full_name}</Text>
                            <Text style={[styles.orderType, { color: theme.primary }]}>
                                {type === 'booking' ? 'Aula Única' : `Pacote de ${data.lessons_total} Aulas`}
                            </Text>
                        </View>
                    </View>

                    {type === 'booking' && (
                        <View style={styles.detailRow}>
                            <View style={styles.detailItem}>
                                <Ionicons name="calendar-outline" size={16} color={theme.textMuted} />
                                <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                                    {new Date(data.scheduled_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                                </Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Ionicons name="time-outline" size={16} color={theme.textMuted} />
                                <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                                    {data.scheduled_time.substring(0, 5)}
                                </Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.divider} />

                    <View style={styles.priceRow}>
                        <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Subtotal</Text>
                        <Text style={[styles.priceValue, { color: theme.text }]}>{formatPrice(totalAmount)}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Taxa de Serviço</Text>
                        <Text style={[styles.priceValue, { color: '#10b981' }]}>Grátis</Text>
                    </View>
                    <View style={[styles.priceRow, styles.totalRow]}>
                        <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
                        <Text style={[styles.totalValue, { color: theme.primary }]}>{formatPrice(totalAmount)}</Text>
                    </View>
                </View>

                {/* Payment Methods */}
                <Text style={[styles.sectionHeader, { color: theme.text }]}>Método de Pagamento</Text>

                <TouchableOpacity style={[styles.methodCard, { backgroundColor: theme.card, borderColor: theme.primary, borderWidth: 2 }]}>
                    <View style={[styles.methodIcon, { backgroundColor: theme.primaryLight }]}>
                        <Ionicons name="card" size={24} color={theme.primary} />
                    </View>
                    <View style={styles.methodInfo}>
                        <Text style={[styles.methodTitle, { color: theme.text }]}>Cartão de Crédito</Text>
                        <Text style={[styles.methodSubtitle, { color: theme.textMuted }]}>
                            {paymentReady && hasStripeAccount ? 'Via Stripe' : 'Até 12x no cartão'}
                        </Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.methodCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1, opacity: 0.6 }]}>
                    <View style={[styles.methodIcon, { backgroundColor: '#f3f4f6' }]}>
                        <Ionicons name="qr-code" size={24} color="#6b7280" />
                    </View>
                    <View style={styles.methodInfo}>
                        <Text style={[styles.methodTitle, { color: theme.text }]}>Pix</Text>
                        <Text style={[styles.methodSubtitle, { color: theme.textMuted }]}>Confirmação instantânea</Text>
                    </View>
                    <View style={styles.comingSoon}><Text style={styles.comingSoonText}>EM BREVE</Text></View>
                </TouchableOpacity>

                {!hasStripeAccount && (
                    <View style={[styles.warningBox, { backgroundColor: '#fef3c7' }]}>
                        <Ionicons name="warning" size={20} color="#d97706" />
                        <Text style={styles.warningText}>
                            Este instrutor ainda não configurou o recebimento de pagamentos. Você pode prosseguir com pagamento simulado para teste.
                        </Text>
                    </View>
                )}

                <View style={styles.securityNote}>
                    <Ionicons name="shield-checkmark" size={16} color="#10b981" />
                    <Text style={styles.securityText}>Pagamento 100% seguro via Stripe</Text>
                </View>

            </ScrollView>

            <View style={[styles.footer, { borderTopColor: theme.cardBorder }]}>
                <TouchableOpacity
                    style={[styles.payButton, { backgroundColor: theme.primary }]}
                    onPress={handlePayment}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.payButtonText}>Finalizar Pagamento</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    loadingText: { fontSize: 14, fontWeight: '500' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    backButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800' },
    scrollContent: { padding: 20 },

    summaryCard: { borderRadius: 24, padding: 20, marginBottom: 32 },
    sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 16 },
    instructorRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
    instructorPhoto: { width: 60, height: 60, borderRadius: 16 },
    instructorInfo: { flex: 1 },
    instructorName: { fontSize: 18, fontWeight: '700' },
    orderType: { fontSize: 14, fontWeight: '600', marginTop: 2 },

    detailRow: { flexDirection: 'row', gap: 20, marginBottom: 20 },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    detailText: { fontSize: 14, fontWeight: '500' },
    divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 20 },

    priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    priceLabel: { fontSize: 14, fontWeight: '500' },
    priceValue: { fontSize: 14, fontWeight: '600' },
    totalRow: { marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
    totalLabel: { fontSize: 18, fontWeight: '800' },
    totalValue: { fontSize: 22, fontWeight: '800' },

    sectionHeader: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
    methodCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12 },
    methodIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    methodInfo: { flex: 1 },
    methodTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    methodSubtitle: { fontSize: 13, fontWeight: '500' },
    comingSoon: { backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    comingSoonText: { fontSize: 10, fontWeight: '800', color: '#6b7280' },

    warningBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 12, marginTop: 16 },
    warningText: { flex: 1, fontSize: 13, color: '#92400e', lineHeight: 18 },

    securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
    securityText: { fontSize: 13, color: '#10b981', fontWeight: '600' },

    footer: { padding: 20, paddingBottom: 30, borderTopWidth: 1 },
    payButton: { height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
    payButtonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
