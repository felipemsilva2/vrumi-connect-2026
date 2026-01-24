import { useState, useEffect, useCallback } from 'react';
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
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import ConfirmationModal from '../../components/ConfirmationModal';
import VehiclePicker from '../../components/VehiclePicker';
import { getVehicleModelByName } from '../../data/vehicleModels';
import * as ImagePicker from 'expo-image-picker';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://kyuaxjkokntdmcxjurhm.supabase.co';

interface InstructorData {
    id: string;
    full_name: string;
    phone: string;
    city: string;
    state: string;
    bio: string;
    vehicle_model: string;
    vehicle_model_id: string | null;
    vehicle_transmission: 'manual' | 'automatic';
    vehicle_color: string;
    vehicle_has_ac: boolean;
    vehicle_steering_type: 'hydraulic' | 'electric' | 'mechanical';
    vehicle_is_adapted: boolean;
    categories: string[];
    price_instructor_car: number;
    price_student_car: number;
}

export default function EditInstructorProfileScreen() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'vehicle' | 'pricing'>('info');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [vehiclePhotoUrl, setVehiclePhotoUrl] = useState<string | null>(null);
    const [uploadingVehiclePhoto, setUploadingVehiclePhoto] = useState(false);

    const [formData, setFormData] = useState<InstructorData>({
        id: '',
        full_name: '',
        phone: '',
        city: '',
        state: '',
        bio: '',
        vehicle_model: '',
        vehicle_model_id: null,
        vehicle_transmission: 'manual',
        vehicle_color: '',
        vehicle_has_ac: false,
        vehicle_steering_type: 'hydraulic',
        vehicle_is_adapted: false,
        categories: [],
        price_instructor_car: 0,
        price_student_car: 0,
    });

    const AVAILABLE_CATEGORIES = ['A', 'B', 'C', 'D', 'E'];

    const fetchInstructorData = useCallback(async () => {
        if (!user?.id) return;

        try {
            const { data, error } = await supabase
                .from('instructors')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) throw error;

            if (data) {
                const d = data as any; // Cast to any since new fields may not exist in generated types yet
                // Try to match existing vehicle model to our list
                const matchedModel = getVehicleModelByName(d.vehicle_model);
                setFormData({
                    id: d.id,
                    full_name: d.full_name || '',
                    phone: d.phone || '',
                    city: d.city || '',
                    state: d.state || '',
                    bio: d.bio || '',
                    vehicle_model: d.vehicle_model || '',
                    vehicle_model_id: d.vehicle_model_id || matchedModel?.id || null,
                    vehicle_transmission: d.vehicle_transmission || 'manual',
                    vehicle_color: d.vehicle_color || '',
                    vehicle_has_ac: d.vehicle_has_ac || false,
                    vehicle_steering_type: d.vehicle_steering_type || 'hydraulic',
                    vehicle_is_adapted: d.vehicle_is_adapted || false,
                    categories: d.categories || [],
                    price_instructor_car: d.price_instructor_car || 0,
                    price_student_car: d.price_student_car || 0,
                });
                // Load existing vehicle photo
                if (d.vehicle_photo_url) {
                    setVehiclePhotoUrl(d.vehicle_photo_url);
                }
            }
        } catch (error) {
            console.error('Error fetching instructor:', error);
            setErrorMessage('Não foi possível carregar seus dados.');
            setShowErrorModal(true);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchInstructorData();
    }, [fetchInstructorData]);

    const handleInputChange = (field: keyof InstructorData, value: any) => {
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

    const pickAndUploadVehiclePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                setErrorMessage('Permissão negada para acessar a galeria.');
                setShowErrorModal(true);
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.6, // Compress image
            });

            if (result.canceled || !result.assets?.[0]) return;

            setUploadingVehiclePhoto(true);

            // Get file extension and create filename
            const image = result.assets[0];
            const fileExt = image.uri.split('.').pop() || 'jpg';
            const fileName = `vehicle_${formData.id}_${Date.now()}.${fileExt}`;

            // Fetch image as blob then convert to ArrayBuffer (same as avatar upload)
            const response = await fetch(image.uri);
            const blob = await response.blob();
            const arrayBuffer = await new Response(blob).arrayBuffer();

            // Upload to Supabase
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, arrayBuffer, {
                    contentType: `image/${fileExt}`,
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            const publicUrl = urlData.publicUrl;

            // Update database
            await supabase
                .from('instructors')
                .update({ vehicle_photo_url: publicUrl } as any)
                .eq('id', formData.id);

            setVehiclePhotoUrl(publicUrl);
        } catch (error: any) {
            console.error('Error uploading vehicle photo:', error);
            setErrorMessage('Erro ao fazer upload da foto.');
            setShowErrorModal(true);
        } finally {
            setUploadingVehiclePhoto(false);
        }
    };

    const handleSave = async () => {
        if (!formData.id) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('instructors')
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone,
                    city: formData.city,
                    state: formData.state.toUpperCase(),
                    bio: formData.bio,
                    vehicle_model: formData.vehicle_model,
                    vehicle_model_id: formData.vehicle_model_id,
                    vehicle_transmission: formData.vehicle_transmission,
                    vehicle_color: formData.vehicle_color || null,
                    vehicle_has_ac: formData.vehicle_has_ac,
                    vehicle_steering_type: formData.vehicle_steering_type,
                    vehicle_is_adapted: formData.vehicle_is_adapted,
                    categories: formData.categories as any,
                    price_instructor_car: formData.price_instructor_car,
                    price_student_car: formData.price_student_car,
                    price_per_lesson: formData.price_instructor_car,
                } as any)
                .eq('id', formData.id);

            if (error) throw error;

            setShowSuccessModal(true);
        } catch (error: any) {
            console.error('Error saving:', error);
            setErrorMessage(error.message || 'Não foi possível salvar as alterações.');
            setShowErrorModal(true);
        } finally {
            setSaving(false);
        }
    };

    const renderInfoTab = () => (
        <View style={styles.tabContent}>
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
                    style={[styles.input, styles.textArea, { backgroundColor: theme.card, color: theme.text, borderColor: theme.inputBorder }]}
                    value={formData.bio}
                    onChangeText={(text) => handleInputChange('bio', text)}
                    placeholder="Conte um pouco sobre sua experiência..."
                    placeholderTextColor={theme.textMuted}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />
            </View>
        </View>
    );

    const renderVehicleTab = () => (
        <View style={styles.tabContent}>
            {/* Vehicle Photo Upload */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Foto do Veículo</Text>
                <TouchableOpacity
                    style={[styles.vehiclePhotoUpload, { backgroundColor: theme.card, borderColor: theme.inputBorder }]}
                    onPress={pickAndUploadVehiclePhoto}
                    disabled={uploadingVehiclePhoto}
                >
                    {uploadingVehiclePhoto ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                    ) : vehiclePhotoUrl ? (
                        <Image source={{ uri: vehiclePhotoUrl }} style={styles.vehiclePhotoPreview} resizeMode="cover" />
                    ) : (
                        <View style={styles.vehiclePhotoPlaceholder}>
                            <Ionicons name="camera" size={32} color={theme.textMuted} />
                            <Text style={[styles.vehiclePhotoText, { color: theme.textMuted }]}>Adicionar foto do carro</Text>
                        </View>
                    )}
                    {vehiclePhotoUrl && (
                        <View style={styles.vehiclePhotoEditBadge}>
                            <Ionicons name="pencil" size={14} color="#fff" />
                        </View>
                    )}
                </TouchableOpacity>
            </View>

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
                <View style={styles.optionsRow}>
                    <TouchableOpacity
                        style={[styles.optionButton, {
                            flex: 1,
                            backgroundColor: formData.vehicle_transmission === 'manual' ? theme.primary : theme.card,
                            borderColor: formData.vehicle_transmission === 'manual' ? theme.primary : theme.inputBorder
                        }]}
                        onPress={() => handleInputChange('vehicle_transmission', 'manual')}
                    >
                        <Text style={{ fontSize: 15, fontWeight: '600', color: formData.vehicle_transmission === 'manual' ? '#fff' : theme.text }}>
                            Manual
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.optionButton, {
                            flex: 1,
                            backgroundColor: formData.vehicle_transmission === 'automatic' ? theme.primary : theme.card,
                            borderColor: formData.vehicle_transmission === 'automatic' ? theme.primary : theme.inputBorder
                        }]}
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
                <View style={styles.optionsRow}>
                    {(['hydraulic', 'electric', 'mechanical'] as const).map((type) => {
                        const labels = { hydraulic: 'Hidráulica', electric: 'Elétrica', mechanical: 'Mecânica' };
                        const isSelected = formData.vehicle_steering_type === type;
                        return (
                            <TouchableOpacity
                                key={type}
                                style={[styles.optionButton, {
                                    flex: 1,
                                    backgroundColor: isSelected ? theme.primary : theme.card,
                                    borderColor: isSelected ? theme.primary : theme.inputBorder
                                }]}
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

            <View style={styles.toggleRow}>
                <TouchableOpacity
                    style={[styles.toggleOption, {
                        backgroundColor: formData.vehicle_has_ac ? '#dcfce7' : theme.card,
                        borderColor: formData.vehicle_has_ac ? '#10b981' : theme.inputBorder
                    }]}
                    onPress={() => handleInputChange('vehicle_has_ac', !formData.vehicle_has_ac)}
                >
                    <Ionicons name={formData.vehicle_has_ac ? "checkmark-circle" : "snow-outline"} size={24} color={formData.vehicle_has_ac ? '#10b981' : theme.textMuted} />
                    <Text style={[styles.toggleText, { color: formData.vehicle_has_ac ? '#166534' : theme.text }]}>Ar Condicionado</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.toggleOption, {
                        backgroundColor: formData.vehicle_is_adapted ? '#dbeafe' : theme.card,
                        borderColor: formData.vehicle_is_adapted ? '#3b82f6' : theme.inputBorder
                    }]}
                    onPress={() => handleInputChange('vehicle_is_adapted', !formData.vehicle_is_adapted)}
                >
                    <Ionicons name={formData.vehicle_is_adapted ? "checkmark-circle" : "settings-outline"} size={24} color={formData.vehicle_is_adapted ? '#3b82f6' : theme.textMuted} />
                    <Text style={[styles.toggleText, { color: formData.vehicle_is_adapted ? '#1e40af' : theme.text }]}>Comandos Duplos</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderPricingTab = () => (
        <View style={styles.tabContent}>
            <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 12 }]}>
                Categorias atendidas
            </Text>
            <View style={styles.categoriesContainer}>
                {AVAILABLE_CATEGORIES.map((cat) => {
                    const isSelected = formData.categories.includes(cat);
                    return (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.categoryChip, {
                                backgroundColor: isSelected ? theme.primary : theme.card,
                                borderColor: isSelected ? theme.primary : theme.inputBorder
                            }]}
                            onPress={() => toggleCategory(cat)}
                        >
                            <Text style={[styles.categoryChipText, { color: isSelected ? '#fff' : theme.text }]}>{cat}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                    🚗 Preço - Seu Carro (50 min)
                </Text>
                <View style={[styles.priceInputContainer, { backgroundColor: theme.card, borderColor: theme.inputBorder }]}>
                    <Text style={[styles.currencyPrefix, { color: theme.textMuted }]}>R$</Text>
                    <TextInput
                        style={[styles.priceInput, { color: theme.text }]}
                        value={formData.price_instructor_car.toString()}
                        onChangeText={(text) => handleInputChange('price_instructor_car', parseFloat(text) || 0)}
                        placeholder="80,00"
                        placeholderTextColor={theme.textMuted}
                        keyboardType="numeric"
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                    🔑 Preço - Carro do Aluno (50 min)
                </Text>
                <View style={[styles.priceInputContainer, { backgroundColor: theme.card, borderColor: theme.inputBorder }]}>
                    <Text style={[styles.currencyPrefix, { color: theme.textMuted }]}>R$</Text>
                    <TextInput
                        style={[styles.priceInput, { color: theme.text }]}
                        value={formData.price_student_car.toString()}
                        onChangeText={(text) => handleInputChange('price_student_car', parseFloat(text) || 0)}
                        placeholder="65,00"
                        placeholderTextColor={theme.textMuted}
                        keyboardType="numeric"
                    />
                </View>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
                <Text style={[styles.summaryTitle, { color: theme.text }]}>Você recebe (após taxa 15%)</Text>
                <View style={styles.summaryRow}>
                    <Text style={{ color: theme.textSecondary }}>Seu carro:</Text>
                    <Text style={{ color: '#10b981', fontWeight: 'bold', fontSize: 16 }}>
                        R$ {(formData.price_instructor_car * 0.85).toFixed(2)}
                    </Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={{ color: theme.textSecondary }}>Carro do aluno:</Text>
                    <Text style={{ color: '#10b981', fontWeight: 'bold', fontSize: 16 }}>
                        R$ {(formData.price_student_car * 0.85).toFixed(2)}
                    </Text>
                </View>
            </View>
        </View>
    );

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
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.headerButton, { backgroundColor: theme.card }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Editar Perfil</Text>
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

            {/* Tabs */}
            <View style={[styles.tabBar, { backgroundColor: theme.card }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'info' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab('info')}
                >
                    <Ionicons name="person-outline" size={20} color={activeTab === 'info' ? theme.primary : theme.textMuted} />
                    <Text style={[styles.tabText, { color: activeTab === 'info' ? theme.primary : theme.textMuted }]}>Dados</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'vehicle' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab('vehicle')}
                >
                    <Ionicons name="car-outline" size={20} color={activeTab === 'vehicle' ? theme.primary : theme.textMuted} />
                    <Text style={[styles.tabText, { color: activeTab === 'vehicle' ? theme.primary : theme.textMuted }]}>Veículo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'pricing' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab('pricing')}
                >
                    <Ionicons name="cash-outline" size={20} color={activeTab === 'pricing' ? theme.primary : theme.textMuted} />
                    <Text style={[styles.tabText, { color: activeTab === 'pricing' ? theme.primary : theme.textMuted }]}>Preços</Text>
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
                    {activeTab === 'info' && renderInfoTab()}
                    {activeTab === 'vehicle' && renderVehicleTab()}
                    {activeTab === 'pricing' && renderPricingTab()}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Success Modal */}
            <ConfirmationModal
                visible={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    router.back();
                }}
                title="Sucesso!"
                message="Perfil atualizado com sucesso."
                icon="checkmark-circle-outline"
                type="success"
                confirmText="OK"
                onConfirm={() => {
                    setShowSuccessModal(false);
                    router.back();
                }}
            />

            {/* Error Modal */}
            <ConfirmationModal
                visible={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                title="Erro"
                message={errorMessage}
                icon="alert-circle-outline"
                type="danger"
                confirmText="OK"
                onConfirm={() => setShowErrorModal(false)}
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
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: 20,
        borderRadius: 12,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 6,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    tabContent: {
        gap: 16,
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
    optionsRow: {
        flexDirection: 'row',
        gap: 12,
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
        fontSize: 12,
        fontWeight: '600',
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
    summaryCard: {
        padding: 16,
        borderRadius: 16,
        marginTop: 12,
    },
    summaryTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    vehiclePhotoUpload: {
        width: '100%',
        height: 140,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        overflow: 'hidden',
        position: 'relative',
    },
    vehiclePhotoPreview: {
        width: '100%',
        height: '100%',
    },
    vehiclePhotoPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    vehiclePhotoText: {
        fontSize: 14,
        fontWeight: '500',
    },
    vehiclePhotoEditBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: '#10b981',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
