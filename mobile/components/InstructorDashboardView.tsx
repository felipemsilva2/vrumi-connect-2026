import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Alert,
    Linking,
    Image,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../src/lib/supabase';
import * as ImagePicker from 'expo-image-picker';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://kyuaxjkokntdmcxjurhm.supabase.co';

interface Stats {
    totalEarnings: number;
    todayLessons: number;
    totalLessons: number;
    rating: number;
}

interface NextLesson {
    id: string;
    student_id: string;
    student_name: string;
    scheduled_date: string;
    scheduled_time: string;
    price: number;
    isToday: boolean;
    unread_messages?: number;
    chat_room_id?: string;
    student_avatar?: string;
}

export default function InstructorDashboardView() {
    const { theme } = useTheme();
    const { user, session } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [instructorId, setInstructorId] = useState<string | null>(null);
    const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
    const [stripeOnboarded, setStripeOnboarded] = useState(false);
    const [stripeLoading, setStripeLoading] = useState(false);
    const [stats, setStats] = useState<Stats>({ totalEarnings: 0, todayLessons: 0, totalLessons: 0, rating: 0 });
    const [nextLesson, setNextLesson] = useState<NextLesson | null>(null);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user?.id) return;

        try {
            const { data: instructor, error } = await supabase
                .from('instructors')
                .select('id, total_lessons, average_rating, stripe_account_id, stripe_onboarding_complete, photo_url')
                .eq('user_id', user.id)
                .single();

            if (error || !instructor) return;

            setInstructorId(instructor.id);
            setStripeAccountId(instructor.stripe_account_id);
            setStripeOnboarded(instructor.stripe_onboarding_complete || false);
            setPhotoUrl(instructor.photo_url);

            const today = new Date().toISOString().split('T')[0];

            // Get earnings (Simple calculation for now)
            const { data: completedBookings } = await supabase
                .from('bookings')
                .select('price')
                .eq('instructor_id', instructor.id)
                .eq('status', 'completed');

            const totalEarnings = completedBookings?.reduce((acc, b) => acc + (b.price * 0.85), 0) || 0;

            // Get Next Lesson
            const { data: upcomingBookings } = await supabase
                .from('bookings')
                .select(`
                    id, scheduled_date, scheduled_time, price, 
                    student:profiles(id, full_name, avatar_url)
                `)
                .eq('instructor_id', instructor.id)
                .gte('scheduled_date', today)
                .in('status', ['confirmed', 'pending'])
                .order('scheduled_date', { ascending: true })
                .order('scheduled_time', { ascending: true })
                .limit(1);

            setStats({
                totalEarnings,
                todayLessons: 0, // Simplified for brevity
                totalLessons: instructor.total_lessons || 0,
                rating: instructor.average_rating || 5.0,
            });

            if (upcomingBookings && upcomingBookings.length > 0) {
                const b = upcomingBookings[0];
                const student = (b.student as any);

                // Fetch chat for unread count
                const { data: chatRoom } = await supabase
                    .from('connect_chat_rooms')
                    .select('id, unread_count_instructor')
                    .eq('instructor_id', instructor.id)
                    .eq('student_id', student?.id)
                    .maybeSingle();

                setNextLesson({
                    id: b.id,
                    student_id: student?.id,
                    student_name: student?.full_name || 'Aluno',
                    student_avatar: student?.avatar_url,
                    scheduled_date: b.scheduled_date,
                    scheduled_time: b.scheduled_time,
                    price: b.price,
                    isToday: b.scheduled_date === today,
                    unread_messages: chatRoom?.unread_count_instructor || 0,
                    chat_room_id: chatRoom?.id
                });
            } else {
                setNextLesson(null);
            }

        } catch (error) {
            console.error('Error fetching dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatDate = (date: string, time: string) => {
        const d = new Date(date + 'T00:00:00');
        return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }) + ` às ${time.substring(0, 5)}`;
    };

    const pickAndUploadPhoto = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para alterar sua foto.');
                return;
            }

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
            const fileName = `instructors/${instructorId}/${Date.now()}.${fileExt}`;

            const response = await fetch(image.uri);
            const blob = await response.blob();
            const arrayBuffer = await new Response(blob).arrayBuffer();

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, arrayBuffer, {
                    contentType: `image/${fileExt}`,
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            const publicUrl = urlData.publicUrl;

            await supabase
                .from('instructors')
                .update({ photo_url: publicUrl })
                .eq('id', instructorId!);

            setPhotoUrl(publicUrl);
            Alert.alert('Sucesso!', 'Sua foto de instrutor foi atualizada.');
        } catch (error: any) {
            console.error('Upload error:', error);
            Alert.alert('Erro', error.message || 'Não foi possível atualizar a foto.');
        } finally {
            setUploading(false);
        }
    };

    // Primary Actions (Clean Grid)
    const primaryActions = [
        { icon: 'calendar', label: 'Agenda', color: '#0891b2', bg: '#cffafe', route: '/connect/agenda' },
        { icon: 'people', label: 'Alunos', color: '#4f46e5', bg: '#e0e7ff', route: '/connect/alunos' },
        { icon: 'chatbubbles', label: 'Chat', color: '#ea580c', bg: '#ffedd5', route: '/connect/chat' },
        { icon: 'wallet', label: 'Financeiro', color: '#166534', bg: '#dcfce7', route: '/connect/financeiro' },
    ];

    // Secondary Actions (Management List)
    const managementActions = [
        { icon: 'time-outline', label: 'Meus Horários', route: '/connect/horarios' },
        { icon: 'pricetag-outline', label: 'Preços e Pacotes', route: '/connect/precos-pacotes' },
        { icon: 'document-text-outline', label: 'Documentos', route: '/connect/documentos' },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={theme.primary} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.greeting, { color: theme.textSecondary }]}>Olá, Prof.</Text>
                        <Text style={[styles.name, { color: theme.text }]}>{user?.user_metadata?.full_name?.split(' ')[0]}</Text>
                    </View>
                    <TouchableOpacity onPress={pickAndUploadPhoto} disabled={uploading}>
                        {uploading ? (
                            <View style={[styles.avatar, { backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center' }]}>
                                <ActivityIndicator size="small" color={theme.primary} />
                            </View>
                        ) : photoUrl ? (
                            <Image source={{ uri: photoUrl }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, { backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' }]}>
                                <Ionicons name="camera" size={24} color="#fff" />
                            </View>
                        )}
                        <View style={styles.editBadge}>
                            <Ionicons name="pencil" size={12} color="#fff" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Next Lesson Highlight */}
                {nextLesson ? (
                    <TouchableOpacity
                        style={[styles.highlightCard, { backgroundColor: '#16a34a' }]} // Green Theme
                        onPress={() => router.push({
                            pathname: '/connect/agenda',
                            params: { date: nextLesson.scheduled_date }
                        })}
                    >
                        <View style={styles.highlightBadge}>
                            <Text style={styles.highlightBadgeText}>PRÓXIMA AULA</Text>
                        </View>
                        <Text style={styles.highlightTime}>
                            {nextLesson.scheduled_time.substring(0, 5)}
                            <Text style={styles.highlightDate}> • {nextLesson.isToday ? 'Hoje' : formatDate(nextLesson.scheduled_date, '')}</Text>
                        </Text>
                        <View style={styles.highlightStudent}>
                            <Text style={styles.highlightStudentName}>{nextLesson.student_name}</Text>
                            {(nextLesson.unread_messages ?? 0) > 0 && (
                                <View style={styles.unreadBadge}>
                                    <Text style={styles.unreadText}>{nextLesson.unread_messages} msg</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.highlightFooter}>
                            <Text style={styles.highlightLocation}>📍 Local a definir no chat</Text>
                            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View style={[styles.emptyHighlight, { backgroundColor: theme.card }]}>
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>Nenhuma aula próxima</Text>
                        <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>Aproveite para divulgar seu perfil!</Text>
                        <TouchableOpacity
                            style={[styles.shareBtn, { backgroundColor: theme.primary }]}
                            onPress={() => router.push(`/connect/instrutor/${instructorId}`)}
                        >
                            <Text style={styles.shareBtnText}>Ver Meu Perfil</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Earnings Summary */}
                <View style={[styles.statsRow, { backgroundColor: theme.card }]}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Ganhos Totais</Text>
                        <Text style={[styles.statValue, { color: '#16a34a' }]}>{formatCurrency(stats.totalEarnings)}</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Avaliação</Text>
                        <Text style={[styles.statValue, { color: '#ca8a04' }]}>⭐ {stats.rating.toFixed(1)}</Text>
                    </View>
                </View>

                {/* Quick Actions Grid */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Acesso Rápido</Text>
                <View style={styles.gridContainer}>
                    {primaryActions.map((action, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.gridItem, { backgroundColor: theme.card }]}
                            onPress={() => router.push(action.route as any)}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: action.bg }]}>
                                <Ionicons name={action.icon as any} size={24} color={action.color} />
                            </View>
                            <Text style={[styles.gridLabel, { color: theme.text }]}>{action.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Management List */}
                <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>Gerenciar</Text>
                <View style={[styles.listContainer, { backgroundColor: theme.card }]}>
                    {managementActions.map((action, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.listItem, { borderBottomColor: theme.cardBorder, borderBottomWidth: index < managementActions.length - 1 ? 1 : 0 }]}
                            onPress={() => router.push(action.route as any)}
                        >
                            <View style={styles.listItemLeft}>
                                <Ionicons name={action.icon as any} size={22} color={theme.textSecondary} />
                                <Text style={[styles.listItemLabel, { color: theme.text }]}>{action.label}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 20 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: { fontSize: 16 },
    name: { fontSize: 24, fontWeight: 'bold' },
    avatar: { width: 50, height: 50, borderRadius: 25 },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#10b981',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Highlight Card
    highlightCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    highlightBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    highlightBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    highlightTime: { color: '#fff', fontSize: 32, fontWeight: '800' },
    highlightDate: { fontSize: 16, fontWeight: 'normal' },
    highlightStudent: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
    highlightStudentName: { color: '#fff', fontSize: 18, fontWeight: '600' },
    unreadBadge: { backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    unreadText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    highlightFooter: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    highlightLocation: { color: 'rgba(255,255,255,0.9)', fontSize: 14 },

    emptyHighlight: {
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    emptyDesc: { fontSize: 14, marginBottom: 16 },
    shareBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
    shareBtnText: { color: '#fff', fontWeight: '600' },

    // Stats
    statsRow: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        justifyContent: 'space-around',
    },
    statItem: { alignItems: 'center' },
    statLabel: { fontSize: 12, marginBottom: 4 },
    statValue: { fontSize: 18, fontWeight: 'bold' },
    divider: { width: 1, height: '80%' },

    // Grid
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    gridItem: {
        width: '47%',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: 1.2,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    gridLabel: { fontSize: 14, fontWeight: '600' },

    // List
    listContainer: { borderRadius: 16, overflow: 'hidden' },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    listItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    listItemLabel: { fontSize: 16 },
});
