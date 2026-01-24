import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../contexts/ThemeContext';

interface InstructorListItemProps {
    instructor: {
        id: string;
        full_name: string;
        photo_url: string | null;
        city: string;
        state: string;
        categories: string[];
        price_per_lesson: number;
        average_rating: number | null;
        total_reviews: number | null;
        is_verified: boolean | null;
        vehicle_model?: string | null;
        vehicle_transmission?: string | null;
    };
    theme: Theme;
    onPress: (id: string) => void;
}

const InstructorListItem = ({ instructor, theme, onPress }: InstructorListItemProps) => {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(price);
    };

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={() => onPress(instructor.id)}
            activeOpacity={0.9}
        >
            <View style={styles.topRow}>
                <View style={styles.photoContainer}>
                    {instructor.photo_url ? (
                        <Image source={{ uri: instructor.photo_url }} style={styles.photo} />
                    ) : (
                        <View style={[styles.photoPlaceholder, { backgroundColor: theme.primarySoft }]}>
                            <Text style={[styles.initial, { color: theme.primary }]}>{instructor.full_name.charAt(0)}</Text>
                        </View>
                    )}
                    {instructor.is_verified && (
                        <View style={[styles.verifiedBadge, { backgroundColor: theme.card }]}>
                            <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                        </View>
                    )}
                </View>

                <View style={styles.mainContent}>
                    <View style={styles.nameRow}>
                        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{instructor.full_name}</Text>
                    </View>

                    <View style={styles.ratingRow}>
                        <View style={styles.stars}>
                            <Ionicons name="star" size={14} color="#f59e0b" />
                            <Text style={[styles.ratingText, { color: theme.text }]}>
                                {Number(instructor.average_rating || 0).toFixed(1)}
                            </Text>
                        </View>
                        <Text style={[styles.reviewsText, { color: theme.textMuted }]}>
                            ({instructor.total_reviews || 0} avaliações)
                        </Text>
                    </View>

                    <View style={styles.metaRow}>
                        <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                        <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                            {instructor.city}, {instructor.state}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

            <View style={styles.bottomRow}>
                <View style={styles.vehicleInfo}>
                    <View style={[styles.transmissionBadge, { backgroundColor: theme.primarySoft }]}>
                        <Text style={[styles.transmissionText, { color: theme.primary }]}>
                            {instructor.vehicle_transmission === 'automatic' ? 'AUTO' : 'MANUAL'}
                        </Text>
                    </View>
                    <Text style={[styles.vehicleModel, { color: theme.textSecondary }]} numberOfLines={1}>
                        {instructor.vehicle_model || 'Veículo padrão'}
                    </Text>
                </View>

                <View style={styles.priceContainer}>
                    <Text style={[styles.price, { color: theme.primary }]}>{formatPrice(instructor.price_per_lesson)}</Text>
                    <Text style={[styles.unit, { color: theme.textMuted }]}>/50min</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    topRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    photoContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        overflow: 'hidden',
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
    initial: {
        fontSize: 28,
        fontWeight: '700',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        borderRadius: 10,
        padding: 1,
    },
    mainContent: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 18,
        fontWeight: '700',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    stars: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '700',
    },
    reviewsText: {
        fontSize: 12,
        fontWeight: '500',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 13,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        marginBottom: 12,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    vehicleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    transmissionBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    transmissionText: {
        fontSize: 10,
        fontWeight: '800',
    },
    vehicleModel: {
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    price: {
        fontSize: 18,
        fontWeight: '800',
    },
    unit: {
        fontSize: 10,
        fontWeight: '500',
    },
});

export default memo(InstructorListItem);
