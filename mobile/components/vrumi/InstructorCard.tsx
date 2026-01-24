import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../contexts/ThemeContext';

interface InstructorCardProps {
    instructor: {
        id: string;
        full_name: string;
        photo_url: string | null;
        city: string;
        state: string;
        price_per_lesson: number;
        average_rating: number | null;
        is_verified: boolean | null;
    };
    theme: Theme;
    onPress: (id: string) => void;
    onLongPress?: (id: string) => void;
}

const InstructorCard = ({ instructor, theme, onPress, onLongPress }: InstructorCardProps) => {
    // Deterministic simulation of "Confidence Indicators"
    const lastActivity = useMemo(() => {
        const hash = instructor.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        if (hash % 3 === 0) return 'Ativo hoje';
        if (hash % 3 === 1) return 'Aula agora';
        return 'Agenda aberta';
    }, [instructor.id]);

    const isActiveNow = lastActivity === 'Aula agora';

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0,
        }).format(price);
    };

    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                }
            ]}
            onPress={() => onPress(instructor.id)}
            onLongPress={() => onLongPress?.(instructor.id)}
            activeOpacity={0.8}
            accessibilityLabel={`${instructor.full_name}, ${Number(instructor.average_rating || 0).toFixed(1)} estrelas, ${lastActivity}`}
            accessibilityRole="button"
        >
            <View style={styles.photoContainer}>
                {instructor.photo_url ? (
                    <Image
                        source={{ uri: instructor.photo_url }}
                        style={styles.photo}
                        accessibilityLabel={`Foto de ${instructor.full_name}`}
                    />
                ) : (
                    <View style={[styles.photoPlaceholder, { backgroundColor: theme.primarySoft }]}>
                        <Text style={[styles.photoInitial, { color: theme.primary }]}>
                            {instructor.full_name.charAt(0)}
                        </Text>
                    </View>
                )}

                <View style={[styles.activityBadge, { backgroundColor: isActiveNow ? '#10b981' : theme.primary }]}>
                    <Text style={styles.activityText}>{lastActivity}</Text>
                </View>

                {instructor.is_verified && (
                    <View style={[styles.verifiedBadge, { backgroundColor: theme.card }]}>
                        <Ionicons name="checkmark-circle" size={14} color={theme.primary} />
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                    {instructor.full_name}
                </Text>

                <View style={styles.infoRow}>
                    <View style={styles.ratingBox}>
                        <Ionicons name="star" size={12} color="#f59e0b" />
                        <Text style={[styles.ratingText, { color: theme.text }]}>
                            {Number(instructor.average_rating || 0).toFixed(1)}
                        </Text>
                    </View>
                    <Text style={[styles.cityText, { color: theme.textSecondary }]} numberOfLines={1}>
                        • {instructor.city}
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.price, { color: theme.primary }]}>
                        {formatPrice(instructor.price_per_lesson)}
                    </Text>
                    <Text style={[styles.unit, { color: theme.textMuted }]}>/aula</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 170, // Slightly wider
        borderRadius: 24,
        padding: 8,
        marginRight: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
        marginBottom: 8,
    },
    photoContainer: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 18,
        overflow: 'hidden',
        marginBottom: 10,
        position: 'relative',
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    photoPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoInitial: {
        fontSize: 36,
        fontWeight: '700',
    },
    activityBadge: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    activityText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    verifiedBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    content: {
        paddingHorizontal: 4,
        paddingBottom: 4,
    },
    name: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#f59e0b15',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
    },
    cityText: {
        fontSize: 11,
        marginLeft: 4,
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    price: {
        fontSize: 18,
        fontWeight: '800',
    },
    unit: {
        fontSize: 12,
        fontWeight: '500',
    },
});

export default memo(InstructorCard);
