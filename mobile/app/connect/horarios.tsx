import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    ActivityIndicator,
    Alert,
    Platform,
    Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import ConfirmationModal from '../../components/ConfirmationModal';

const DAYS_OF_WEEK = [
    { id: 0, label: 'Domingo' },
    { id: 1, label: 'Segunda-feira' },
    { id: 2, label: 'Terça-feira' },
    { id: 3, label: 'Quarta-feira' },
    { id: 4, label: 'Quinta-feira' },
    { id: 5, label: 'Sexta-feira' },
    { id: 6, label: 'Sábado' },
];

interface TimeSlot {
    id: string; // can be temp id or uuid
    start_time: string; // HH:mm:ss
    end_time: string; // HH:mm:ss
    is_active: boolean;
}

interface DayAvailability {
    day_of_week: number;
    enabled: boolean;
    slots: TimeSlot[];
}

export default function InstructorAvailabilityScreen() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [availability, setAvailability] = useState<DayAvailability[]>([]);

    // Config state for new slot
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [pickerMode, setPickerMode] = useState<'start' | 'end'>('start');
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [tempTime, setTempTime] = useState(new Date());
    const [newSlotStart, setNewSlotStart] = useState<Date | null>(null);

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

    const [instructorId, setInstructorId] = useState<string | null>(null);

    const fetchAvailability = useCallback(async () => {
        if (!user?.id) return;

        try {
            // Get instructor ID
            const { data: instructor } = await supabase
                .from('instructors')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!instructor) {
                showModal('Erro', 'Perfil de instrutor não encontrado.', 'danger', () => router.back());
                return;
            }

            setInstructorId(instructor.id);

            // Get availability
            const { data: slots, error } = await supabase
                .from('instructor_availability')
                .select('*')
                .eq('instructor_id', instructor.id)
                .order('day_of_week')
                .order('start_time');

            if (error) throw error;

            // Group by day
            const grouped = DAYS_OF_WEEK.map(day => {
                const daySlots = slots?.filter(s => s.day_of_week === day.id) || [];
                return {
                    day_of_week: day.id,
                    enabled: daySlots.length > 0 && daySlots.some(s => s.is_active),
                    slots: daySlots.map(s => ({
                        id: s.id,
                        start_time: s.start_time,
                        end_time: s.end_time,
                        is_active: s.is_active || false // Handle null
                    }))
                };
            });

            setAvailability(grouped);
        } catch (error) {
            console.error('Error fetching availability:', error);
            showModal('Erro', 'Não foi possível carregar seus horários.', 'danger');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchAvailability();
    }, [fetchAvailability]);

    const handleAddSlot = (dayIndex: number) => {
        setSelectedDay(dayIndex);
        setNewSlotStart(null);
        setPickerMode('start');
        setTempTime(new Date()); // Default to active time
        setShowTimePicker(true);
    };

    const onTimeChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowTimePicker(false);
        }

        if (event.type === 'dismissed' || !selectedDate) {
            setSelectedDay(null);
            return;
        }

        if (pickerMode === 'start') {
            setNewSlotStart(selectedDate);
            // On Android we need to close one picker before opening another often, 
            // but for simplicity let's just ask to open the End picker next
            if (Platform.OS === 'android') {
                setTimeout(() => {
                    setPickerMode('end');
                    // Default end time to start + 1 hour
                    const endTime = new Date(selectedDate);
                    endTime.setHours(endTime.getHours() + 1);
                    setTempTime(endTime);
                    setShowTimePicker(true);
                }, 100);
            } else {
                setPickerMode('end');
                const endTime = new Date(selectedDate);
                endTime.setHours(endTime.getHours() + 1);
                setTempTime(endTime);
            }
        } else {
            // End time selected
            if (selectedDay !== null && newSlotStart) {
                const startStr = newSlotStart.toTimeString().split(' ')[0]; // HH:mm:ss
                const endStr = selectedDate.toTimeString().split(' ')[0];

                if (startStr >= endStr) {
                    showModal('Inválido', 'O horário de término deve ser após o início.', 'warning');
                } else {
                    addSlotToState(selectedDay, startStr, endStr);
                }
            }
            setSelectedDay(null);
            if (Platform.OS === 'ios') setShowTimePicker(false);
        }
    };

    const addSlotToState = async (dayIndex: number, start: string, end: string) => {
        if (!instructorId) return;

        // Optimistic update
        const newSlot = {
            instructor_id: instructorId,
            day_of_week: dayIndex,
            start_time: start,
            end_time: end,
            is_active: true
        };

        try {
            const { data, error } = await supabase
                .from('instructor_availability')
                .insert(newSlot)
                .select()
                .single();

            if (error) throw error;

            setAvailability(prev => {
                const newState = [...prev];
                const day = newState.find(d => d.day_of_week === dayIndex);
                if (day) {
                    day.slots.push({
                        id: data.id,
                        start_time: data.start_time,
                        end_time: data.end_time,
                        is_active: true
                    });
                    // Sort slots
                    day.slots.sort((a, b) => a.start_time.localeCompare(b.start_time));
                    day.enabled = true;
                }
                return newState;
            });
        } catch (error) {
            console.error('Error adding slot:', error);
            showModal('Erro', 'Falha ao salvar horário.', 'danger');
        }
    };

    const handleDeleteSlot = async (dayIndex: number, slotId: string) => {
        try {
            const { error } = await supabase
                .from('instructor_availability')
                .delete()
                .eq('id', slotId);

            if (error) throw error;

            setAvailability(prev => {
                const newState = [...prev];
                const day = newState.find(d => d.day_of_week === dayIndex);
                if (day) {
                    day.slots = day.slots.filter(s => s.id !== slotId);
                    if (day.slots.length === 0) day.enabled = false;
                }
                return newState;
            });
        } catch (error) {
            console.error('Error deleting slot:', error);
            showModal('Erro', 'Falha ao remover horário.', 'danger');
        }
    };

    const toggleDay = async (dayIndex: number, value: boolean) => {
        // Here we ideally toggle 'is_active' for all slots in that day
        // Or we just purely visual toggle if no slots exist?
        // Let's implement: If value is false, disable all slots. If true, enable all?
        // Or simpler: Just a filter toggle for the list view?

        // Better UX: If turning OFF, ask confirmation to delete all slots or disable them.
        // For now, let's just make it a visual toggle that expands/collapses the day.

        // Actually, let's align with the 'enabled' state in our local struct.
        // If enabling and no slots, maybe prompt to add one?
        // Let's just update local state for the accordion effect for now + prompt.

        setAvailability(prev => {
            const newState = [...prev];
            const day = newState.find(d => d.day_of_week === dayIndex);
            if (day) day.enabled = value;
            return newState;
        });
    };

    const formatTime = (timeStr: string) => {
        return timeStr.substring(0, 5);
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
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: theme.card }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Configurar Horários</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.description, { color: theme.textSecondary }]}>
                    Defina seus dias e horários de atendimento. Os alunos só poderão agendar dentro destes intervalos.
                </Text>

                <View style={styles.daysList}>
                    {availability.map((day) => (
                        <View key={day.day_of_week} style={[styles.dayCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
                            <View style={styles.dayHeader}>
                                <Text style={[styles.dayTitle, { color: theme.text }]}>{DAYS_OF_WEEK[day.day_of_week].label}</Text>
                                <Switch
                                    value={day.enabled}
                                    onValueChange={(val) => toggleDay(day.day_of_week, val)}
                                    trackColor={{ false: theme.cardBorder, true: theme.primary }}
                                    thumbColor={'#fff'}
                                />
                            </View>

                            {day.enabled && (
                                <View style={styles.slotsContainer}>
                                    {day.slots.length === 0 ? (
                                        <Text style={[styles.noSlotsText, { color: theme.textMuted }]}>
                                            Nenhum horário configurado.
                                        </Text>
                                    ) : (
                                        day.slots.map((slot) => (
                                            <View key={slot.id} style={[styles.slotItem, { backgroundColor: theme.background }]}>
                                                <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                                                <Text style={[styles.slotTime, { color: theme.text }]}>
                                                    {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                                </Text>
                                                <TouchableOpacity
                                                    onPress={() => handleDeleteSlot(day.day_of_week, slot.id)}
                                                    style={styles.deleteSlotBtn}
                                                >
                                                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                                </TouchableOpacity>
                                            </View>
                                        ))
                                    )}

                                    <TouchableOpacity
                                        style={[styles.addSlotButton, { borderColor: theme.primary }]}
                                        onPress={() => handleAddSlot(day.day_of_week)}
                                    >
                                        <Ionicons name="add" size={20} color={theme.primary} />
                                        <Text style={[styles.addSlotText, { color: theme.primary }]}>Adicionar Horário</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ))}
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>

            <ConfirmationModal
                visible={modalConfig.visible}
                onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                confirmText="Entendido"
                onConfirm={() => {
                    modalConfig.onConfirm?.();
                    setModalConfig(prev => ({ ...prev, visible: false }));
                }}
            />

            {/* Time Picker Modal for iOS / Logic for Android handled by state */}
            {showTimePicker && (
                Platform.OS === 'ios' ? (
                    <Modal transparent animationType="slide">
                        <View style={styles.modalOverlay}>
                            <View style={[styles.pickerContainer, { backgroundColor: theme.card }]}>
                                <View style={styles.pickerHeader}>
                                    <Text style={[styles.pickerTitle, { color: theme.text }]}>
                                        {pickerMode === 'start' ? 'Horário de Início' : 'Horário de Término'}
                                    </Text>
                                    <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                                        <Text style={[styles.doneText, { color: theme.primary }]}>Cancelar</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={tempTime}
                                    mode="time"
                                    display="spinner"
                                    onChange={onTimeChange}
                                    textColor={theme.text}
                                    is24Hour={true}
                                />
                                <TouchableOpacity
                                    style={[styles.confirmButton, { backgroundColor: theme.primary }]}
                                    onPress={() => onTimeChange({ type: 'set' }, tempTime)}
                                >
                                    <Text style={styles.confirmButtonText}>
                                        {pickerMode === 'start' ? 'Próximo' : 'Confirmar'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                ) : (
                    <DateTimePicker
                        value={tempTime}
                        mode="time"
                        display="default"
                        is24Hour={true}
                        onChange={onTimeChange}
                    />
                )
            )}
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
    description: {
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 20,
    },
    daysList: {
        gap: 16,
    },
    dayCard: {
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    dayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dayTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    slotsContainer: {
        marginTop: 16,
        gap: 12,
    },
    noSlotsText: {
        fontSize: 13,
        fontStyle: 'italic',
        marginBottom: 8,
    },
    slotItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 10,
    },
    slotTime: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    deleteSlotBtn: {
        padding: 4,
    },
    addSlotButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        gap: 8,
        marginTop: 4,
    },
    addSlotText: {
        fontWeight: '600',
        fontSize: 14,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    pickerContainer: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 40,
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    doneText: {
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButton: {
        marginTop: 20,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
