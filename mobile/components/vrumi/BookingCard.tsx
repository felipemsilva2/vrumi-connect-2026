import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../contexts/ThemeContext';

interface BookingCardProps {
    booking: {
        id: string;
        scheduled_date: string;
        scheduled_time: string;
        price: number;
        status: string;
        isInstructorRole?: boolean;
        instructor?: {
            full_name: string;
            photo_url: string | null;
            city: string;
            state: string;
        };
        student?: {
            full_name: string;
            avatar_url: string | null;
        };
        unread_messages?: number;
    };
    theme: Theme;
    onOpenChat: (booking: any) => void;
    onPress: (booking: any) => void;
    onCancel?: (bookingId: string, paymentStatus: string) => void;
}

const BookingCard = ({ booking, theme, onOpenChat, onPress, onCancel }: BookingCardProps) => {
    const isInstructor = booking.isInstructorRole;
    const otherParty = isInstructor ? booking.student : booking.instructor;
    const name = otherParty?.full_name || (isInstructor ? 'Aluno' : 'Instrutor');
    const photo = isInstructor ? booking.student?.avatar_url : booking.instructor?.photo_url;

    const date = new Date(booking.scheduled_date + 'T00:00:00');
    const formattedDate = date.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });
    const formattedTime = booking.scheduled_time.substring(0, 5);

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { label: string, color: string, bg: string }> = {
            confirmed: { label: 'Confirmada', color: theme.success, bg: theme.successLight },
            pending: { label: 'Pendente', color: theme.warning, bg: theme.warningLight },
            completed: { label: 'Concluída', color: theme.info, bg: theme.infoLight },
            cancelled: { label: 'Cancelada', color: theme.error, bg: theme.errorLight },
            expired: { label: 'Expirada', color: theme.textMuted, bg: theme.cardBorder },
        };
        return configs[status] || configs.pending;
    };

    const status = getStatusConfig(booking.status);

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={() => onPress(booking)}
            activeOpacity={0.9}
        >
            <View style={styles.header}>
                <View style={styles.mainInfo}>
                    {photo ? (
                        <Image source={{ uri: photo }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primarySoft }]}>
                            <Text style={[styles.initial, { color: theme.primary }]}>{name.charAt(0)}</Text>
                        </View>
                    )}
                    <View style={styles.titleContainer}>
                        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{name}</Text>
                        <Text style={[styles.location, { color: theme.textSecondary }]}>
                            {isInstructor ? 'Sua aula agendada' : `${booking.instructor?.city}, ${booking.instructor?.state}`}
                        </Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                        <Ionicons name="calendar-outline" size={16} color={theme.primary} />
                        <Text style={[styles.detailText, { color: theme.text }]}>{formattedDate}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="time-outline" size={16} color={theme.primary} />
                        <Text style={[styles.detailText, { color: theme.text }]}>{formattedTime}</Text>
                    </View>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.chatButton, { backgroundColor: theme.primaryExtralight }]}
                        onPress={() => onOpenChat(booking)}
                    >
                        <Ionicons name="chatbubble-ellipses" size={20} color={theme.primary} />
                        {booking.unread_messages ? (
                            <View style={[styles.unreadBadge, { backgroundColor: theme.error }]}>
                                <Text style={styles.unreadCount}>{booking.unread_messages}</Text>
                            </View>
                        ) : null}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.viewButton, { backgroundColor: theme.primary }]}
                        onPress={() => onPress(booking)}
                    >
                        <Text style={styles.viewButtonText}>Detalhes</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 24, // Mais arredondado para o "Caminho Confiante"
        padding: 16,
        borderWidth: 1,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    mainInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 16,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    initial: {
        fontSize: 20,
        fontWeight: '700',
    },
    titleContainer: {
        marginLeft: 12,
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
    },
    location: {
        fontSize: 12,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 12,
    },
    details: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailRow: {
        flexDirection: 'row',
        gap: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 13,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    chatButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    unreadBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#fff',
    },
    unreadCount: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
    viewButton: {
        paddingHorizontal: 16,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
});

export default memo(BookingCard);
