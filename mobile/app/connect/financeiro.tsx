import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://kyuaxjkokntdmcxjurhm.supabase.co';

interface Transaction {
    id: string;
    amount: number;
    type: string;
    status: string;
    description: string;
    created: string;
}

interface Payout {
    id: string;
    amount: number;
    arrival_date: string;
    status: string;
}

interface FinanceData {
    balance: {
        available: number;
        pending: number;
    };
    totalThisMonth: number;
    transactions: Transaction[];
    payouts: Payout[];
    nextPayoutDate: string | null;
}

export default function InstructorFinanceScreen() {
    const { theme, isDark } = useTheme();
    const { session } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<FinanceData>({
        balance: { available: 0, pending: 0 },
        totalThisMonth: 0,
        transactions: [],
        payouts: [],
        nextPayoutDate: null,
    });
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!session?.access_token) return;

        try {
            setError(null);

            const response = await fetch(`${SUPABASE_URL}/functions/v1/connect-get-balance`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch data');
            }

            setData(result);
        } catch (err: any) {
            console.error('Error fetching finance data:', err);
            setError(err.message || 'Erro ao carregar dados');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [session?.access_token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    };

    const formatFullDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    const getPayoutStatusLabel = (status: string) => {
        switch (status) {
            case 'paid': return 'Depositado';
            case 'pending': return 'Pendente';
            case 'in_transit': return 'A caminho';
            case 'canceled': return 'Cancelado';
            case 'failed': return 'Falhou';
            default: return status;
        }
    };

    const getPayoutStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return '#10b981';
            case 'pending': case 'in_transit': return '#f59e0b';
            case 'canceled': case 'failed': return '#ef4444';
            default: return theme.textSecondary;
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Carregando dados do Stripe...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: theme.card }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Financeiro</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
                {error && (
                    <View style={[styles.errorBanner, { backgroundColor: '#fef2f2' }]}>
                        <Ionicons name="warning-outline" size={20} color="#dc2626" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* Balance Cards */}
                <View style={styles.balanceContainer}>
                    <View style={[styles.mainBalanceCard, { backgroundColor: theme.primary }]}>
                        <Text style={styles.balanceLabel}>Saldo Disponível</Text>
                        <Text style={styles.balanceValue}>{formatCurrency(data.balance.available)}</Text>
                        <View style={styles.payoutInfo}>
                            <Ionicons name="checkmark-circle" size={16} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.payoutText}>
                                Repasse automático para sua conta
                            </Text>
                        </View>
                    </View>

                    <View style={styles.secondaryBalances}>
                        <View style={[styles.secondaryCard, { backgroundColor: theme.card }]}>
                            <Text style={[styles.secondaryLabel, { color: theme.textSecondary }]}>Pendente</Text>
                            <Text style={[styles.secondaryValue, { color: '#f59e0b' }]}>{formatCurrency(data.balance.pending)}</Text>
                        </View>
                        <View style={[styles.secondaryCard, { backgroundColor: theme.card }]}>
                            <Text style={[styles.secondaryLabel, { color: theme.textSecondary }]}>Este Mês</Text>
                            <Text style={[styles.secondaryValue, { color: '#10b981' }]}>{formatCurrency(data.totalThisMonth)}</Text>
                        </View>
                    </View>
                </View>

                {/* Next Payout */}
                {data.nextPayoutDate && (
                    <View style={[styles.nextPayoutCard, { backgroundColor: theme.card }]}>
                        <View style={[styles.nextPayoutIcon, { backgroundColor: '#dcfce7' }]}>
                            <Ionicons name="calendar-outline" size={24} color="#15803d" />
                        </View>
                        <View style={styles.nextPayoutInfo}>
                            <Text style={[styles.nextPayoutLabel, { color: theme.textSecondary }]}>Próximo depósito</Text>
                            <Text style={[styles.nextPayoutDate, { color: theme.text }]}>{formatFullDate(data.nextPayoutDate)}</Text>
                        </View>
                    </View>
                )}

                {/* Recent Payouts */}
                {data.payouts.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Depósitos Recentes</Text>
                        <View style={styles.payoutsList}>
                            {data.payouts.slice(0, 5).map((payout) => (
                                <View key={payout.id} style={[styles.payoutCard, { backgroundColor: theme.card }]}>
                                    <View style={[styles.payoutIconContainer, { backgroundColor: isDark ? '#1f2937' : '#f0fdf4' }]}>
                                        <Ionicons name="wallet-outline" size={20} color="#10b981" />
                                    </View>
                                    <View style={styles.payoutDetails}>
                                        <Text style={[styles.payoutAmount, { color: theme.text }]}>{formatCurrency(payout.amount)}</Text>
                                        <Text style={[styles.payoutArrival, { color: theme.textSecondary }]}>{formatDate(payout.arrival_date)}</Text>
                                    </View>
                                    <View style={[styles.payoutStatusBadge, { backgroundColor: getPayoutStatusColor(payout.status) + '20' }]}>
                                        <Text style={[styles.payoutStatusText, { color: getPayoutStatusColor(payout.status) }]}>
                                            {getPayoutStatusLabel(payout.status)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* Recent Transactions */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Ganhos Recentes</Text>

                {data.transactions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={48} color={theme.textMuted} />
                        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                            Nenhum pagamento recebido ainda.
                        </Text>
                        <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>
                            Seus ganhos aparecerão aqui quando você realizar aulas.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.transactionsList}>
                        {data.transactions.map((t) => (
                            <View key={t.id} style={[styles.transactionCard, { backgroundColor: theme.card }]}>
                                <View style={[styles.iconContainer, { backgroundColor: isDark ? '#1f2937' : '#dcfce7' }]}>
                                    <Ionicons name="arrow-down-circle" size={24} color="#10b981" />
                                </View>
                                <View style={styles.transactionInfo}>
                                    <Text style={[styles.transactionType, { color: theme.text }]}>{t.description}</Text>
                                    <Text style={[styles.transactionDate, { color: theme.textSecondary }]}>{formatDate(t.created)}</Text>
                                </View>
                                <Text style={[styles.transactionAmount, { color: '#10b981' }]}>
                                    + {formatCurrency(t.amount)}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { fontSize: 14 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    content: { paddingHorizontal: 20, paddingTop: 10 },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        gap: 8,
    },
    errorText: { color: '#dc2626', fontSize: 13, flex: 1 },
    balanceContainer: { marginBottom: 24 },
    mainBalanceCard: {
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 16,
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    balanceValue: {
        color: '#ffffff',
        fontSize: 36,
        fontWeight: '800',
        marginBottom: 16,
    },
    payoutInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    payoutText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
    },
    secondaryBalances: {
        flexDirection: 'row',
        gap: 12,
    },
    secondaryCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    secondaryLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
    secondaryValue: { fontSize: 18, fontWeight: '700' },
    nextPayoutCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        gap: 12,
    },
    nextPayoutIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextPayoutInfo: { flex: 1 },
    nextPayoutLabel: { fontSize: 12, fontWeight: '500' },
    nextPayoutDate: { fontSize: 16, fontWeight: '700' },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
    payoutsList: { gap: 10, marginBottom: 24 },
    payoutCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
    },
    payoutIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    payoutDetails: { flex: 1 },
    payoutAmount: { fontSize: 15, fontWeight: '600' },
    payoutArrival: { fontSize: 12 },
    payoutStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    payoutStatusText: { fontSize: 11, fontWeight: '600' },
    emptyState: { alignItems: 'center', padding: 40, gap: 12 },
    emptyText: { fontSize: 14, fontWeight: '600' },
    emptySubtext: { fontSize: 13, textAlign: 'center' },
    transactionsList: { gap: 10 },
    transactionCard: {
        flexDirection: 'row',
        padding: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    transactionInfo: { flex: 1 },
    transactionType: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
    transactionDate: { fontSize: 12 },
    transactionAmount: { fontSize: 16, fontWeight: '700' },
});
