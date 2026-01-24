import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Linking, RefreshControl, ActivityIndicator, Switch } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { useInstructorStatus } from '../../hooks/useInstructorStatus';
import ConfirmationModal from '../../components/ConfirmationModal';
// Biometric auth disabled temporarily - requires native dev build
// import { useBiometricAuth } from '../../hooks/useBiometricAuth';

interface ProfileStats {
    studyStreak: number;
    totalCards: number;
    accuracyRate: number;
    totalQuestions: number;
    correctAnswers: number;
}

export default function PerfilScreen() {
    const { user, signOut } = useAuth();
    const { theme, isDark, themeMode, setThemeMode, toggleTheme } = useTheme();
    const [stats, setStats] = useState<ProfileStats>({
        studyStreak: 0,
        totalCards: 0,
        accuracyRate: 0,
        totalQuestions: 0,
        correctAnswers: 0,
    });
    const [refreshing, setRefreshing] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const { isInstructor, instructorStatus, instructorInfo, loading: instructorLoading, refresh: refreshInstructor } = useInstructorStatus();

    // Modal states
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);

    // ... biometric code ...

    const fetchStats = useCallback(async () => {
        if (!user?.id) return;

        try {
            // Fetch profile stats
            const { data: profile } = await supabase
                .from('profiles')
                .select('total_flashcards_studied, total_questions_answered, correct_answers')
                .eq('id', user.id)
                .single();

            if (profile) {
                const totalQuestions = profile.total_questions_answered ?? 0;
                const correctAnswers = profile.correct_answers ?? 0;
                const accuracy = totalQuestions > 0
                    ? Math.round((correctAnswers / totalQuestions) * 100)
                    : 0;

                setStats({
                    studyStreak: 0, // Would need to calculate from daily_study_activities
                    totalCards: profile.total_flashcards_studied || 0,
                    accuracyRate: accuracy,
                    totalQuestions: profile.total_questions_answered || 0,
                    correctAnswers: profile.correct_answers || 0,
                });
            }
        } catch (error) {
            console.error('Error fetching profile stats:', error);
        } finally {
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const fetchAvatarUrl = useCallback(async () => {
        if (!user?.id) return;
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('avatar_url')
                .eq('id', user.id)
                .single();
            if (profile?.avatar_url) {
                setAvatarUrl(profile.avatar_url);
            }
        } catch (error) {
            console.error('Error fetching avatar:', error);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchAvatarUrl();
    }, [fetchAvatarUrl]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([
            fetchStats(),
            fetchAvatarUrl(),
            refreshInstructor()
        ]);
        setRefreshing(false);
    }, [fetchStats, fetchAvatarUrl, refreshInstructor]);

    const handleAvatarPress = () => {
        setShowPermissionModal(true);
    };

    const pickAndUploadImage = async () => {
        setShowPermissionModal(false);
        try {
            // Request permissions
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para alterar sua foto.');
                return;
            }

            // Pick image
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (result.canceled || !result.assets[0]) return;

            setUploading(true);
            const image = result.assets[0];
            const fileExt = image.uri.split('.').pop() || 'jpg';
            // Use fixed filename 'avatar' to ensure overwriting via upsert, preventing orphan files
            const fileName = `${user?.id}/avatar.${fileExt}`;

            // Fetch image as blob
            const response = await fetch(image.uri);
            const blob = await response.blob();

            // Convert blob to ArrayBuffer for upload
            const arrayBuffer = await new Response(blob).arrayBuffer();

            // Upload to Supabase
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, arrayBuffer, {
                    contentType: `image/${fileExt}`,
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // Get public URL using a timestamp query param to bust cache
            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

            // Update profile
            await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user!.id);

            setAvatarUrl(publicUrl);
            Alert.alert('Sucesso!', 'Sua foto foi atualizada.');
        } catch (error: any) {
            console.error('Upload error:', error);
            Alert.alert('Erro', error.message || 'Não foi possível atualizar a foto.');
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = async () => {
        setShowLogoutModal(false);
        await signOut();
        router.replace('/(auth)/login');
    };

    const handleStatistics = () => {
        Alert.alert(
            'Estatísticas',
            `📊 Seu desempenho:\n\n` +
            `🎯 Taxa de acerto: ${stats.accuracyRate}%\n` +
            `📚 Cards revisados: ${stats.totalCards}\n` +
            `❓ Questões respondidas: ${stats.totalQuestions}\n` +
            `✅ Respostas corretas: ${stats.correctAnswers}`,
            [{ text: 'OK' }]
        );
    };

    const handleAchievements = () => {
        Alert.alert(
            'Conquistas',
            'Você ainda não desbloqueou nenhuma conquista.\n\nContinue estudando para ganhar medalhas!',
            [{ text: 'Continuar estudando', onPress: () => router.push('/(tabs)/flashcards') }]
        );
    };

    const handleHelp = () => {
        router.push('/connect/suporte');
    };

    const handlePrivacyPolicy = () => {
        router.push('/connect/politica-texto');
    };

    const handleTermsOfUse = () => {
        router.push('/connect/termos');
    };

    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
    const userEmail = user?.email || '';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.primary}
                        colors={[theme.primary]}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Perfil</Text>
                </View>

                {/* User Card */}
                <View style={[styles.userCard, { backgroundColor: theme.card }]}>
                    <TouchableOpacity
                        style={styles.avatarContainer}
                        onPress={handleAvatarPress}
                        disabled={uploading}
                        accessibilityLabel={uploading ? 'Enviando foto' : 'Alterar foto de perfil'}
                        accessibilityRole="button"
                        accessibilityHint="Toque para escolher uma nova foto"
                    >
                        {uploading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} accessibilityLabel="Sua foto de perfil" />
                        ) : (
                            <Text style={styles.avatarText}>
                                {userName.charAt(0).toUpperCase()}
                            </Text>
                        )}
                        <View style={[styles.cameraIcon, { backgroundColor: theme.primary }]}>
                            <Ionicons name="camera" size={14} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={[styles.userName, { color: theme.text }]}>{userName}</Text>
                    <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{userEmail}</Text>
                </View>

                {/* Menu Items */}
                <View style={styles.menuSection}>
                    <Text style={[styles.menuTitle, { color: theme.textSecondary }]}>Vrumi Connect</Text>

                    {/* Browse Instructors */}
                    <TouchableOpacity
                        style={[styles.menuItem, { backgroundColor: theme.card }]}
                        onPress={() => router.push('/(tabs)/buscar')}
                        accessibilityLabel="Encontrar Instrutor"
                        accessibilityRole="button"
                    >
                        <View style={[styles.menuIcon, { backgroundColor: '#e0f2fe' }]}>
                            <Ionicons name="car-sport" size={20} color="#0ea5e9" />
                        </View>
                        <Text style={[styles.menuItemText, { color: theme.text }]}>Encontrar Instrutor</Text>
                        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                    </TouchableOpacity>

                    {/* My Lessons */}
                    <TouchableOpacity
                        style={[styles.menuItem, { backgroundColor: theme.card }]}
                        onPress={() => router.push('/(tabs)/aulas')}
                        accessibilityLabel="Minhas Aulas"
                        accessibilityRole="button"
                    >
                        <View style={[styles.menuIcon, { backgroundColor: '#d1fae5' }]}>
                            <Ionicons name="calendar" size={20} color="#10b981" />
                        </View>
                        <Text style={[styles.menuItemText, { color: theme.text }]}>Minhas Aulas</Text>
                        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                    </TouchableOpacity>

                    {/* My Messages */}
                    <TouchableOpacity
                        style={[styles.menuItem, { backgroundColor: theme.card }]}
                        onPress={() => router.push('/connect/chat')}
                        accessibilityLabel="Minhas Mensagens"
                        accessibilityRole="button"
                    >
                        <View style={[styles.menuIcon, { backgroundColor: '#ffedd5' }]}>
                            <Ionicons name="chatbubble-ellipses" size={20} color="#ea580c" />
                        </View>
                        <Text style={[styles.menuItemText, { color: theme.text }]}>Minhas Mensagens</Text>
                        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                    </TouchableOpacity>


                    {/* Instructor Section - Premium Cards */}
                    {instructorStatus === 'none' && (
                        <TouchableOpacity
                            style={[styles.instructorCard, { backgroundColor: theme.card }]}
                            onPress={() => router.push('/connect/cadastro-instrutor')}
                        >
                            <View style={[styles.instructorCardContent]}>
                                <View style={[styles.instructorIconContainer, { backgroundColor: '#fce7f3' }]}>
                                    <Ionicons name="school" size={24} color="#db2777" />
                                </View>
                                <View style={styles.instructorTextContainer}>
                                    <Text style={[styles.instructorTitle, { color: theme.text }]}>Seja um Instrutor</Text>
                                    <Text style={[styles.instructorSubtitle, { color: theme.textSecondary }]}>
                                        Comece a dar aulas e aumente sua renda conectando-se a novos alunos.
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.instructorArrow}>
                                <Text style={styles.instructorActionText}>Começar</Text>
                                <Ionicons name="arrow-forward" size={16} color="#db2777" />
                            </View>
                        </TouchableOpacity>
                    )}

                    {instructorStatus === 'pending' && (
                        <TouchableOpacity
                            style={[styles.statusCard, { backgroundColor: '#fffbeb', borderColor: '#fcd34d' }]}
                            onPress={() => router.replace('/(tabs)/instrutor')}
                        >
                            <View style={styles.statusHeader}>
                                <Ionicons name="time" size={24} color="#d97706" />
                                <Text style={[styles.statusTitle, { color: '#92400e' }]}>Cadastro em Análise</Text>
                            </View>
                            <Text style={[styles.statusDescription, { color: '#b45309' }]}>
                                Estamos verificando seus documentos. Toque para acompanhar o progresso.
                            </Text>
                        </TouchableOpacity>
                    )}

                    {instructorStatus === 'approved' && (
                        <TouchableOpacity
                            style={[styles.instructorCard, { backgroundColor: theme.card, borderColor: theme.primary, borderWidth: 1 }]}
                            onPress={() => router.replace('/(tabs)/instrutor')}
                        >
                            <View style={styles.instructorCardContent}>
                                <View style={[styles.instructorIconContainer, { backgroundColor: '#dcfce7' }]}>
                                    <Ionicons name="speedometer" size={24} color="#16a34a" />
                                </View>
                                <View style={styles.instructorTextContainer}>
                                    <Text style={[styles.instructorTitle, { color: theme.text }]}>Painel do Instrutor</Text>
                                    <Text style={[styles.instructorSubtitle, { color: theme.textSecondary }]}>
                                        Gerencie suas aulas, agenda e ganhos.
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.instructorArrow}>
                                <Text style={[styles.instructorActionText, { color: '#16a34a' }]}>Acessar</Text>
                                <Ionicons name="arrow-forward" size={16} color="#16a34a" />
                            </View>
                        </TouchableOpacity>
                    )}

                    {instructorStatus === 'rejected' && (
                        <TouchableOpacity
                            style={[styles.statusCard, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}
                            onPress={() => router.push('/connect/suporte')}
                        >
                            <View style={styles.statusHeader}>
                                <Ionicons name="alert-circle" size={24} color="#dc2626" />
                                <Text style={[styles.statusTitle, { color: '#991b1b' }]}>Atenção</Text>
                            </View>
                            <Text style={[styles.statusDescription, { color: '#b91c1c' }]}>
                                Houve um problema com seu cadastro. Toque para entrar em contato com o suporte.
                            </Text>
                        </TouchableOpacity>
                    )}

                    {instructorStatus === 'suspended' && (
                        <TouchableOpacity
                            style={[styles.statusCard, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}
                            onPress={() => router.replace('/(tabs)/instrutor')}
                        >
                            <View style={styles.statusHeader}>
                                <Ionicons name="pause-circle" size={24} color="#dc2626" />
                                <Text style={[styles.statusTitle, { color: '#991b1b' }]}>Conta Suspensa</Text>
                            </View>
                            <Text style={[styles.statusDescription, { color: '#b91c1c' }]}>
                                Sua conta de instrutor está suspensa. Toque para resolver pendências.
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.menuSection}>
                    <Text style={[styles.menuTitle, { color: theme.textSecondary }]}>Aparência</Text>

                    <View style={[styles.themeCard, { backgroundColor: theme.card }]}>
                        <View style={styles.themeHeader}>
                            <View style={[styles.menuIcon, { backgroundColor: isDark ? '#312e81' : '#f3f4f6' }]}>
                                <Ionicons name={isDark ? "moon" : "sunny"} size={20} color={isDark ? '#a78bfa' : '#f59e0b'} />
                            </View>
                            <Text style={[styles.menuItemText, { color: theme.text }]}>Tema do App</Text>
                        </View>
                        <View style={[styles.themeSelector, { backgroundColor: theme.background }]}>
                            <TouchableOpacity
                                style={[
                                    styles.themeOption,
                                    themeMode === 'light' && styles.themeOptionActive,
                                    themeMode === 'light' && { backgroundColor: theme.primary }
                                ]}
                                onPress={() => setThemeMode('light')}
                            >
                                <Ionicons
                                    name="sunny"
                                    size={16}
                                    color={themeMode === 'light' ? '#fff' : theme.textMuted}
                                />
                                <Text style={[
                                    styles.themeOptionText,
                                    { color: themeMode === 'light' ? '#fff' : theme.text }
                                ]}>Claro</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.themeOption,
                                    themeMode === 'dark' && styles.themeOptionActive,
                                    themeMode === 'dark' && { backgroundColor: theme.primary }
                                ]}
                                onPress={() => setThemeMode('dark')}
                            >
                                <Ionicons
                                    name="moon"
                                    size={16}
                                    color={themeMode === 'dark' ? '#fff' : theme.textMuted}
                                />
                                <Text style={[
                                    styles.themeOptionText,
                                    { color: themeMode === 'dark' ? '#fff' : theme.text }
                                ]}>Escuro</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.themeOption,
                                    themeMode === 'system' && styles.themeOptionActive,
                                    themeMode === 'system' && { backgroundColor: theme.primary }
                                ]}
                                onPress={() => setThemeMode('system')}
                            >
                                <Ionicons
                                    name="phone-portrait"
                                    size={16}
                                    color={themeMode === 'system' ? '#fff' : theme.textMuted}
                                />
                                <Text style={[
                                    styles.themeOptionText,
                                    { color: themeMode === 'system' ? '#fff' : theme.text }
                                ]}>Sistema</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Security Section - Biometric - Disabled temporarily
                {isBiometricSupported && isBiometricEnrolled && (
                    <View style={styles.menuSection}>
                        <Text style={[styles.menuTitle, { color: theme.textSecondary }]}>Segurança</Text>

                        <View style={[styles.securityCard, { backgroundColor: theme.card }]}>
                            <View style={styles.securityHeader}>
                                <View style={[styles.menuIcon, { backgroundColor: '#dcfce7' }]}>
                                    <Ionicons
                                        name={biometricType === 'face' ? 'scan-outline' : 'finger-print-outline'}
                                        size={20}
                                        color="#16a34a"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.menuItemText, { color: theme.text }]}>
                                        {biometricType === 'face' ? 'Face ID' : 'Touch ID'}
                                    </Text>
                                    <Text style={[styles.securitySubtext, { color: theme.textSecondary }]}>
                                        Desbloqueie o app com biometria
                                    </Text>
                                </View>
                                <Switch
                                    value={isBiometricEnabled}
                                    onValueChange={handleBiometricToggle}
                                    disabled={biometricLoading}
                                    trackColor={{ false: '#e5e7eb', true: '#86efac' }}
                                    thumbColor={isBiometricEnabled ? '#16a34a' : '#f4f3f4'}
                                />
                            </View>
                        </View>
                    </View>
                )}
                */}

                <View style={styles.menuSection}>
                    <Text style={[styles.menuTitle, { color: theme.textSecondary }]}>Suporte</Text>

                    <TouchableOpacity
                        style={[styles.menuItem, { backgroundColor: theme.card }]}
                        onPress={handleHelp}
                        accessibilityLabel="Ajuda e Suporte"
                        accessibilityRole="button"
                    >
                        <View style={[styles.menuIcon, { backgroundColor: '#eff6ff' }]}>
                            <Ionicons name="help-circle" size={20} color="#3b82f6" />
                        </View>
                        <Text style={[styles.menuItemText, { color: theme.text }]}>Ajuda e Suporte</Text>
                        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Legal Section */}
                <View style={styles.menuSection}>
                    <Text style={[styles.menuTitle, { color: theme.textSecondary }]}>Legal</Text>

                    <TouchableOpacity
                        style={[styles.menuItem, { backgroundColor: theme.card }]}
                        onPress={() => router.push('/connect/privacidade')}
                        accessibilityLabel="Privacidade e Dados"
                        accessibilityRole="button"
                    >
                        <View style={[styles.menuIcon, { backgroundColor: '#dbeafe' }]}>
                            <Ionicons name="lock-closed" size={20} color="#3b82f6" />
                        </View>
                        <Text style={[styles.menuItemText, { color: theme.text }]}>Privacidade e Dados</Text>
                        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, { backgroundColor: theme.card }]}
                        onPress={handlePrivacyPolicy}
                        accessibilityLabel="Política de Privacidade"
                        accessibilityRole="link"
                    >
                        <View style={[styles.menuIcon, { backgroundColor: '#f3e8ff' }]}>
                            <Ionicons name="shield-checkmark" size={20} color="#9333ea" />
                        </View>
                        <Text style={[styles.menuItemText, { color: theme.text }]}>Política de Privacidade</Text>
                        <Ionicons name="open-outline" size={18} color={theme.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, { backgroundColor: theme.card }]}
                        onPress={handleTermsOfUse}
                        accessibilityLabel="Termos de Uso"
                        accessibilityRole="link"
                    >
                        <View style={[styles.menuIcon, { backgroundColor: '#fef3c7' }]}>
                            <Ionicons name="document-text" size={20} color="#d97706" />
                        </View>
                        <Text style={[styles.menuItemText, { color: theme.text }]}>Termos de Uso</Text>
                        <Ionicons name="open-outline" size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <View style={styles.logoutSection}>
                    <TouchableOpacity
                        style={[styles.logoutButton, { backgroundColor: theme.card }]}
                        onPress={handleLogout}
                        accessibilityLabel="Sair da conta"
                        accessibilityRole="button"
                    >
                        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                        <Text style={styles.logoutText}>Sair da conta</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Logout Modal */}
            <ConfirmationModal
                visible={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                title="Sair da Conta"
                message="Tem certeza que deseja sair? Você precisará fazer login novamente para acessar sua conta."
                icon="log-out-outline"
                type="warning"
                confirmText="Sair"
                cancelText="Cancelar"
                onConfirm={confirmLogout}
                onCancel={() => setShowLogoutModal(false)}
            />

            {/* Permission Primer Modal */}
            <ConfirmationModal
                visible={showPermissionModal}
                onClose={() => setShowPermissionModal(false)}
                title="Acesso à Galeria"
                message="Para escolher uma nova foto de perfil, o Vrumi precisa de permissão para acessar sua biblioteca de fotos. Deseja continuar?"
                icon="image"
                type="info"
                confirmText="Continuar"
                cancelText="Agora não"
                onConfirm={pickAndUploadImage}
                onCancel={() => setShowPermissionModal(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    userCard: {
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        position: 'relative',
    },
    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    cameraIcon: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatarText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    userName: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        marginBottom: 20,
    },
    statsBadge: {
        flexDirection: 'row',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    divider: {
        width: 1,
    },
    menuSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    menuTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        marginBottom: 8,
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    menuItemText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    menuItemSubtext: {
        fontSize: 12,
        marginTop: 2,
    },
    logoutSection: {
        paddingHorizontal: 20,
        paddingBottom: 32,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#fecaca',
        gap: 8,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ef4444',
    },
    // Goal Card Styles
    goalCard: {
        padding: 16,
        borderRadius: 16,
    },
    goalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    goalInfo: {
        flex: 1,
    },
    goalTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    goalSubtitle: {
        fontSize: 13,
    },
    goalButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    goalButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
    },
    goalButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    // Theme Card Styles
    themeCard: {
        padding: 16,
        borderRadius: 16,
    },
    themeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    themeSelector: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        gap: 4,
    },
    themeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        gap: 6,
    },
    themeOptionActive: {
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    themeOptionText: {
        fontSize: 13,
        fontWeight: '600',
    },
    // Instructor Card Styles
    instructorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    instructorCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    instructorIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructorTextContainer: {
        flex: 1,
    },
    instructorTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    instructorSubtitle: {
        fontSize: 12,
        lineHeight: 16,
    },
    instructorArrow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginLeft: 8,
    },
    instructorActionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#db2777',
    },
    // Status Card Styles
    statusCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    statusDescription: {
        fontSize: 13,
        lineHeight: 18,
    },
    // Security Card Styles
    securityCard: {
        padding: 16,
        borderRadius: 16,
    },
    securityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    securitySubtext: {
        fontSize: 12,
        marginTop: 2,
    },
});
