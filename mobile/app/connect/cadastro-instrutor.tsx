import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useInstructorStatus } from '../../hooks/useInstructorStatus';
import VehiclePicker from '../../components/VehiclePicker';
import { getVehicleModel } from '../../data/vehicleModels';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function InstructorRegistrationScreen() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const { refresh } = useInstructorStatus();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Unified Modal State
    const [modalConfig, setModalConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: 'warning' | 'danger' | 'success' | 'info';
        onConfirm?: () => void;
    }>({
        visible: false,
        title: '',
        message: '',
        type: 'warning',
    });

    const showModal = (title: string, message: string, type: 'warning' | 'danger' | 'success' | 'info' = 'warning', onConfirm?: () => void) => {
        setModalConfig({ visible: true, title, message, type, onConfirm });
    };

    // Form Data
    const [formData, setFormData] = useState({
        full_name: user?.user_metadata?.full_name || '',
        phone: '',
        cpf: '',
        city: '',
        state: '',
        bio: '',
        // Vehicle Info
        vehicle_model: '',
        vehicle_model_id: null as string | null,
        vehicle_transmission: 'manual' as 'manual' | 'automatic',
        vehicle_color: '',
        vehicle_has_ac: false,
        vehicle_steering_type: 'hydraulic' as 'hydraulic' | 'electric' | 'mechanical',
        vehicle_is_adapted: false,
        // Class Info
        categories: [] as string[],
        price_instructor_car: '',
        price_student_car: '',
    });

    const AVAILABLE_CATEGORIES = ['A', 'B', 'C', 'D', 'E'];

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleCategory = (category: string) => {
        setFormData(prev => {
            const current = prev.categories;
            if (current.includes(category)) {
                return { ...prev, categories: current.filter(c => c !== category) };
            } else {
                return { ...prev, categories: [...current, category] };
            }
        });
    };

    const validateStep1 = () => {
        if (!formData.full_name || !formData.phone || !formData.cpf || !formData.city || !formData.state) {
            showModal('Erro', 'Preencha todos os campos obrigatórios', 'warning');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!formData.vehicle_model) {
            showModal('Erro', 'Informe o modelo do veículo', 'warning');
            return false;
        }
        return true;
    };

    const validateStep3 = () => { // Renamed from validateStep2 to validateStep3 because now we have 3 steps
        if (formData.categories.length === 0) {
            showModal('Erro', 'Selecione pelo menos uma categoria', 'warning');
            return false;
        }
        if (!formData.price_instructor_car || !formData.price_student_car) {
            showModal('Erro', 'Informe ambos os preços de aula', 'warning');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateStep3()) return;
        if (!user) {
            showModal('Erro', 'Usuário não autenticado', 'danger');
            return;
        }

        setLoading(true);
        try {
            // Get user's profile photo to use as initial instructor photo
            const { data: profile } = await supabase
                .from('profiles')
                .select('avatar_url')
                .eq('id', user.id)
                .single();

            const { error } = await supabase.from('instructors').insert({
                user_id: user.id,
                full_name: formData.full_name,
                email: user.email,
                phone: formData.phone,
                cpf: formData.cpf,
                city: formData.city,
                state: formData.state.toUpperCase(),
                bio: formData.bio,
                // Vehicle Info
                vehicle_model: formData.vehicle_model,
                vehicle_model_id: formData.vehicle_model_id,
                vehicle_transmission: formData.vehicle_transmission,
                vehicle_color: formData.vehicle_color || null,
                vehicle_has_ac: formData.vehicle_has_ac,
                vehicle_steering_type: formData.vehicle_steering_type,
                vehicle_is_adapted: formData.vehicle_is_adapted,
                // Class Info
                categories: formData.categories as any,
                price_per_lesson: parseFloat(formData.price_instructor_car?.replace(',', '.') || '0'),
                price_instructor_car: parseFloat(formData.price_instructor_car?.replace(',', '.') || '0'),
                price_student_car: parseFloat(formData.price_student_car?.replace(',', '.') || '0'),
                lesson_duration_minutes: 50,
                status: 'pending',
                photo_url: profile?.avatar_url,
                is_verified: false,
                created_at: new Date().toISOString(),
            } as any);

            if (error) throw error;

            await refresh(); // Refresh status hook

            showModal(
                'Cadastro Enviado!',
                'Seu cadastro de instrutor foi enviado para análise. Você será notificado assim que for aprovado.',
                'success',
                () => router.replace('/(tabs)/perfil')
            );

        } catch (error: any) {
            console.error('Registration error:', error);

            // Detailed handling for duplicate CPF (code 23505)
            if (error.code === '23505' || error.message?.includes('instructors_cpf_key')) {
                showModal(
                    'CPF Já Cadastrado',
                    'Este documento já está vinculado a uma conta de instrutor no Vrumi. Se você já tem um cadastro, tente fazer login ou entre em contato com nosso suporte.',
                    'warning'
                );
            } else {
                showModal('Erro', error.message || 'Não foi possível enviar o cadastro.', 'danger');
            }
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Dados Pessoais</Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Nome Completo</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.inputBorder }]}
                    value={formData.full_name}
                    onChangeText={(text) => handleInputChange('full_name', text)}
                    placeholder="Seu nome completo"
                    placeholderTextColor={theme.textMuted}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>CPF</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.inputBorder }]}
                    value={formData.cpf}
                    onChangeText={(text) => handleInputChange('cpf', text)}
                    placeholder="000.000.000-00"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Telefone / WhatsApp</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.inputBorder }]}
                    value={formData.phone}
                    onChangeText={(text) => handleInputChange('phone', text)}
                    placeholder="(00) 00000-0000"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="phone-pad"
                />
            </View>

            <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 2, marginRight: 12 }]}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Cidade</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.inputBorder }]}
                        value={formData.city}
                        onChangeText={(text) => handleInputChange('city', text)}
                        placeholder="Sua cidade"
                        placeholderTextColor={theme.textMuted}
                    />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Estado</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.inputBorder }]}
                        value={formData.state}
                        onChangeText={(text) => handleInputChange('state', text)}
                        placeholder="UF"
                        placeholderTextColor={theme.textMuted}
                        maxLength={2}
                        autoCapitalize="characters"
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Sobre você (Bio)</Text>
                <TextInput
                    style={[
                        styles.input,
                        styles.textArea,
                        { backgroundColor: theme.card, color: theme.text, borderColor: theme.inputBorder }
                    ]}
                    value={formData.bio}
                    onChangeText={(text) => handleInputChange('bio', text)}
                    placeholder="Conte um pouco sobre sua experiência..."
                    placeholderTextColor={theme.textMuted}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />
            </View>

            <TouchableOpacity
                style={[styles.nextButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                    if (validateStep1()) setStep(2);
                }}
            >
                <Text style={styles.nextButtonText}>Próximo</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Dados do Veículo</Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Modelo do Veículo</Text>
                <VehiclePicker
                    selectedModelId={formData.vehicle_model_id}
                    onSelect={(model) => {
                        setFormData(prev => ({
                            ...prev,
                            vehicle_model_id: model.id,
                            vehicle_model: model.displayName,
                        }));
                    }}
                    placeholder="Selecione o modelo"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Cor do Veículo</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.inputBorder }]}
                    value={formData.vehicle_color}
                    onChangeText={(text) => handleInputChange('vehicle_color', text)}
                    placeholder="Ex: Prata, Branco, Preto"
                    placeholderTextColor={theme.textMuted}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Câmbio</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                        style={[
                            styles.optionButton,
                            {
                                flex: 1,
                                backgroundColor: formData.vehicle_transmission === 'manual' ? theme.primary : theme.card,
                                borderColor: formData.vehicle_transmission === 'manual' ? theme.primary : theme.inputBorder
                            }
                        ]}
                        onPress={() => handleInputChange('vehicle_transmission', 'manual')}
                    >
                        <Text style={{ fontSize: 15, fontWeight: '600', color: formData.vehicle_transmission === 'manual' ? '#fff' : theme.text }}>
                            Manual
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.optionButton,
                            {
                                flex: 1,
                                backgroundColor: formData.vehicle_transmission === 'automatic' ? theme.primary : theme.card,
                                borderColor: formData.vehicle_transmission === 'automatic' ? theme.primary : theme.inputBorder
                            }
                        ]}
                        onPress={() => handleInputChange('vehicle_transmission', 'automatic')}
                    >
                        <Text style={{ fontSize: 15, fontWeight: '600', color: formData.vehicle_transmission === 'automatic' ? '#fff' : theme.text }}>
                            Automático
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Tipo de Direção</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['hydraulic', 'electric', 'mechanical'] as const).map((type) => {
                        const labels = { hydraulic: 'Hidráulica', electric: 'Elétrica', mechanical: 'Mecânica' };
                        const isSelected = formData.vehicle_steering_type === type;
                        return (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.optionButton,
                                    {
                                        flex: 1,
                                        backgroundColor: isSelected ? theme.primary : theme.card,
                                        borderColor: isSelected ? theme.primary : theme.inputBorder
                                    }
                                ]}
                                onPress={() => handleInputChange('vehicle_steering_type', type)}
                            >
                                <Text style={{ fontSize: 13, fontWeight: '600', color: isSelected ? '#fff' : theme.text }}>
                                    {labels[type]}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Toggle Options */}
            <View style={styles.toggleRow}>
                <TouchableOpacity
                    style={[
                        styles.toggleOption,
                        {
                            backgroundColor: formData.vehicle_has_ac ? '#dcfce7' : theme.card,
                            borderColor: formData.vehicle_has_ac ? '#10b981' : theme.inputBorder
                        }
                    ]}
                    onPress={() => handleInputChange('vehicle_has_ac', !formData.vehicle_has_ac)}
                >
                    <Ionicons name={formData.vehicle_has_ac ? "checkmark-circle" : "snow-outline"} size={24} color={formData.vehicle_has_ac ? '#10b981' : theme.textMuted} />
                    <Text style={[styles.toggleText, { color: formData.vehicle_has_ac ? '#166534' : theme.text }]}>Ar Condicionado</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.toggleOption,
                        {
                            backgroundColor: formData.vehicle_is_adapted ? '#dbeafe' : theme.card,
                            borderColor: formData.vehicle_is_adapted ? '#3b82f6' : theme.inputBorder
                        }
                    ]}
                    onPress={() => handleInputChange('vehicle_is_adapted', !formData.vehicle_is_adapted)}
                >
                    <Ionicons name={formData.vehicle_is_adapted ? "checkmark-circle" : "settings-outline"} size={24} color={formData.vehicle_is_adapted ? '#3b82f6' : theme.textMuted} />
                    <Text style={[styles.toggleText, { color: formData.vehicle_is_adapted ? '#1e40af' : theme.text }]}>Comandos Duplos</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={[styles.backButtonAuth, { backgroundColor: theme.card }]}
                    onPress={() => setStep(1)}
                >
                    <Ionicons name="arrow-back" size={20} color={theme.text} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.nextButton, { backgroundColor: theme.primary, flex: 1 }]}
                    onPress={() => {
                        if (validateStep2()) setStep(3);
                    }}
                >
                    <Text style={styles.nextButtonText}>Próximo</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Aulas e Preços</Text>

            <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 12 }]}>
                Categorias atendidas
            </Text>
            <View style={styles.categoriesContainer}>
                {AVAILABLE_CATEGORIES.map((cat) => {
                    const isSelected = formData.categories.includes(cat);
                    return (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryChip,
                                {
                                    backgroundColor: isSelected ? theme.primary : theme.card,
                                    borderColor: isSelected ? theme.primary : theme.inputBorder
                                }
                            ]}
                            onPress={() => toggleCategory(cat)}
                        >
                            <Text style={[
                                styles.categoryChipText,
                                { color: isSelected ? '#fff' : theme.text }
                            ]}>{cat}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Price for Instructor's Car */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                    🚗 Preço - Seu Carro (50 min)
                </Text>
                <View style={[styles.priceInputContainer, { backgroundColor: theme.card, borderColor: theme.inputBorder }]}>
                    <Text style={[styles.currencyPrefix, { color: theme.textMuted }]}>R$</Text>
                    <TextInput
                        style={[styles.priceInput, { color: theme.text }]}
                        value={formData.price_instructor_car}
                        onChangeText={(text) => handleInputChange('price_instructor_car', text)}
                        placeholder="80,00"
                        placeholderTextColor={theme.textMuted}
                        keyboardType="numeric"
                    />
                </View>
                <Text style={[styles.helperText, { color: theme.textMuted }]}>
                    Valor quando o aluno usa seu veículo.
                </Text>
            </View>

            {/* Price for Student's Car */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                    🔑 Preço - Carro do Aluno (50 min)
                </Text>
                <View style={[styles.priceInputContainer, { backgroundColor: theme.card, borderColor: theme.inputBorder }]}>
                    <Text style={[styles.currencyPrefix, { color: theme.textMuted }]}>R$</Text>
                    <TextInput
                        style={[styles.priceInput, { color: theme.text }]}
                        value={formData.price_student_car}
                        onChangeText={(text) => handleInputChange('price_student_car', text)}
                        placeholder="65,00"
                        placeholderTextColor={theme.textMuted}
                        keyboardType="numeric"
                    />
                </View>
                <Text style={[styles.helperText, { color: theme.textMuted }]}>
                    Valor quando o aluno traz o próprio veículo (geralmente menor).
                </Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
                <Text style={[styles.summaryTitle, { color: theme.text }]}>Resumo Financeiro</Text>

                <Text style={[styles.summarySubtitle, { color: theme.textSecondary }]}>Seu carro (você recebe):</Text>
                <View style={styles.summaryRow}>
                    <Text style={{ color: theme.textMuted }}>Valor - 15% taxa:</Text>
                    <Text style={{ color: '#10b981', fontWeight: 'bold', fontSize: 16 }}>
                        R$ {(parseFloat(formData.price_instructor_car || '0') * 0.85).toFixed(2)}
                    </Text>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

                <Text style={[styles.summarySubtitle, { color: theme.textSecondary }]}>Carro do aluno (você recebe):</Text>
                <View style={styles.summaryRow}>
                    <Text style={{ color: theme.textMuted }}>Valor - 15% taxa:</Text>
                    <Text style={{ color: '#10b981', fontWeight: 'bold', fontSize: 16 }}>
                        R$ {(parseFloat(formData.price_student_car || '0') * 0.85).toFixed(2)}
                    </Text>
                </View>
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={[styles.backButtonAuth, { backgroundColor: theme.card }]}
                    onPress={() => setStep(2)}
                >
                    <Ionicons name="arrow-back" size={20} color={theme.text} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: theme.primary }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Finalizar Cadastro</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.headerButton, { backgroundColor: theme.card }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="close" size={22} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.progressBar}>
                    <View style={[styles.progressStep, { backgroundColor: theme.primary }]} />
                    <View style={[
                        styles.progressStep,
                        { backgroundColor: step >= 2 ? theme.primary : theme.cardBorder }
                    ]} />
                    <View style={[
                        styles.progressStep,
                        { backgroundColor: step >= 3 ? theme.primary : theme.cardBorder }
                    ]} />
                </View>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.titleContainer}>
                        <Text style={[styles.title, { color: theme.text }]}>Seja um Instrutor Vrumi</Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                            {step === 1 ? 'Primeiro, conte-nos quem é você' :
                                step === 2 ? 'Agora, sobre seu veículo' :
                                    'Por fim, defina suas categorias e preços'}
                        </Text>
                    </View>

                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                </ScrollView>
            </KeyboardAvoidingView>

            <ConfirmationModal
                visible={modalConfig.visible}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                confirmText="Entendido"
                onConfirm={() => {
                    modalConfig.onConfirm?.();
                    setModalConfig(prev => ({ ...prev, visible: false }));
                }}
                onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
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
        paddingHorizontal: 20,
        paddingVertical: 12,
        justifyContent: 'space-between',
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressBar: {
        flexDirection: 'row',
        gap: 8,
    },
    progressStep: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    titleContainer: {
        marginTop: 20,
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
    },
    stepContainer: {
        gap: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    inputGroup: {
        marginBottom: 4,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        height: 52,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    textArea: {
        height: 120,
        paddingTop: 16,
    },
    row: {
        flexDirection: 'row',
    },
    categoriesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    categoryChip: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryChipText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    priceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        height: 52,
        paddingHorizontal: 16,
    },
    currencyPrefix: {
        fontSize: 16,
        marginRight: 8,
        fontWeight: '600',
    },
    priceInput: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
    },
    helperText: {
        fontSize: 12,
        marginTop: 6,
    },
    summaryCard: {
        padding: 16,
        borderRadius: 16,
        marginVertical: 12,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    summarySubtitle: {
        fontSize: 13,
        fontWeight: '500',
        marginTop: 4,
        marginBottom: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    divider: {
        height: 1,
        marginVertical: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    backButtonAuth: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    submitButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    optionButton: {
        height: 52,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    toggleOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    toggleText: {
        fontSize: 13,
        fontWeight: '600',
    },
});
