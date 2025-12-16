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
    Linking,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

interface Student {
    id: string; // This is the user_id (student_id)
    full_name: string;
    photo_url: string | null;
    phone: string | null;
    total_lessons: number;
    last_lesson: string;
}

export default function InstructorStudentsScreen() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);

    const fetchStudents = useCallback(async () => {
        if (!user?.id) return;

        try {
            // Get instructor ID
            const { data: instructor } = await supabase
                .from('instructors')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!instructor) {
                router.back();
                return;
            }

            // Fetch bookings to get unique students
            // We can't distinct on joined column easily in Supabase JS client without RPC
            // So we fetch all bookings and process locally (assuming not huge scale for MVP)
            const { data: bookings, error } = await supabase
                .from('bookings')
                .select(`
                    scheduled_date,
                    student:profiles(user_id, full_name, avatar_url, phone)
                `)
                .eq('instructor_id', instructor.id)
                .order('scheduled_date', { ascending: false });

            if (error) throw error;

            const studentMap = new Map<string, Student>();

            bookings?.forEach((booking: any) => {
                // Handle single object vs array return from relation
                const studentData = Array.isArray(booking.student) ? booking.student[0] : booking.student;

                if (!studentData) return;

                const studentId = studentData.user_id; // assuming profile has user_id or id

                if (!studentMap.has(studentId)) {
                    studentMap.set(studentId, {
                        id: studentId,
                        full_name: studentData.full_name || 'Aluno',
                        photo_url: studentData.avatar_url,
                        phone: studentData.phone,
                        total_lessons: 0,
                        last_lesson: booking.scheduled_date
                    });
                }

                const current = studentMap.get(studentId)!;
                current.total_lessons += 1;
                // Since we ordered by date desc, the first time we see a student is their last lesson
                // We keep the initial last_lesson set
            });

            setStudents(Array.from(studentMap.values()));

        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStudents();
    };

    const handleWhatsApp = (phone: string | null) => {
        if (!phone) {
            Alert.alert('Sem telefone', 'Este aluno não cadastrou um telefone.');
            return;
        }
        const cleanPhone = phone.replace(/\D/g, '');
        Linking.openURL(`whatsapp://send?phone=${cleanPhone}`);
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
                <Text style={[styles.headerTitle, { color: theme.text }]}>Meus Alunos</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
                {/* Summary */}
                <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: theme.text }]}>{students.length}</Text>
                        <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Total de Alunos</Text>
                    </View>
                    <View style={[styles.limitLine, { backgroundColor: theme.cardBorder }]} />
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: theme.primary }]}>
                            {students.reduce((acc, s) => acc + s.total_lessons, 0)}
                        </Text>
                        <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Aulas Feitas</Text>
                    </View>
                </View>

                {/* List */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Lista de Alunos</Text>

                {students.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={48} color={theme.textMuted} />
                        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                            Você ainda não tem alunos.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {students.map((student) => (
                            <View key={student.id} style={[styles.studentCard, { backgroundColor: theme.card }]}>
                                {student.photo_url ? (
                                    <Image source={{ uri: student.photo_url }} style={styles.avatar} />
                                ) : (
                                    <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                                        <Text style={styles.avatarInitial}>
                                            {student.full_name.charAt(0)}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.studentInfo}>
                                    <Text style={[styles.studentName, { color: theme.text }]}>{student.full_name}</Text>
                                    <Text style={[styles.studentMeta, { color: theme.textSecondary }]}>
                                        {student.total_lessons} aula{student.total_lessons !== 1 ? 's' : ''} • Última: {new Date(student.last_lesson).toLocaleDateString('pt-BR')}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={[styles.contactButton, { backgroundColor: '#dcfce7' }]}
                                    onPress={() => handleWhatsApp(student.phone)}
                                >
                                    <Ionicons name="logo-whatsapp" size={20} color="#166534" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    summaryCard: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    limitLine: {
        width: 1,
        height: '100%',
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
    },
    listContainer: {
        gap: 12,
    },
    studentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    studentInfo: {
        flex: 1,
        marginLeft: 12,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    studentMeta: {
        fontSize: 12,
    },
    contactButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
