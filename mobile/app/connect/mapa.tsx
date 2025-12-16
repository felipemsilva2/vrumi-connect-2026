import { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../src/lib/supabase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface InstructorMarker {
    id: string;
    full_name: string;
    photo_url: string | null;
    latitude: number;
    longitude: number;
    price_per_lesson: number;
    average_rating: number | null;
}

const RADIUS_OPTIONS = [5, 10, 20, 50]; // km

export default function InstructorMapScreen() {
    const { theme, isDark } = useTheme();
    const mapRef = useRef<MapView>(null);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [instructors, setInstructors] = useState<InstructorMarker[]>([]);
    const [selectedRadius, setSelectedRadius] = useState(20);
    const [selectedInstructor, setSelectedInstructor] = useState<InstructorMarker | null>(null);

    const fetchInstructors = useCallback(async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('instructors')
                .select('id, full_name, photo_url, latitude, longitude, price_per_lesson, average_rating')
                .eq('status', 'approved')
                .not('latitude', 'is', null)
                .not('longitude', 'is', null);

            if (error) throw error;

            // Filter by radius if user location is available
            let filtered = (data || []) as InstructorMarker[];
            if (userLocation) {
                filtered = filtered.filter((instructor) => {
                    const distance = calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        instructor.latitude,
                        instructor.longitude
                    );
                    return distance <= selectedRadius;
                });
            }

            setInstructors(filtered);
        } catch (error) {
            console.error('Error fetching instructors:', error);
        }
    }, [userLocation, selectedRadius]);

    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permissão Negada', 'Precisamos da sua localização para mostrar instrutores próximos.');
                    // Use a default location (São Paulo)
                    setUserLocation({ latitude: -23.5505, longitude: -46.6333 });
                } else {
                    const location = await Location.getCurrentPositionAsync({});
                    setUserLocation({
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    });
                }
            } catch (error) {
                console.error('Error getting location:', error);
                setUserLocation({ latitude: -23.5505, longitude: -46.6333 });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (userLocation) {
            fetchInstructors();
        }
    }, [userLocation, selectedRadius, fetchInstructors]);

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(price);
    };

    const centerOnUser = () => {
        if (userLocation && mapRef.current) {
            mapRef.current.animateToRegion({
                ...userLocation,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
        }
    };

    if (loading || !userLocation) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.text }]}>
                        Obtendo sua localização...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.background }]}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: theme.card }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Mapa de Instrutores</Text>
                <TouchableOpacity
                    style={[styles.locationButton, { backgroundColor: theme.card }]}
                    onPress={centerOnUser}
                >
                    <Ionicons name="locate" size={22} color={theme.primary} />
                </TouchableOpacity>
            </View>

            {/* Map */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                    ...userLocation,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                }}
                showsUserLocation
                showsMyLocationButton={false}
            >
                {instructors.map((instructor) => (
                    <Marker
                        key={instructor.id}
                        coordinate={{
                            latitude: instructor.latitude,
                            longitude: instructor.longitude,
                        }}
                        onPress={() => setSelectedInstructor(instructor)}
                    >
                        <View style={[styles.markerContainer, { backgroundColor: theme.primary }]}>
                            {instructor.photo_url ? (
                                <Image source={{ uri: instructor.photo_url }} style={styles.markerPhoto} />
                            ) : (
                                <Text style={styles.markerInitial}>
                                    {instructor.full_name.charAt(0)}
                                </Text>
                            )}
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* Radius Selector */}
            <View style={[styles.radiusContainer, { backgroundColor: theme.card }]}>
                <Text style={[styles.radiusLabel, { color: theme.textMuted }]}>Raio:</Text>
                {RADIUS_OPTIONS.map((radius) => (
                    <TouchableOpacity
                        key={radius}
                        style={[
                            styles.radiusButton,
                            selectedRadius === radius && { backgroundColor: theme.primary },
                        ]}
                        onPress={() => setSelectedRadius(radius)}
                    >
                        <Text
                            style={[
                                styles.radiusText,
                                { color: selectedRadius === radius ? '#fff' : theme.text },
                            ]}
                        >
                            {radius}km
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Selected Instructor Card */}
            {selectedInstructor && (
                <View style={[styles.instructorCard, { backgroundColor: theme.card }]}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setSelectedInstructor(null)}
                    >
                        <Ionicons name="close" size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                    <View style={styles.instructorInfo}>
                        {selectedInstructor.photo_url ? (
                            <Image
                                source={{ uri: selectedInstructor.photo_url }}
                                style={styles.instructorPhoto}
                            />
                        ) : (
                            <View style={[styles.instructorPhotoPlaceholder, { backgroundColor: theme.primary }]}>
                                <Text style={styles.instructorInitial}>
                                    {selectedInstructor.full_name.charAt(0)}
                                </Text>
                            </View>
                        )}
                        <View style={styles.instructorDetails}>
                            <Text style={[styles.instructorName, { color: theme.text }]}>
                                {selectedInstructor.full_name}
                            </Text>
                            <View style={styles.ratingRow}>
                                <Ionicons name="star" size={14} color="#f59e0b" />
                                <Text style={[styles.ratingText, { color: theme.text }]}>
                                    {(selectedInstructor.average_rating || 0).toFixed(1)}
                                </Text>
                            </View>
                            <Text style={[styles.priceText, { color: theme.primary }]}>
                                {formatPrice(selectedInstructor.price_per_lesson)}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.viewProfileButton, { backgroundColor: theme.primary }]}
                        onPress={() => router.push(`/connect/instrutor/${selectedInstructor.id}`)}
                    >
                        <Text style={styles.viewProfileText}>Ver Perfil</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Instructor Count */}
            <View style={[styles.countBadge, { backgroundColor: theme.card }]}>
                <Ionicons name="people" size={16} color={theme.primary} />
                <Text style={[styles.countText, { color: theme.text }]}>
                    {instructors.length} instrutor{instructors.length !== 1 ? 'es' : ''} por perto
                </Text>
            </View>
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
        gap: 16,
    },
    loadingText: {
        fontSize: 14,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    locationButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    map: {
        flex: 1,
    },
    markerContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    markerPhoto: {
        width: '100%',
        height: '100%',
    },
    markerInitial: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    radiusContainer: {
        position: 'absolute',
        top: 110,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    radiusLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    radiusButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    radiusText: {
        fontSize: 13,
        fontWeight: '600',
    },
    countBadge: {
        position: 'absolute',
        bottom: 100,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    countText: {
        fontSize: 14,
        fontWeight: '600',
    },
    instructorCard: {
        position: 'absolute',
        bottom: 30,
        left: 16,
        right: 16,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    closeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        padding: 4,
    },
    instructorInfo: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    instructorPhoto: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    instructorPhotoPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructorInitial: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '700',
    },
    instructorDetails: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    instructorName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '600',
    },
    priceText: {
        fontSize: 16,
        fontWeight: '700',
    },
    viewProfileButton: {
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    viewProfileText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});
