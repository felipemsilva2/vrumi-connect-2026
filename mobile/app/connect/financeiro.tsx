import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

interface Transaction {
    id: string;
    amount: number;
    type: 'earning' | 'withdrawal' | 'refund';
    status: 'pending' | 'completed' | 'failed';
    description: string;
    created_at: string;
    booking_id: string | null;
}

export default function InstructorFinanceScreen() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState({
        totalEarnings: 0,
        availableBalance: 0,
        pendingBalance: 0
    });

    const fetchData = useCallback(async () => {
        if (!user?.id) return;

        try {
            // Get instructor ID
            const { data: instructor } = await supabase
                .from('instructors')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!instructor) {
                Alert.alert('Erro', 'Perfil não encontrado.');
                router.back();
                return;
            }

            // Fetch transactions
            const { data: transData, error } = await supabase
                .from('instructor_transactions')
                .select('*')
                .eq('instructor_id', instructor.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const txs = (transData || []) as Transaction[];
            setTransactions(txs);

            // Calculate stats
            // In a real app, this should probably come from a balances table or simplified view
            // Here we verify local calculation
            const total = txs
                .filter(t => t.type === 'earning' && t.status === 'completed')
                .reduce((sum, t) => sum + t.amount, 0);

            const pending = txs
                .filter(t => t.type === 'earning' && t.status === 'pending')
                .reduce((sum, t) => sum + t.amount, 0);

            // Assuming withdrawals reduce balance. 
            // available = completed earnings - completed withdrawals
            const withdrawals = txs
                .filter(t => t.type === 'withdrawal' && ['completed', 'pending'].includes(t.status))
                .reduce((sum, t) => sum + t.amount, 0);

            setStats({
                totalEarnings: total,
                availableBalance: total - withdrawals,
                pendingBalance: pending
            });

        } catch (error) {
            console.error('Error fetching finance data:', error);
            // Alert.alert('Erro', 'Não foi possível carregar dados financeiros.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return '#10b981';
            case 'pending': return '#f59e0b';
            case 'failed': return '#ef4444';
            default: return theme.textSecondary;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed': return 'Concluído';
            case 'pending': return 'Pendente';
            case 'failed': return 'Falhou';
            default: return status;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'earning': return 'arrow-down-circle';
            case 'withdrawal': return 'arrow-up-circle';
            case 'refund': return 'refresh-circle';
            default: return 'ellipse';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'earning': return '#10b981';
            case 'withdrawal': return '#3b82f6'; // Blue for cash out
            case 'refund': return '#ef4444';
            default: return theme.text;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'earning': return 'Recebimento';
            case 'withdrawal': return 'Saque';
            case 'refund': return 'Reembolso';
            default: return type;
        }
    };

    const handleWithdraw = () => {
        Alert.alert('Saque', 'Funcionalidade de saque automático pelo Pagar.me em desenvolvimento. Seus pagamentos caem automaticamente na conta cadastrada toda semana.');
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
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
                {/* Balance Cards */}
                <View style={styles.balanceContainer}>
                    <View style={[styles.mainBalanceCard, { backgroundColor: theme.primary }]}>
                        <Text style={styles.balanceLabel}>Saldo Disponível</Text>
                        <Text style={styles.balanceValue}>{formatCurrency(stats.availableBalance)}</Text>
                        <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw}>
                            <Text style={styles.withdrawText}>Solicitar Saque</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.secondaryBalances}>
                        <View style={[styles.secondaryCard, { backgroundColor: theme.card }]}>
                            <Text style={[styles.secondaryLabel, { color: theme.textSecondary }]}>Pendente</Text>
                            <Text style={[styles.secondaryValue, { color: '#f59e0b' }]}>{formatCurrency(stats.pendingBalance)}</Text>
                        </View>
                        <View style={[styles.secondaryCard, { backgroundColor: theme.card }]}>
                            <Text style={[styles.secondaryLabel, { color: theme.textSecondary }]}>Total Ganho</Text>
                            <Text style={[styles.secondaryValue, { color: '#10b981' }]}>{formatCurrency(stats.totalEarnings)}</Text>
                        </View>
                    </View>
                </View>

                {/* Transactions */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Histórico</Text>

                {transactions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={48} color={theme.textMuted} />
                        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                            Nenhuma transação encontrada.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.transactionsList}>
                        {transactions.map((t) => (
                            <View key={t.id} style={[styles.transactionCard, { backgroundColor: theme.card }]}>
                                <View style={[styles.iconContainer, { backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }]}>
                                    <Ionicons name={getTypeIcon(t.type) as any} size={24} color={getTypeColor(t.type)} />
                                </View>
                                <View style={styles.transactionInfo}>
                                    <Text style={[styles.transactionType, { color: theme.text }]}>{getTypeLabel(t.type)}</Text>
                                    <Text style={[styles.transactionDate, { color: theme.textSecondary }]}>{formatDate(t.created_at)}</Text>
                                    {t.description && (
                                        <Text style={[styles.transactionDescription, { color: theme.textMuted }]}>{t.description}</Text>
                                    )}
                                </View>
                                <View style={styles.transactionRight}>
                                    <Text style={[styles.transactionAmount, { color: getTypeColor(t.type) }]}>
                                        {t.type === 'withdrawal' || t.type === 'refund' ? '- ' : '+ '}
                                        {formatCurrency(t.amount)}
                                    </Text>
                                    <Text style={[styles.transactionStatus, { color: getStatusColor(t.status) }]}>
                                        {getStatusLabel(t.status)}
                                    </Text>
                                </View>
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
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
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
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    balanceContainer: {
        marginBottom: 30,
    },
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
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 20,
    },
    withdrawButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    withdrawText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    secondaryLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    secondaryValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
    },
    transactionsList: {
        gap: 12,
    },
    transactionCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionType: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    transactionDate: {
        fontSize: 12,
        marginBottom: 2,
    },
    transactionDescription: {
        fontSize: 11,
        fontStyle: 'italic',
    },
    transactionRight: {
        alignItems: 'flex-end',
    },
    transactionAmount: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    transactionStatus: {
        fontSize: 11,
        fontWeight: '600',
    },
});
