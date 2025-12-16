import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Linking, RefreshControl, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useGamification, getLevelTitle } from '../../contexts/GamificationContext';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { useInstructorStatus } from '../../hooks/useInstructorStatus';

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
    const { stats: gamificationStats, updateDailyGoal } = useGamification();
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
    const { isInstructor, instructorStatus, instructorInfo, loading: instructorLoading } = useInstructorStatus();

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

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchStats();
        fetchAvatarUrl();
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

    const pickAndUploadImage = async () => {
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
            const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

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

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            const publicUrl = urlData.publicUrl;

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
        Alert.alert(
            'Sair',
            'Tem certeza que deseja sair?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sair',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        router.replace('/(auth)/login');
                    },
                },
            ]
        );
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
        Alert.alert(
            'Ajuda',
            'Precisa de suporte?\n\nEntre em contato conosco pelo email:\nsuporte@vrumi.com.br',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Enviar email', onPress: () => Linking.openURL('mailto:suporte@vrumi.com.br') }
            ]
        );
    };

    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
    const userEmail = user?.email || '';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
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
                        onPress={pickAndUploadImage}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
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
                    >
                        <View style={[styles.menuIcon, { backgroundColor: '#d1fae5' }]}>
                            <Ionicons name="calendar" size={20} color="#10b981" />
                        </View>
                        <Text style={[styles.menuItemText, { color: theme.text }]}>Minhas Aulas</Text>
                        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                    </TouchableOpacity>


                    {/* Conditional Instructor Options */}
                    {instructorStatus === 'none' && (
                        <TouchableOpacity
                            style={[styles.menuItem, { backgroundColor: theme.card }]}
                            onPress={() => router.push('/connect/cadastro-instrutor')}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: '#fce7f3' }]}>
                                <Ionicons name="person-add" size={20} color="#ec4899" />
                            </View>
                            <Text style={[styles.menuItemText, { color: theme.text }]}>Seja um Instrutor</Text>
                            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                        </TouchableOpacity>
                    )}

                    {instructorStatus === 'pending' && (
                        <View style={[styles.menuItem, { backgroundColor: theme.card }]}>
                            <View style={[styles.menuIcon, { backgroundColor: '#fef3c7' }]}>
                                <Ionicons name="time" size={20} color="#f59e0b" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.menuItemText, { color: theme.text }]}>Cadastro em Análise</Text>
                                <Text style={[styles.menuItemSubtext, { color: theme.textMuted }]}>
                                    Aguardando aprovação
                                </Text>
                            </View>
                        </View>
                    )}

                    {instructorStatus === 'approved' && (
                        <TouchableOpacity
                            style={[styles.menuItem, { backgroundColor: theme.card }]}
                            onPress={() => {
                                // If already on tabs, navigate between them; or push if it was external.
                                // Since we are in tabs/perfil, we can just jump to tabs/instrutor
                                router.replace('/(tabs)/instrutor');
                            }}>
                            <View style={[styles.menuIcon, { backgroundColor: '#dbeafe' }]}>
                                <Ionicons name="speedometer" size={20} color="#3b82f6" />
                            </View>
                            <Text style={[styles.menuItemText, { color: theme.text }]}>Painel do Instrutor</Text>
                            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Daily Goal Section */}
                <View style={styles.menuSection}>
                    <Text style={[styles.menuTitle, { color: theme.textSecondary }]}>Meta Diária</Text>

                    <View style={[styles.goalCard, { backgroundColor: theme.card }]}>
                        <View style={styles.goalHeader}>
                            <View style={[styles.menuIcon, { backgroundColor: '#dbeafe' }]}>
                                <Ionicons name="flag" size={20} color="#3b82f6" />
                            </View>
                            <View style={styles.goalInfo}>
                                <Text style={[styles.goalTitle, { color: theme.text }]}>
                                    {gamificationStats?.dailyGoal.goalMinutes || 10} minutos por dia
                                </Text>
                                <Text style={[styles.goalSubtitle, { color: theme.textSecondary }]}>
                                    {gamificationStats?.dailyGoal.completed
                                        ? '✅ Concluída hoje!'
                                        : `${gamificationStats?.dailyGoal.minutesToday || 0} de ${gamificationStats?.dailyGoal.goalMinutes || 10} min`
                                    }
                                </Text>
                            </View>
                        </View>

                        <View style={styles.goalButtons}>
                            {[5, 10, 15, 20].map((minutes) => (
                                <TouchableOpacity
                                    key={minutes}
                                    style={[
                                        styles.goalButton,
                                        {
                                            backgroundColor: gamificationStats?.dailyGoal.goalMinutes === minutes
                                                ? theme.primary
                                                : theme.background,
                                            borderColor: theme.cardBorder,
                                        }
                                    ]}
                                    onPress={() => updateDailyGoal(minutes)}
                                >
                                    <Text style={[
                                        styles.goalButtonText,
                                        {
                                            color: gamificationStats?.dailyGoal.goalMinutes === minutes
                                                ? '#fff'
                                                : theme.text
                                        }
                                    ]}>
                                        {minutes}m
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
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

                <View style={styles.menuSection}>
                    <Text style={[styles.menuTitle, { color: theme.textSecondary }]}>Suporte</Text>

                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]} onPress={handleHelp}>
                        <View style={[styles.menuIcon, { backgroundColor: '#eff6ff' }]}>
                            <Ionicons name="help-circle" size={20} color="#3b82f6" />
                        </View>
                        <Text style={[styles.menuItemText, { color: theme.text }]}>Ajuda e Suporte</Text>
                        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <View style={styles.logoutSection}>
                    <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.card }]} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                        <Text style={styles.logoutText}>Sair da conta</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
});
