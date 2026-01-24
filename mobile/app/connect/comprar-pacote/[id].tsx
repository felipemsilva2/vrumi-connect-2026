import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../src/lib/supabase';
import ConfirmationModal from '../../../components/ConfirmationModal';

interface PackageDetails {
    id: string;
    name: string;
    total_lessons: number;
    vehicle_type: string;
    total_price: number;
    discount_percent: number;
    instructor: {
        id: string;
        full_name: string;
        photo_url: string | null;
    };
}

export default function ComprarPacoteScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { theme } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [packageData, setPackageData] = useState<PackageDetails | null>(null);
    const [hasActivePackage, setHasActivePackage] = useState(false);

    // Unified Modal State
    const [modalConfig, setModalConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: 'warning' | 'danger' | 'success' | 'info';
        onConfirm?: () => void;
        confirmText?: string;
        cancelText?: string;
        showCancel?: boolean;
    }>({
        visible: false,
        title: '',
        message: '',
        type: 'warning',
    });

    const showModal = (
        title: string,
        message: string,
        type: 'warning' | 'danger' | 'success' | 'info' = 'warning',
        onConfirm?: () => void,
        confirmText: string = 'Entendido',
        showCancel: boolean = false,
        cancelText: string = 'Cancelar'
    ) => {
        setModalConfig({ visible: true, title, message, type, onConfirm, confirmText, showCancel, cancelText });
    };

    useEffect(() => {
        if (id) {
            fetchPackageData();
            checkActivePackage();
        }
    }, [id]);

    const fetchPackageData = async () => {
        try {
            const { data, error } = await supabase
                .from('lesson_packages')
                .select(`
                    id,
                    name,
                    total_lessons,
                    vehicle_type,
                    total_price,
                    discount_percent,
                    instructor:instructors!inner(id, full_name, photo_url)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setPackageData(data as any);
        } catch (error) {
            console.error('Error fetching package:', error);
            showModal('Erro', 'Pacote não encontrado', 'danger', () => router.back());
        } finally {
            setLoading(false);
        }
    };

    const checkActivePackage = async () => {
        if (!user) return;

        const { data } = await supabase
            .from('student_packages')
            .select('id')
            .eq('student_id', user.id)
            .eq('status', 'active')
            .single();

        setHasActivePackage(!!data);
    };

    const handlePurchase = async () => {
        if (!user || !packageData) return;

        if (hasActivePackage) {
            showModal(
                'Pacote Ativo',
                'Você já possui um pacote ativo. Finalize ou cancele o pacote atual antes de comprar outro.',
                'warning'
            );
            return;
        }

        showModal(
            'Confirmar Compra',
            `Deseja comprar o pacote "${packageData.name}" por ${formatPrice(packageData.total_price)}?`,
            'info',
            confirmPurchase,
            'Confirmar',
            true
        );
    };

    const confirmPurchase = async () => {
        if (!user || !packageData) return;

        setPurchasing(true);
        try {
            const { error } = await supabase.from('student_packages').insert({
                student_id: user.id,
                package_id: packageData.id,
                instructor_id: packageData.instructor.id,
                lessons_total: packageData.total_lessons,
                lessons_used: 0,
                vehicle_type: packageData.vehicle_type,
                total_paid: packageData.total_price,
                status: 'active',
            });

            if (error) throw error;

            showModal(
                'Compra Realizada! 🎉',
                `Você adquiriu ${packageData.total_lessons} aulas com ${packageData.instructor.full_name}. Agora você pode agendar suas aulas!`,
                'success',
                () => router.replace('/(tabs)/aulas'),
                'Ver Minhas Aulas'
            );
        } catch (error: any) {
            console.error('Purchase error:', error);
            Alert.alert('Erro', error.message || 'Não foi possível completar a compra');
        } finally {
            setPurchasing(false);
        }
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
                <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 100 }} />
            </SafeAreaView>
        );
    }

    if (!packageData) return null;

    const pricePerLesson = packageData.total_price / packageData.total_lessons;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: theme.card }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Comprar Pacote</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Package Card */}
                <View style={[styles.packageCard, { backgroundColor: theme.card }]}>
                    <View style={styles.packageHeader}>
                        <Text style={[styles.packageName, { color: theme.text }]}>
                            {packageData.name}
                        </Text>
                        <View style={[styles.discountBadge, { backgroundColor: '#dcfce7' }]}>
                            <Text style={styles.discountText}>-{packageData.discount_percent}%</Text>
                        </View>
                    </View>

                    <Text style={[styles.instructorName, { color: theme.textSecondary }]}>
                        com {packageData.instructor.full_name}
                    </Text>

                    <View style={styles.detailsRow}>
                        <View style={styles.detailItem}>
                            <Ionicons name="school-outline" size={24} color={theme.primary} />
                            <Text style={[styles.detailValue, { color: theme.text }]}>
                                {packageData.total_lessons}
                            </Text>
                            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>aulas</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Ionicons
                                name={packageData.vehicle_type === 'instructor' ? 'car-sport' : 'key'}
                                size={24}
                                color={theme.primary}
                            />
                            <Text style={[styles.detailValue, { color: theme.text }]}>
                                {packageData.vehicle_type === 'instructor' ? 'Instrutor' : 'Próprio'}
                            </Text>
                            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>veículo</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Ionicons name="pricetag-outline" size={24} color={theme.primary} />
                            <Text style={[styles.detailValue, { color: theme.text }]}>
                                {formatPrice(pricePerLesson)}
                            </Text>
                            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>por aula</Text>
                        </View>
                    </View>
                </View>

                {/* Total */}
                <View style={[styles.totalCard, { backgroundColor: theme.primaryLight }]}>
                    <Text style={[styles.totalLabel, { color: theme.primary }]}>Total a pagar</Text>
                    <Text style={[styles.totalValue, { color: theme.primary }]}>
                        {formatPrice(packageData.total_price)}
                    </Text>
                </View>

                {/* Warning if has active package */}
                {hasActivePackage && (
                    <View style={[styles.warningCard, { backgroundColor: '#fef3c7' }]}>
                        <Ionicons name="warning-outline" size={24} color="#b45309" />
                        <Text style={styles.warningText}>
                            Você já possui um pacote ativo. Finalize-o antes de comprar outro.
                        </Text>
                    </View>
                )}

                {/* Benefits */}
                <View style={[styles.benefitsCard, { backgroundColor: theme.card }]}>
                    <Text style={[styles.benefitsTitle, { color: theme.text }]}>Vantagens do Pacote</Text>
                    <View style={styles.benefitItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                        <Text style={[styles.benefitText, { color: theme.text }]}>
                            Economia de {packageData.discount_percent}% no valor total
                        </Text>
                    </View>
                    <View style={styles.benefitItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                        <Text style={[styles.benefitText, { color: theme.text }]}>
                            Agende suas aulas quando preferir
                        </Text>
                    </View>
                    <View style={styles.benefitItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                        <Text style={[styles.benefitText, { color: theme.text }]}>
                            Sem prazo de validade
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Buy Button */}
            <View style={[styles.footer, { backgroundColor: theme.background }]}>
                <TouchableOpacity
                    style={[
                        styles.buyButton,
                        { backgroundColor: hasActivePackage ? theme.textMuted : theme.primary }
                    ]}
                    onPress={handlePurchase}
                    disabled={purchasing || hasActivePackage}
                >
                    {purchasing ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="cart" size={22} color="#fff" />
                            <Text style={styles.buyButtonText}>
                                {hasActivePackage ? 'Você já tem um pacote' : 'Comprar Pacote'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <ConfirmationModal
                visible={modalConfig.visible}
                onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                confirmText={modalConfig.confirmText}
                cancelText={modalConfig.cancelText}
                onConfirm={() => {
                    modalConfig.onConfirm?.();
                    setModalConfig(prev => ({ ...prev, visible: false }));
                }}
                onCancel={modalConfig.showCancel ? () => setModalConfig(prev => ({ ...prev, visible: false })) : undefined}
            />
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
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    packageCard: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 16,
    },
    packageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    packageName: {
        fontSize: 22,
        fontWeight: '700',
        flex: 1,
    },
    discountBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    discountText: {
        color: '#166534',
        fontSize: 14,
        fontWeight: '700',
    },
    instructorName: {
        fontSize: 15,
        marginBottom: 20,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    detailItem: {
        alignItems: 'center',
        gap: 6,
    },
    detailValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    detailLabel: {
        fontSize: 12,
    },
    totalCard: {
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    totalValue: {
        fontSize: 32,
        fontWeight: '800',
    },
    warningCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 14,
        marginBottom: 16,
    },
    warningText: {
        flex: 1,
        color: '#92400e',
        fontSize: 13,
    },
    benefitsCard: {
        padding: 20,
        borderRadius: 16,
    },
    benefitsTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    benefitText: {
        fontSize: 14,
    },
    footer: {
        padding: 20,
        paddingBottom: 30,
    },
    buyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 56,
        borderRadius: 16,
    },
    buyButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
});
