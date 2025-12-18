import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
    TextInput,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../src/lib/supabase';

interface StudentProfile {
    id: string;
    full_name: string;
    avatar_url: string | null;
}

interface StudentPackage {
    id: string;
    lessons_total: number;
    lessons_used: number;
    status: string;
    vehicle_type: string;
    total_paid: number;
    created_at: string;
    package_name?: string;
}

export default function StudentDetailsScreen() {
    const { id: studentId } = useLocalSearchParams<{ id: string }>();
    const { theme, isDark } = useTheme();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState<StudentProfile | null>(null);
    const [activePackage, setActivePackage] = useState<StudentPackage | null>(null);
    const [packageTemplates, setPackageTemplates] = useState<any[]>([]);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [showPlansModal, setShowPlansModal] = useState(false);
    const [adjustValue, setAdjustValue] = useState('');
    const [adjustType, setAdjustType] = useState<'total' | 'used'>('used');
    const [submitting, setSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user?.id || !studentId) return;

        try {
            // 1. Get student profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .eq('id', studentId)
                .single();

            if (profile) {
                setStudent({
                    id: profile.id,
                    full_name: profile.full_name || 'Aluno',
                    avatar_url: profile.avatar_url,
                });
            }

            // 2. Get instructor ID
            const { data: instructor } = await supabase
                .from('instructors')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!instructor) return;

            // 3. Get instructor's package templates
            const { data: templates } = await supabase
                .from('lesson_packages')
                .select('*')
                .eq('instructor_id', instructor.id)
                .eq('is_active', true);

            setPackageTemplates(templates || []);

            // 4. Get active package with this instructor
            const { data: pkg } = await supabase
                .from('student_packages')
                .select(`
                    *,
                    package:lesson_packages(name)
                `)
                .eq('student_id', studentId)
                .eq('instructor_id', instructor.id)
                .eq('status', 'active')
                .maybeSingle();

            if (pkg) {
                setActivePackage({
                    ...pkg,
                    created_at: pkg.created_at || new Date().toISOString(),
                    package_name: (pkg.package as any)?.name || 'Pacote Personalizado'
                } as any);
            } else {
                setActivePackage(null);
            }

        } catch (error) {
            console.error('Error fetching student details:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id, studentId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAdjustBalance = async () => {
        if (!activePackage || !adjustValue) return;

        const value = parseInt(adjustValue);
        if (isNaN(value)) return;

        setSubmitting(true);
        try {
            const updates: any = {};
            if (adjustType === 'total') {
                updates.lessons_total = value;
            } else {
                updates.lessons_used = value;
            }

            const { error } = await supabase
                .from('student_packages')
                .update(updates)
                .eq('id', activePackage.id);

            if (error) throw error;

            Alert.alert('Sucesso', 'Saldo atualizado com sucesso!');
            setShowAdjustModal(false);
            fetchData();
        } catch (error) {
            console.error('Error adjusting balance:', error);
            Alert.alert('Erro', 'Não foi possível atualizar o saldo.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCompletePackage = async () => {
        if (!activePackage) return;

        Alert.alert(
            'Finalizar Pacote',
            'Deseja marcar este pacote como concluído? O aluno não poderá mais agendar aulas usando o saldo deste pacote.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Finalizar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('student_packages')
                                .update({ status: 'completed' })
                                .eq('id', activePackage.id);

                            if (error) throw error;
                            fetchData();
                        } catch (error) {
                            Alert.alert('Erro', 'Não foi possível finalizar o pacote.');
                        }
                    }
                }
            ]
        );
    };

    const handleSwitchPackage = async (newTemplate: any) => {
        if (!activePackage) return;

        Alert.alert(
            'Confirmar Troca',
            `Deseja trocar o plano para "${newTemplate.name}"? As aulas totais serão atualizadas para ${newTemplate.total_lessons}.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        setSubmitting(true);
                        try {
                            const { error } = await supabase
                                .from('student_packages')
                                .update({
                                    package_id: newTemplate.id,
                                    lessons_total: newTemplate.total_lessons,
                                })
                                .eq('id', activePackage.id);

                            if (error) throw error;
                            Alert.alert('Sucesso', 'Plano atualizado!');
                            setShowPlansModal(false);
                            fetchData();
                        } catch (error) {
                            Alert.alert('Erro', 'Não foi possível trocar o plano.');
                        } finally {
                            setSubmitting(false);
                        }
                    }
                }
            ]
        );
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
                <Text style={[styles.headerTitle, { color: theme.text }]}>Detalhes do Aluno</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Header */}
                <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
                    {student?.avatar_url ? (
                        <Image source={{ uri: student.avatar_url }} style={styles.largeAvatar} />
                    ) : (
                        <View style={[styles.largeAvatarPlaceholder, { backgroundColor: theme.primary }]}>
                            <Text style={styles.largeAvatarInitial}>{student?.full_name.charAt(0)}</Text>
                        </View>
                    )}
                    <Text style={[styles.profileName, { color: theme.text }]}>{student?.full_name}</Text>
                    <View style={styles.statRow}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.text }]}>{activePackage ? activePackage.lessons_total - activePackage.lessons_used : 0}</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Aulas Restantes</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.text }]}>{activePackage?.lessons_used || 0}</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Aulas Feitas</Text>
                        </View>
                    </View>
                </View>

                {/* Active Plan Section */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Plano Ativo</Text>
                {activePackage ? (
                    <View style={[styles.packageCard, { backgroundColor: theme.card }]}>
                        <View style={styles.packageHeader}>
                            <View>
                                <Text style={[styles.packageName, { color: theme.text }]}>{activePackage.package_name}</Text>
                                <Text style={[styles.packageMeta, { color: theme.textMuted }]}>
                                    Desde {new Date(activePackage.created_at).toLocaleDateString('pt-BR')}
                                </Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: '#dcfce7' }]}>
                                <Text style={[styles.statusText, { color: '#166534' }]}>Ativo</Text>
                            </View>
                        </View>

                        <View style={styles.progressSection}>
                            <View style={styles.progressInfo}>
                                <Text style={[styles.progressText, { color: theme.textSecondary }]}>Uso do Pacote</Text>
                                <Text style={[styles.progressCount, { color: theme.text }]}>
                                    {activePackage.lessons_used} / {activePackage.lessons_total}
                                </Text>
                            </View>
                            <View style={[styles.progressBar, { backgroundColor: theme.background }]}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        {
                                            backgroundColor: theme.primary,
                                            width: `${(activePackage.lessons_used / activePackage.lessons_total) * 100}%`
                                        }
                                    ]}
                                />
                            </View>
                        </View>

                        <View style={styles.packageActions}>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: theme.primaryLight }]}
                                onPress={() => {
                                    setAdjustType('used');
                                    setAdjustValue(activePackage.lessons_used.toString());
                                    setShowAdjustModal(true);
                                }}
                            >
                                <Ionicons name="create-outline" size={18} color={theme.primary} />
                                <Text style={[styles.actionButtonText, { color: theme.primary }]}>Ajustar Uso</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: theme.primaryLight }]}
                                onPress={() => {
                                    setAdjustType('total');
                                    setAdjustValue(activePackage.lessons_total.toString());
                                    setShowAdjustModal(true);
                                }}
                            >
                                <Ionicons name="add-circle-outline" size={18} color={theme.primary} />
                                <Text style={[styles.actionButtonText, { color: theme.primary }]}>Mudar Total</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: theme.primaryLight }]}
                                onPress={() => setShowPlansModal(true)}
                            >
                                <Ionicons name="swap-horizontal-outline" size={18} color={theme.primary} />
                                <Text style={[styles.actionButtonText, { color: theme.primary }]}>Trocar</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.completeButton, { borderTopColor: theme.cardBorder }]}
                            onPress={handleCompletePackage}
                        >
                            <Text style={styles.completeButtonText}>Finalizar Pacote Manualmente</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
                        <Ionicons name="alert-circle-outline" size={32} color={theme.textMuted} />
                        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                            Este aluno não possui nenhum pacote ativo com você no momento.
                        </Text>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Adjustment Modal */}
            <Modal visible={showAdjustModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                            {adjustType === 'total' ? 'Ajustar Total de Aulas' : 'Ajustar Aulas Usadas'}
                        </Text>
                        <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
                            Digite o novo valor para o saldo do aluno.
                        </Text>

                        <TextInput
                            style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.cardBorder }]}
                            value={adjustValue}
                            onChangeText={setAdjustValue}
                            keyboardType="numeric"
                            autoFocus
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalCancel, { backgroundColor: theme.background }]}
                                onPress={() => setShowAdjustModal(false)}
                            >
                                <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalConfirm, { backgroundColor: theme.primary }]}
                                onPress={handleAdjustBalance}
                                disabled={submitting}
                            >
                                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalConfirmText}>Salvar</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Plans Selection Modal */}
            <Modal visible={showPlansModal} transparent animationType="fade">
                <View style={[styles.modalOverlay, { justifyContent: 'center' }]}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Escolher Novo Plano</Text>
                            <TouchableOpacity onPress={() => setShowPlansModal(false)}>
                                <Ionicons name="close" size={24} color={theme.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 400 }}>
                            {packageTemplates.map(template => (
                                <TouchableOpacity
                                    key={template.id}
                                    style={[
                                        styles.templateItem,
                                        {
                                            backgroundColor: theme.background,
                                            borderColor: activePackage?.package_name === template.name ? theme.primary : theme.cardBorder
                                        }
                                    ]}
                                    onPress={() => handleSwitchPackage(template)}
                                >
                                    <View style={styles.templateInfo}>
                                        <Text style={[styles.templateName, { color: theme.text }]}>{template.name}</Text>
                                        <Text style={[styles.templateMeta, { color: theme.textSecondary }]}>
                                            {template.total_lessons} aulas • {template.vehicle_type === 'instructor' ? 'Carro Instrutor' : 'Carro Aluno'}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    backButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    content: { padding: 20 },

    profileCard: { borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 32 },
    largeAvatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
    largeAvatarPlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    largeAvatarInitial: { fontSize: 40, fontWeight: '800', color: '#fff' },
    profileName: { fontSize: 24, fontWeight: '800', marginBottom: 20 },
    statRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
    statLabel: { fontSize: 12, fontWeight: '600' },
    statDivider: { width: 1, height: 30 },

    sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
    packageCard: { borderRadius: 24, padding: 20 },
    packageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    packageName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
    packageMeta: { fontSize: 12, fontWeight: '500' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 12, fontWeight: '700' },

    progressSection: { marginBottom: 24 },
    progressInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
    progressText: { fontSize: 14, fontWeight: '600' },
    progressCount: { fontSize: 16, fontWeight: '800' },
    progressBar: { height: 10, borderRadius: 5, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 5 },

    packageActions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, borderRadius: 12 },
    actionButtonText: { fontSize: 12, fontWeight: '700' },

    completeButton: { paddingTop: 16, borderTopWidth: 1, alignItems: 'center', marginTop: 10 },
    completeButtonText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },

    emptyCard: { borderRadius: 20, padding: 40, alignItems: 'center', gap: 16 },
    emptyText: { textAlign: 'center', fontSize: 14, lineHeight: 22 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { borderRadius: 24, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
    modalSub: { fontSize: 14, marginBottom: 20 },
    modalInput: { height: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 20, fontSize: 18, fontWeight: '700', marginBottom: 24 },
    modalButtons: { flexDirection: 'row', gap: 12 },
    modalCancel: { flex: 1, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    modalCancelText: { fontWeight: '700' },
    modalConfirm: { flex: 2, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    modalConfirmText: { color: '#fff', fontWeight: '800', fontSize: 16 },

    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    templateItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
    templateInfo: { flex: 1 },
    templateName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    templateMeta: { fontSize: 13, fontWeight: '500' },
});
