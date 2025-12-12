import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Animated,
    PanResponder,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../src/lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -80;

interface Notification {
    id: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
    type?: string;
}

interface NotificationModalProps {
    visible: boolean;
    onClose: () => void;
    userId?: string;
}

// Swipeable Notification Item Component
function SwipeableNotificationItem({
    notification,
    theme,
    onDelete,
    onPress,
    getNotificationIcon,
    formatTimeAgo,
}: {
    notification: Notification;
    theme: any;
    onDelete: (id: string) => void;
    onPress: (id: string) => void;
    getNotificationIcon: (type?: string) => keyof typeof Ionicons.glyphMap;
    formatTimeAgo: (date: string) => string;
}) {
    const translateX = useRef(new Animated.Value(0)).current;
    const itemHeight = useRef(new Animated.Value(80)).current;
    const [isDeleting, setIsDeleting] = useState(false);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Lower threshold for quicker response
                return gestureState.dx < -5 && Math.abs(gestureState.dy) < 20;
            },
            onMoveShouldSetPanResponderCapture: (_, gestureState) => {
                return gestureState.dx < -5 && Math.abs(gestureState.dy) < 20;
            },
            onPanResponderGrant: () => {
                // Stop any running animations
                translateX.stopAnimation();
            },
            onPanResponderMove: (_, gestureState) => {
                // Only allow left swipe, direct value set for responsiveness
                if (gestureState.dx < 0) {
                    translateX.setValue(gestureState.dx);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                // Delete if swiped far enough OR if velocity is high enough
                const shouldDelete = gestureState.dx < SWIPE_THRESHOLD ||
                    (gestureState.dx < -30 && gestureState.vx < -0.5);

                if (shouldDelete) {
                    setIsDeleting(true);
                    Animated.parallel([
                        Animated.timing(translateX, {
                            toValue: -SCREEN_WIDTH,
                            duration: 150,
                            useNativeDriver: false,
                        }),
                        Animated.timing(itemHeight, {
                            toValue: 0,
                            duration: 150,
                            useNativeDriver: false,
                        }),
                    ]).start(() => {
                        onDelete(notification.id);
                    });
                } else {
                    // Quick snap back
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: false,
                        tension: 100,
                        friction: 10,
                    }).start();
                }
            },
        })
    ).current;

    if (isDeleting) return null;

    return (
        <Animated.View style={{ height: itemHeight, overflow: 'hidden' }}>
            {/* Delete background - only visible when swiping */}
            <Animated.View
                style={[
                    styles.deleteBackground,
                    {
                        backgroundColor: '#ef4444',
                        opacity: translateX.interpolate({
                            inputRange: [-100, 0],
                            outputRange: [1, 0],
                            extrapolate: 'clamp'
                        })
                    }
                ]}
            >
                <Ionicons name="trash-outline" size={24} color="#fff" />
                <Text style={styles.deleteText}>Apagar</Text>
            </Animated.View>

            {/* Swipeable item */}
            <Animated.View
                style={[
                    styles.notificationItem,
                    {
                        backgroundColor: notification.read ? theme.background : theme.card,
                        borderBottomColor: theme.cardBorder,
                        transform: [{ translateX }],
                    }
                ]}
                {...panResponder.panHandlers}
            >
                <TouchableOpacity
                    style={styles.notificationTouchable}
                    onPress={() => onPress(notification.id)}
                    activeOpacity={0.7}
                >
                    <View style={[
                        styles.notificationIcon,
                        { backgroundColor: notification.read ? theme.card : theme.primary + '15' }
                    ]}>
                        <Ionicons
                            name={getNotificationIcon(notification.type)}
                            size={20}
                            color={notification.read ? theme.textMuted : theme.primary}
                        />
                    </View>
                    <View style={styles.notificationContent}>
                        <View style={styles.notificationHeader}>
                            <Text
                                style={[
                                    styles.notificationTitle,
                                    { color: notification.read ? theme.textSecondary : theme.text }
                                ]}
                                numberOfLines={1}
                            >
                                {notification.title}
                            </Text>
                            <Text style={[styles.notificationTime, { color: theme.textMuted }]}>
                                {formatTimeAgo(notification.created_at)}
                            </Text>
                        </View>
                        <Text
                            style={[styles.notificationMessage, { color: theme.textSecondary }]}
                            numberOfLines={2}
                        >
                            {notification.message}
                        </Text>
                    </View>
                    {!notification.read && (
                        <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
                    )}
                </TouchableOpacity>
            </Animated.View>
        </Animated.View>
    );
}

export default function NotificationModal({ visible, onClose, userId }: NotificationModalProps) {
    const { theme } = useTheme();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (data) {
                const mappedData: Notification[] = data.map(n => ({
                    ...n,
                    read: n.read ?? false,
                    created_at: n.created_at ?? new Date().toISOString(),
                }));
                setNotifications(mappedData);
                setUnreadCount(mappedData.filter(n => !n.read).length);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (visible && userId) {
            fetchNotifications();
        }
    }, [visible, userId, fetchNotifications]);

    const markAsRead = async (id: string) => {
        const notification = notifications.find(n => n.id === id);
        if (notification?.read) return;

        try {
            await supabase.from('notifications').update({ read: true }).eq('id', id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await supabase.from('notifications').delete().eq('id', id);
            const deletedNotification = notifications.find(n => n.id === id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (deletedNotification && !deletedNotification.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const markAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length === 0) return;

        try {
            await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const formatTimeAgo = (dateStr: string): string => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) return 'agora';
        if (diffMinutes < 60) return `${diffMinutes}min`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        return `${diffDays}d atrás`;
    };

    const getNotificationIcon = (type?: string): keyof typeof Ionicons.glyphMap => {
        switch (type) {
            case 'study_reminder': return 'book';
            case 'review_reminder': return 'refresh';
            case 'achievement': return 'trophy';
            case 'study_streak': return 'flame';
            default: return 'notifications';
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={[styles.container, { backgroundColor: theme.background }]}
                    onPress={() => { }}
                >
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>Notificações</Text>
                        <View style={styles.headerActions}>
                            {unreadCount > 0 && (
                                <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                                    <Text style={[styles.markAllText, { color: theme.primary }]}>Marcar todas</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.card }]}>
                                <Ionicons name="close" size={22} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Swipe hint */}
                    {notifications.length > 0 && (
                        <View style={styles.swipeHint}>
                            <Ionicons name="arrow-back" size={14} color={theme.textMuted} />
                            <Text style={[styles.swipeHintText, { color: theme.textMuted }]}>
                                Arraste para apagar
                            </Text>
                        </View>
                    )}

                    {/* Content */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.primary} />
                        </View>
                    ) : notifications.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <View style={[styles.emptyIcon, { backgroundColor: theme.card }]}>
                                <Ionicons name="notifications-off-outline" size={48} color={theme.textMuted} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>Sem notificações</Text>
                            <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                                Você receberá notificações sobre seu progresso aqui
                            </Text>
                        </View>
                    ) : (
                        <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
                            {notifications.map((notification) => (
                                <SwipeableNotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    theme={theme}
                                    onDelete={deleteNotification}
                                    onPress={markAsRead}
                                    getNotificationIcon={getNotificationIcon}
                                    formatTimeAgo={formatTimeAgo}
                                />
                            ))}
                        </ScrollView>
                    )}
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        minHeight: 300,
        maxHeight: '75%',
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    markAllButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    markAllText: {
        fontSize: 13,
        fontWeight: '600',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    swipeHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 6,
    },
    swipeHintText: {
        fontSize: 12,
    },
    loadingContainer: {
        padding: 60,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 60,
        alignItems: 'center',
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
    },
    notificationsList: {
        flex: 1,
    },
    deleteBackground: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingRight: 24,
        gap: 8,
    },
    deleteText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    notificationItem: {
        borderBottomWidth: 1,
    },
    notificationTouchable: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
    },
    notificationIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notificationContent: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    notificationTitle: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
    },
    notificationTime: {
        fontSize: 12,
    },
    notificationMessage: {
        fontSize: 13,
        lineHeight: 18,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 8,
        marginTop: 4,
    },
});
