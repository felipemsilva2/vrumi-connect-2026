import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

interface LessonPackage {
    id: string;
    name: string;
    total_lessons: number;
    vehicle_type: string;
    total_price: number;
    discount_percent: number;
    is_active: boolean;
}

export default function PrecosEPacotesScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [instructorId, setInstructorId] = useState<string | null>(null);

    // Prices
    const [priceInstructorCar, setPriceInstructorCar] = useState('');
    const [priceStudentCar, setPriceStudentCar] = useState('');

    // Packages
    const [packages, setPackages] = useState<LessonPackage[]>([]);

    // New Package Modal
    const [showModal, setShowModal] = useState(false);
    const [editingPackage, setEditingPackage] = useState<LessonPackage | null>(null);
    const [packageName, setPackageName] = useState('');
    const [packageLessons, setPackageLessons] = useState('5');
    const [packageVehicle, setPackageVehicle] = useState<'instructor' | 'student'>('instructor');
    const [packageDiscount, setPackageDiscount] = useState('10');
    const [savingPackage, setSavingPackage] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user?.id) return;

        try {
            const { data: instructor } = await supabase
                .from('instructors')
                .select('id, price_instructor_car, price_student_car, price_per_lesson')
                .eq('user_id', user.id)
                .single();

            if (!instructor) {
                Alert.alert('Erro', 'Perfil de instrutor não encontrado');
                router.back();
                return;
            }

            setInstructorId(instructor.id);
            setPriceInstructorCar(String(instructor.price_instructor_car || instructor.price_per_lesson || ''));
            setPriceStudentCar(String(instructor.price_student_car || ''));

            const { data: packagesData } = await supabase
                .from('lesson_packages')
                .select('*')
                .eq('instructor_id', instructor.id)
                .order('created_at', { ascending: false });

            setPackages((packagesData || []).map(pkg => ({
                ...pkg,
                discount_percent: pkg.discount_percent || 0
            } as any)));
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSavePrices = async () => {
        if (!instructorId) return;

        const priceIC = parseFloat(priceInstructorCar) || 0;
        const priceSC = parseFloat(priceStudentCar) || 0;

        if (priceIC < 50) {
            Alert.alert('Erro', 'O preço mínimo é R$ 50,00');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('instructors')
                .update({
                    price_instructor_car: priceIC,
                    price_student_car: priceSC || priceIC * 0.85,
                    price_per_lesson: priceIC,
                })
                .eq('id', instructorId);

            if (error) throw error;
            Alert.alert('Sucesso', 'Preços atualizados!');
        } catch (error: any) {
            Alert.alert('Erro', error.message);
        } finally {
            setSaving(false);
        }
    };

    const openNewPackageModal = () => {
        setEditingPackage(null);
        setPackageName('');
        setPackageLessons('5');
        setPackageVehicle('instructor');
        setPackageDiscount('10');
        setShowModal(true);
    };

    const openEditPackageModal = (pkg: LessonPackage) => {
        setEditingPackage(pkg);
        setPackageName(pkg.name);
        setPackageLessons(String(pkg.total_lessons));
        setPackageVehicle(pkg.vehicle_type as 'instructor' | 'student');
        setPackageDiscount(String(pkg.discount_percent));
        setShowModal(true);
    };

    const handleSavePackage = async () => {
        if (!instructorId || !packageName.trim()) {
            Alert.alert('Erro', 'Preencha o nome do pacote');
            return;
        }

        const basePrice = packageVehicle === 'instructor'
            ? parseFloat(priceInstructorCar) || 0
            : parseFloat(priceStudentCar) || 0;

        const lessons = parseInt(packageLessons) || 5;
        const discount = parseFloat(packageDiscount) || 0;
        const totalPrice = basePrice * lessons * (1 - discount / 100);

        setSavingPackage(true);
        try {
            if (editingPackage) {
                await supabase
                    .from('lesson_packages')
                    .update({
                        name: packageName,
                        total_lessons: lessons,
                        vehicle_type: packageVehicle,
                        discount_percent: discount,
                        total_price: totalPrice,
                    })
                    .eq('id', editingPackage.id);
            } else {
                await supabase
                    .from('lesson_packages')
                    .insert({
                        instructor_id: instructorId,
                        name: packageName,
                        total_lessons: lessons,
                        vehicle_type: packageVehicle,
                        discount_percent: discount,
                        total_price: totalPrice,
                        is_active: true,
                    });
            }

            setShowModal(false);
            fetchData();
            Alert.alert('Sucesso', editingPackage ? 'Pacote atualizado!' : 'Pacote criado!');
        } catch (error: any) {
            Alert.alert('Erro', error.message);
        } finally {
            setSavingPackage(false);
        }
    };

    const handleDeletePackage = (pkg: LessonPackage) => {
        Alert.alert('Excluir Pacote', `Tem certeza que deseja excluir "${pkg.name}"?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir',
                style: 'destructive',
                onPress: async () => {
                    await supabase.from('lesson_packages').delete().eq('id', pkg.id);
                    fetchData();
                },
            },
        ]);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const calculatePackagePrice = () => {
        const basePrice = packageVehicle === 'instructor'
            ? parseFloat(priceInstructorCar) || 0
            : parseFloat(priceStudentCar) || 0;
        const lessons = parseInt(packageLessons) || 0;
        const discount = parseFloat(packageDiscount) || 0;
        return basePrice * lessons * (1 - discount / 100);
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 100 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.card }]} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Preços & Pacotes</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Prices Section */}
                <View style={[styles.section, { backgroundColor: theme.card }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="cash-outline" size={22} color={theme.primary} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Meus Preços</Text>
                    </View>

                    <View style={styles.priceRow}>
                        <View style={styles.priceLabel}>
                            <Ionicons name="car" size={18} color={theme.textMuted} />
                            <Text style={[styles.priceLabelText, { color: theme.text }]}>Carro do Instrutor</Text>
                        </View>
                        <View style={[styles.priceInput, { backgroundColor: theme.background, borderColor: theme.cardBorder }]}>
                            <Text style={{ color: theme.textMuted }}>R$</Text>
                            <TextInput
                                style={[styles.priceInputField, { color: theme.text }]}
                                value={priceInstructorCar}
                                onChangeText={setPriceInstructorCar}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={theme.textMuted}
                            />
                        </View>
                    </View>

                    <View style={styles.priceRow}>
                        <View style={styles.priceLabel}>
                            <Ionicons name="key" size={18} color={theme.textMuted} />
                            <Text style={[styles.priceLabelText, { color: theme.text }]}>Carro do Aluno</Text>
                        </View>
                        <View style={[styles.priceInput, { backgroundColor: theme.background, borderColor: theme.cardBorder }]}>
                            <Text style={{ color: theme.textMuted }}>R$</Text>
                            <TextInput
                                style={[styles.priceInputField, { color: theme.text }]}
                                value={priceStudentCar}
                                onChangeText={setPriceStudentCar}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={theme.textMuted}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: theme.primary }]}
                        onPress={handleSavePrices}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Salvar Preços</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Packages Section */}
                <View style={[styles.section, { backgroundColor: theme.card }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="pricetag-outline" size={22} color={theme.primary} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Meus Pacotes</Text>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: theme.primary }]}
                            onPress={openNewPackageModal}
                        >
                            <Ionicons name="add" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {packages.length === 0 ? (
                        <TouchableOpacity style={[styles.emptyState, { backgroundColor: theme.background }]} onPress={openNewPackageModal}>
                            <Ionicons name="gift-outline" size={36} color={theme.textMuted} />
                            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                                Crie pacotes com desconto para atrair mais alunos
                            </Text>
                            <Text style={[styles.emptyAction, { color: theme.primary }]}>+ Criar Pacote</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.packagesGrid}>
                            {packages.map(pkg => (
                                <TouchableOpacity
                                    key={pkg.id}
                                    style={[styles.packageCard, { backgroundColor: theme.background, borderColor: theme.primaryLight }]}
                                    onPress={() => openEditPackageModal(pkg)}
                                    onLongPress={() => handleDeletePackage(pkg)}
                                >
                                    <View style={styles.packageHeader}>
                                        <Text style={[styles.packageName, { color: theme.text }]}>{pkg.name}</Text>
                                        <View style={[styles.discountBadge, { backgroundColor: '#dcfce7' }]}>
                                            <Text style={styles.discountText}>-{pkg.discount_percent}%</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.packageInfo, { color: theme.textMuted }]}>
                                        {pkg.total_lessons} aulas • {pkg.vehicle_type === 'instructor' ? '🚗' : '🔑'}
                                    </Text>
                                    <Text style={[styles.packagePrice, { color: theme.primary }]}>
                                        {formatCurrency(pkg.total_price)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Package Modal */}
            <Modal visible={showModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                {editingPackage ? 'Editar Pacote' : 'Novo Pacote'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Ionicons name="close" size={24} color={theme.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: theme.text }]}>Nome do Pacote</Text>
                        <TextInput
                            style={[styles.textInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.cardBorder }]}
                            value={packageName}
                            onChangeText={setPackageName}
                            placeholder="Ex: Pacote Básico"
                            placeholderTextColor={theme.textMuted}
                        />

                        <Text style={[styles.inputLabel, { color: theme.text }]}>Número de Aulas</Text>
                        <View style={styles.optionsRow}>
                            {['5', '10', '15', '20'].map(num => (
                                <TouchableOpacity
                                    key={num}
                                    style={[
                                        styles.optionButton,
                                        { backgroundColor: packageLessons === num ? theme.primary : theme.background, borderColor: theme.cardBorder }
                                    ]}
                                    onPress={() => setPackageLessons(num)}
                                >
                                    <Text style={{ color: packageLessons === num ? '#fff' : theme.text, fontWeight: '600' }}>{num}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.inputLabel, { color: theme.text }]}>Tipo de Veículo</Text>
                        <View style={styles.optionsRow}>
                            <TouchableOpacity
                                style={[
                                    styles.vehicleOption,
                                    { backgroundColor: packageVehicle === 'instructor' ? theme.primary : theme.background, borderColor: theme.cardBorder }
                                ]}
                                onPress={() => setPackageVehicle('instructor')}
                            >
                                <Text style={{ color: packageVehicle === 'instructor' ? '#fff' : theme.text }}>🚗 Instrutor</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.vehicleOption,
                                    { backgroundColor: packageVehicle === 'student' ? theme.primary : theme.background, borderColor: theme.cardBorder }
                                ]}
                                onPress={() => setPackageVehicle('student')}
                            >
                                <Text style={{ color: packageVehicle === 'student' ? '#fff' : theme.text }}>🔑 Aluno</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: theme.text }]}>Desconto (%)</Text>
                        <View style={styles.optionsRow}>
                            {['5', '10', '15', '20'].map(num => (
                                <TouchableOpacity
                                    key={num}
                                    style={[
                                        styles.optionButton,
                                        { backgroundColor: packageDiscount === num ? theme.primary : theme.background, borderColor: theme.cardBorder }
                                    ]}
                                    onPress={() => setPackageDiscount(num)}
                                >
                                    <Text style={{ color: packageDiscount === num ? '#fff' : theme.text, fontWeight: '600' }}>{num}%</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={[styles.previewCard, { backgroundColor: theme.background }]}>
                            <Text style={[styles.previewLabel, { color: theme.textMuted }]}>Preço do Pacote</Text>
                            <Text style={[styles.previewPrice, { color: theme.primary }]}>
                                {formatCurrency(calculatePackagePrice())}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.confirmButton, { backgroundColor: theme.primary }]}
                            onPress={handleSavePackage}
                            disabled={savingPackage}
                        >
                            {savingPackage ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.confirmButtonText}>
                                    {editingPackage ? 'Salvar Alterações' : 'Criar Pacote'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    backButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },

    section: { borderRadius: 16, padding: 20, marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    sectionTitle: { fontSize: 17, fontWeight: '600', flex: 1 },
    addButton: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

    priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    priceLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    priceLabelText: { fontSize: 15 },
    priceInput: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
    priceInputField: { fontSize: 16, fontWeight: '600', width: 70, textAlign: 'right' },

    saveButton: { height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

    emptyState: { alignItems: 'center', padding: 30, borderRadius: 12, gap: 10 },
    emptyText: { fontSize: 14, textAlign: 'center' },
    emptyAction: { fontSize: 15, fontWeight: '600' },

    packagesGrid: { gap: 12 },
    packageCard: { padding: 16, borderRadius: 14, borderWidth: 2 },
    packageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    packageName: { fontSize: 16, fontWeight: '600' },
    discountBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    discountText: { color: '#166534', fontSize: 12, fontWeight: '700' },
    packageInfo: { fontSize: 13, marginBottom: 6 },
    packagePrice: { fontSize: 20, fontWeight: '700' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: '700' },

    inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
    textInput: { height: 48, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, borderWidth: 1 },
    optionsRow: { flexDirection: 'row', gap: 10 },
    optionButton: { flex: 1, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    vehicleOption: { flex: 1, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },

    previewCard: { marginTop: 24, padding: 16, borderRadius: 12, alignItems: 'center' },
    previewLabel: { fontSize: 13 },
    previewPrice: { fontSize: 28, fontWeight: '800', marginTop: 4 },

    confirmButton: { height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
    confirmButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
