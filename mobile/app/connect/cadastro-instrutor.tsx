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

export default function InstructorRegistrationScreen() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const { refresh } = useInstructorStatus();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

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
        vehicle_transmission: 'manual' as 'manual' | 'automatic',
        // Class Info
        categories: [] as string[],
        price_per_lesson: '',
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
            Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!formData.vehicle_model) {
            Alert.alert('Erro', 'Informe o modelo do veículo');
            return false;
        }
        return true;
    };

    const validateStep3 = () => { // Renamed from validateStep2 to validateStep3 because now we have 3 steps
        if (formData.categories.length === 0) {
            Alert.alert('Erro', 'Selecione pelo menos uma categoria');
            return false;
        }
        if (!formData.price_per_lesson) {
            Alert.alert('Erro', 'Informe o preço da aula');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateStep3()) return;

        setLoading(true);
        try {
            // Get user's profile photo to use as initial instructor photo
            const { data: profile } = await supabase
                .from('profiles')
                .select('avatar_url')
                .eq('id', user?.id)
                .single();

            const { error } = await supabase.from('instructors').insert({
                user_id: user?.id,
                full_name: formData.full_name,
                phone: formData.phone,
                cpf: formData.cpf,
                city: formData.city,
                state: formData.state.toUpperCase(),
                bio: formData.bio,
                // Vehicle Info
                vehicle_model: formData.vehicle_model,
                vehicle_transmission: formData.vehicle_transmission,
                // Class Info
                categories: formData.categories,
                price_per_lesson: parseFloat(formData.price_per_lesson?.replace(',', '.') || '0'),
                lesson_duration_minutes: 50, // Default duration
                status: 'pending',
                photo_url: profile?.avatar_url,
                is_verified: false,
                created_at: new Date().toISOString(),
            } as any); // Cast to any because of potential type mismatch with generated types

            if (error) throw error;

            await refresh(); // Refresh status hook

            Alert.alert(
                'Cadastro Enviado!',
                'Seu cadastro de instrutor foi enviado para análise. Você será notificado assim que for aprovado.',
                [{ text: 'OK', onPress: () => router.replace('/(tabs)/perfil') }]
            );

        } catch (error: any) {
            console.error('Registration error:', error);
            Alert.alert('Erro', error.message || 'Não foi possível enviar o cadastro.');
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
                <TextInput
                    style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.inputBorder }]}
                    value={formData.vehicle_model}
                    onChangeText={(text) => handleInputChange('vehicle_model', text)}
                    placeholder="Ex: Chevrolet Onix 2023"
                    placeholderTextColor={theme.textMuted}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Câmbio</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                        style={[
                            styles.categoryChip,
                            {
                                flex: 1,
                                height: 56,
                                borderRadius: 12,
                                backgroundColor: formData.vehicle_transmission === 'manual' ? theme.primary : theme.card,
                                borderColor: formData.vehicle_transmission === 'manual' ? theme.primary : theme.inputBorder
                            }
                        ]}
                        onPress={() => handleInputChange('vehicle_transmission', 'manual')}
                    >
                        <Text style={[styles.categoryChipText, { fontSize: 16, color: formData.vehicle_transmission === 'manual' ? '#fff' : theme.text }]}>
                            Manual
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.categoryChip,
                            {
                                flex: 1,
                                height: 56,
                                borderRadius: 12,
                                backgroundColor: formData.vehicle_transmission === 'automatic' ? theme.primary : theme.card,
                                borderColor: formData.vehicle_transmission === 'automatic' ? theme.primary : theme.inputBorder
                            }
                        ]}
                        onPress={() => handleInputChange('vehicle_transmission', 'automatic')}
                    >
                        <Text style={[styles.categoryChipText, { fontSize: 16, color: formData.vehicle_transmission === 'automatic' ? '#fff' : theme.text }]}>
                            Automático
                        </Text>
                    </TouchableOpacity>
                </View>
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

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Preço por aula (50 min)</Text>
                <View style={[styles.priceInputContainer, { backgroundColor: theme.card, borderColor: theme.inputBorder }]}>
                    <Text style={[styles.currencyPrefix, { color: theme.textMuted }]}>R$</Text>
                    <TextInput
                        style={[styles.priceInput, { color: theme.text }]}
                        value={formData.price_per_lesson}
                        onChangeText={(text) => handleInputChange('price_per_lesson', text)}
                        placeholder="0,00"
                        placeholderTextColor={theme.textMuted}
                        keyboardType="numeric"
                    />
                </View>
                <Text style={[styles.helperText, { color: theme.textMuted }]}>
                    Valor que o aluno pagará por aula. A plataforma retém 15%.
                </Text>
            </View>

            <View style={styles.summaryCard}>
                <Text style={[styles.summaryTitle, { color: theme.text }]}>Resumo Financeiro</Text>
                <View style={styles.summaryRow}>
                    <Text style={{ color: theme.textSecondary }}>Valor Aluno:</Text>
                    <Text style={{ color: theme.text, fontWeight: 'bold' }}>
                        R$ {parseFloat(formData.price_per_lesson || '0').toFixed(2)}
                    </Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={{ color: theme.textSecondary }}>Taxa Vrumi (15%):</Text>
                    <Text style={{ color: '#ef4444' }}>
                        - R$ {(parseFloat(formData.price_per_lesson || '0') * 0.15).toFixed(2)}
                    </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
                <View style={styles.summaryRow}>
                    <Text style={{ color: theme.textSecondary }}>Você recebe:</Text>
                    <Text style={{ color: '#10b981', fontWeight: 'bold', fontSize: 18 }}>
                        R$ {(parseFloat(formData.price_per_lesson || '0') * 0.85).toFixed(2)}
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
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 16,
        marginVertical: 12,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
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
});
