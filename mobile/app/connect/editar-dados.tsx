import { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import ConfirmationModal from '../../components/ConfirmationModal';

interface ProfileData {
    full_name: string;
    birth_date: string | null;
    gender: string | null;
    monthly_income: number | null;
}

export default function EditPersonalDataScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

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

    const [formData, setFormData] = useState<ProfileData>({
        full_name: '',
        birth_date: null,
        gender: null,
        monthly_income: null,
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) return;
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('full_name, birth_date, gender, monthly_income')
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;

                if (data) {
                    const profile = data as any;
                    setFormData({
                        full_name: profile.full_name || '',
                        birth_date: profile.birth_date || null,
                        gender: profile.gender || null,
                        monthly_income: profile.monthly_income || null,
                    });
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user?.id]);

    const handleSave = async () => {
        if (!user?.id) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    birth_date: formData.birth_date,
                    gender: formData.gender,
                    monthly_income: formData.monthly_income,
                    updated_at: new Date().toISOString(),
                } as any)
                .eq('id', user.id);

            if (error) {
                // If columns don't exist yet, we guide the user
                if (error.message?.includes('column') && error.message?.includes('does not exist')) {
                    throw new Error('As colunas de LGPD ainda não foram criadas no banco de dados. Por favor, contate o administrador.');
                }
                throw error;
            }

        } catch (error: any) {
            console.error('Error saving profile:', error);
            showModal('Erro', error.message || 'Não foi possível salvar as alterações.', 'danger');
        } finally {
            setSaving(false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
            if (event.type === 'set' && selectedDate) {
                setFormData(prev => ({ ...prev, birth_date: selectedDate.toISOString().split('T')[0] }));
            }
        } else {
            // iOS: Update the date but DON'T close the modal (the wheel is still turning)
            if (selectedDate) {
                setFormData(prev => ({ ...prev, birth_date: selectedDate.toISOString().split('T')[0] }));
            }
        }
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

    const birthDate = formData.birth_date ? new Date(formData.birth_date) : new Date(2000, 0, 1);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.headerButton, { backgroundColor: theme.card }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Corrigir Meus Dados</Text>
                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.primary }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Salvar</Text>
                    )}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
                        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                            Mantenha seus dados atualizados conforme exigido pela LGPD para garantir a precisão das suas informações.
                        </Text>
                    </View>

                    {/* Nome Completo */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Nome Completo</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.inputBorder }]}
                            value={formData.full_name}
                            onChangeText={(text) => setFormData(p => ({ ...p, full_name: text }))}
                            placeholder="Ex: João da Silva"
                            placeholderTextColor={theme.textMuted}
                        />
                    </View>

                    {/* Data de Nascimento */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Data de Nascimento</Text>
                        <TouchableOpacity
                            style={[
                                styles.dateTrigger,
                                { backgroundColor: theme.card, borderColor: theme.inputBorder }
                            ]}
                            onPress={() => setShowDatePicker(true)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.dateTriggerLeft}>
                                <View style={[styles.iconCicle, { backgroundColor: theme.primary + '15' }]}>
                                    <Ionicons name="calendar" size={18} color={theme.primary} />
                                </View>
                                <Text style={[
                                    styles.dateText,
                                    { color: formData.birth_date ? theme.text : theme.textMuted }
                                ]}>
                                    {formData.birth_date
                                        ? new Date(formData.birth_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                                        : 'Selecione sua data de nascimento'
                                    }
                                </Text>
                            </View>
                            <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
                        </TouchableOpacity>

                        {/* Native Date Picker Modal Wrapper for iOS */}
                        {showDatePicker && Platform.OS === 'ios' && (
                            <Modal
                                transparent={true}
                                animationType="fade"
                                visible={showDatePicker}
                            >
                                <View style={styles.iosPickerOverlay}>
                                    <View style={[styles.iosPickerContainer, { backgroundColor: theme.card }]}>
                                        <View style={[styles.iosPickerHeader, { borderBottomColor: theme.cardBorder }]}>
                                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                                <Text style={{ color: '#ef4444', fontWeight: '500' }}>Cancelar</Text>
                                            </TouchableOpacity>
                                            <Text style={[styles.iosPickerTitle, { color: theme.text }]}>Nascimento</Text>
                                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                                <Text style={{ color: theme.primary, fontWeight: '700' }}>Confirmar</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <DateTimePicker
                                            value={birthDate}
                                            mode="date"
                                            display="spinner"
                                            onChange={onDateChange}
                                            maximumDate={new Date()}
                                            locale="pt-BR"
                                            textColor={theme.text}
                                        />
                                    </View>
                                </View>
                            </Modal>
                        )}

                        {/* Direct Native Picker for Android */}
                        {showDatePicker && Platform.OS === 'android' && (
                            <DateTimePicker
                                value={birthDate}
                                mode="date"
                                display="default"
                                onChange={onDateChange}
                                maximumDate={new Date()}
                            />
                        )}
                    </View>

                    {/* Sexo (Gênero) */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Sexo</Text>
                        <View style={styles.genderContainer}>
                            {['Masculino', 'Feminino', 'Outro'].map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.genderOption,
                                        { backgroundColor: theme.card, borderColor: theme.inputBorder },
                                        formData.gender === option && { backgroundColor: theme.primary, borderColor: theme.primary }
                                    ]}
                                    onPress={() => setFormData(p => ({ ...p, gender: option }))}
                                >
                                    <Text style={[
                                        styles.genderText,
                                        { color: theme.text },
                                        formData.gender === option && { color: '#fff' }
                                    ]}>
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Renda Mensal */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Renda Mensal Aproximada</Text>
                        <View style={[styles.priceInputContainer, { backgroundColor: theme.card, borderColor: theme.inputBorder }]}>
                            <Text style={[styles.currencyPrefix, { color: theme.textMuted }]}>R$</Text>
                            <TextInput
                                style={[styles.priceInput, { color: theme.text }]}
                                value={formData.monthly_income?.toString() || ''}
                                onChangeText={(text) => setFormData(p => ({ ...p, monthly_income: parseFloat(text) || null }))}
                                placeholder="0,00"
                                placeholderTextColor={theme.textMuted}
                                keyboardType="numeric"
                            />
                        </View>
                        <Text style={styles.helperText}>Opcional. Usado apenas para fins estatísticos sob LGPD.</Text>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            <ConfirmationModal
                visible={modalConfig.visible}
                onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                confirmText="Entendido"
                onConfirm={() => {
                    modalConfig.onConfirm?.() || (modalConfig.type === 'success' && router.back());
                    setModalConfig(prev => ({ ...prev, visible: false }));
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    headerButton: {
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
    saveButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    infoBox: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        marginBottom: 24,
        alignItems: 'flex-start',
    },
    infoText: {
        fontSize: 13,
        marginLeft: 8,
        flex: 1,
        lineHeight: 18,
    },
    inputGroup: {
        marginBottom: 20,
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
        position: 'relative',
    },
    inputIcon: {
        position: 'absolute',
        right: 16,
    },
    genderContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    genderOption: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    genderText: {
        fontSize: 13,
        fontWeight: '600',
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
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 6,
    },
    dateTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        borderRadius: 14,
        borderWidth: 1,
        paddingHorizontal: 16,
    },
    dateTriggerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconCicle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 15,
        fontWeight: '500',
    },
    iosPickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    iosPickerContainer: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 40,
    },
    iosPickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    iosPickerTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
});
