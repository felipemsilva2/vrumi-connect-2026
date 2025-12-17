import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

interface InstructorPricing {
    price_instructor_car: number | null;
    price_student_car: number | null;
    price_per_lesson: number;
}

export default function CriarPacoteScreen() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const params = useLocalSearchParams<{ id?: string }>();
    const isEditing = !!params.id;

    const [loading, setLoading] = useState(false);
    const [instructorId, setInstructorId] = useState<string | null>(null);
    const [pricing, setPricing] = useState<InstructorPricing | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        total_lessons: '5',
        vehicle_type: 'instructor' as 'instructor' | 'student',
        discount_percent: '5',
    });

    const LESSON_OPTIONS = [5, 10, 15, 20];
    const DISCOUNT_OPTIONS = [5, 10, 15, 20];

    useEffect(() => {
        fetchInstructorData();
        if (isEditing) {
            fetchPackageData();
        }
    }, []);

    const fetchInstructorData = async () => {
        if (!user?.id) return;

        const { data, error } = await supabase
            .from('instructors')
            .select('id, price_instructor_car, price_student_car, price_per_lesson')
            .eq('user_id', user.id)
            .single();

        if (!error && data) {
            setInstructorId(data.id);
            setPricing({
                price_instructor_car: data.price_instructor_car,
                price_student_car: data.price_student_car,
                price_per_lesson: data.price_per_lesson,
            });
        }
    };

    const fetchPackageData = async () => {
        const { data, error } = await supabase
            .from('lesson_packages')
            .select('*')
            .eq('id', params.id)
            .single();

        if (!error && data) {
            setFormData({
                name: data.name,
                total_lessons: data.total_lessons.toString(),
                vehicle_type: data.vehicle_type,
                discount_percent: data.discount_percent.toString(),
            });
        }
    };

    const getBasePrice = () => {
        if (!pricing) return 0;
        if (formData.vehicle_type === 'student' && pricing.price_student_car) {
            return pricing.price_student_car;
        }
        return pricing.price_instructor_car || pricing.price_per_lesson;
    };

    const calculateTotalPrice = () => {
        const basePrice = getBasePrice();
        const lessons = parseInt(formData.total_lessons) || 0;
        const discount = parseFloat(formData.discount_percent) || 0;
        const fullPrice = basePrice * lessons;
        return fullPrice * (1 - discount / 100);
    };

    const calculateSavings = () => {
        const basePrice = getBasePrice();
        const lessons = parseInt(formData.total_lessons) || 0;
        const fullPrice = basePrice * lessons;
        return fullPrice - calculateTotalPrice();
    };

    const handleSubmit = async () => {
        if (!instructorId) {
            Alert.alert('Erro', 'Instrutor não encontrado');
            return;
        }
        if (!formData.name.trim()) {
            Alert.alert('Erro', 'Digite um nome para o pacote');
            return;
        }

        setLoading(true);
        try {
            const packageData = {
                instructor_id: instructorId,
                name: formData.name.trim(),
                total_lessons: parseInt(formData.total_lessons),
                vehicle_type: formData.vehicle_type,
                total_price: calculateTotalPrice(),
                discount_percent: parseFloat(formData.discount_percent),
                is_active: true,
            };

            if (isEditing) {
                const { error } = await supabase
                    .from('lesson_packages')
                    .update(packageData)
                    .eq('id', params.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('lesson_packages')
                    .insert(packageData);
                if (error) throw error;
            }

            Alert.alert(
                'Sucesso!',
                isEditing ? 'Pacote atualizado!' : 'Pacote criado!',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            console.error('Error saving package:', error);
            Alert.alert('Erro', error.message || 'Não foi possível salvar o pacote');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

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
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {isEditing ? 'Editar Pacote' : 'Criar Pacote'}
                </Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Package Name */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>
                        Nome do Pacote
                    </Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
                        value={formData.name}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                        placeholder="Ex: Pacote Iniciante"
                        placeholderTextColor={theme.textMuted}
                    />
                </View>

                {/* Number of Lessons */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>
                        Quantidade de Aulas
                    </Text>
                    <View style={styles.optionsRow}>
                        {LESSON_OPTIONS.map((num) => (
                            <TouchableOpacity
                                key={num}
                                style={[
                                    styles.optionButton,
                                    {
                                        backgroundColor: formData.total_lessons === num.toString() ? theme.primary : theme.card,
                                        borderColor: formData.total_lessons === num.toString() ? theme.primary : theme.cardBorder,
                                    }
                                ]}
                                onPress={() => setFormData(prev => ({ ...prev, total_lessons: num.toString() }))}
                            >
                                <Text style={[
                                    styles.optionText,
                                    { color: formData.total_lessons === num.toString() ? '#fff' : theme.text }
                                ]}>
                                    {num}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Vehicle Type */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>
                        Tipo de Veículo
                    </Text>
                    <View style={styles.vehicleOptions}>
                        <TouchableOpacity
                            style={[
                                styles.vehicleOption,
                                {
                                    backgroundColor: formData.vehicle_type === 'instructor' ? theme.primaryLight : theme.card,
                                    borderColor: formData.vehicle_type === 'instructor' ? theme.primary : theme.cardBorder,
                                }
                            ]}
                            onPress={() => setFormData(prev => ({ ...prev, vehicle_type: 'instructor' }))}
                        >
                            <Ionicons
                                name="car-sport"
                                size={24}
                                color={formData.vehicle_type === 'instructor' ? theme.primary : theme.textMuted}
                            />
                            <Text style={[styles.vehicleText, { color: theme.text }]}>Seu Carro</Text>
                            <Text style={[styles.vehiclePrice, { color: theme.textMuted }]}>
                                {formatCurrency(pricing?.price_instructor_car || pricing?.price_per_lesson || 0)}/aula
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.vehicleOption,
                                {
                                    backgroundColor: formData.vehicle_type === 'student' ? theme.primaryLight : theme.card,
                                    borderColor: formData.vehicle_type === 'student' ? theme.primary : theme.cardBorder,
                                }
                            ]}
                            onPress={() => setFormData(prev => ({ ...prev, vehicle_type: 'student' }))}
                        >
                            <Ionicons
                                name="key"
                                size={24}
                                color={formData.vehicle_type === 'student' ? theme.primary : theme.textMuted}
                            />
                            <Text style={[styles.vehicleText, { color: theme.text }]}>Carro Aluno</Text>
                            <Text style={[styles.vehiclePrice, { color: theme.textMuted }]}>
                                {formatCurrency(pricing?.price_student_car || (pricing?.price_per_lesson || 0) * 0.8)}/aula
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Discount */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>
                        Desconto do Pacote
                    </Text>
                    <View style={styles.optionsRow}>
                        {DISCOUNT_OPTIONS.map((num) => (
                            <TouchableOpacity
                                key={num}
                                style={[
                                    styles.optionButton,
                                    {
                                        backgroundColor: formData.discount_percent === num.toString() ? theme.primary : theme.card,
                                        borderColor: formData.discount_percent === num.toString() ? theme.primary : theme.cardBorder,
                                    }
                                ]}
                                onPress={() => setFormData(prev => ({ ...prev, discount_percent: num.toString() }))}
                            >
                                <Text style={[
                                    styles.optionText,
                                    { color: formData.discount_percent === num.toString() ? '#fff' : theme.text }
                                ]}>
                                    {num}%
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Summary */}
                <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
                    <Text style={[styles.summaryTitle, { color: theme.text }]}>Resumo do Pacote</Text>

                    <View style={styles.summaryRow}>
                        <Text style={{ color: theme.textSecondary }}>
                            {formData.total_lessons} aulas x {formatCurrency(getBasePrice())}
                        </Text>
                        <Text style={{ color: theme.text }}>
                            {formatCurrency(getBasePrice() * parseInt(formData.total_lessons || '0'))}
                        </Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={{ color: theme.textSecondary }}>Desconto ({formData.discount_percent}%)</Text>
                        <Text style={{ color: '#10b981' }}>
                            - {formatCurrency(calculateSavings())}
                        </Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

                    <View style={styles.summaryRow}>
                        <Text style={[styles.totalLabel, { color: theme.text }]}>Valor do Pacote</Text>
                        <Text style={[styles.totalValue, { color: theme.primary }]}>
                            {formatCurrency(calculateTotalPrice())}
                        </Text>
                    </View>

                    <View style={[styles.savingsBox, { backgroundColor: '#dcfce7' }]}>
                        <Ionicons name="trending-down" size={20} color="#10b981" />
                        <Text style={styles.savingsText}>
                            Aluno economiza {formatCurrency(calculateSavings())}
                        </Text>
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: theme.primary }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={22} color="#fff" />
                            <Text style={styles.submitButtonText}>
                                {isEditing ? 'Salvar Alterações' : 'Criar Pacote'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
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
        paddingBottom: 40,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
    },
    input: {
        height: 52,
        borderRadius: 14,
        borderWidth: 1,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    optionsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    optionButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionText: {
        fontSize: 16,
        fontWeight: '700',
    },
    vehicleOptions: {
        flexDirection: 'row',
        gap: 12,
    },
    vehicleOption: {
        flex: 1,
        padding: 16,
        borderRadius: 14,
        borderWidth: 2,
        alignItems: 'center',
        gap: 8,
    },
    vehicleText: {
        fontSize: 14,
        fontWeight: '600',
    },
    vehiclePrice: {
        fontSize: 12,
    },
    summaryCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    totalValue: {
        fontSize: 22,
        fontWeight: '700',
    },
    savingsBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 16,
    },
    savingsText: {
        color: '#10b981',
        fontSize: 14,
        fontWeight: '600',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 56,
        borderRadius: 16,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
