import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    ActivityIndicator,
    Dimensions,
    Linking,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../src/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Instructor {
    id: string;
    user_id: string;
    full_name: string;
    phone: string;
    bio: string | null;
    photo_url: string | null;
    city: string;
    state: string;
    categories: string[];
    price_per_lesson: number;
    lesson_duration_minutes: number;
    is_verified: boolean;
    average_rating: number;
    total_reviews: number;
    total_lessons: number;
    status: string;
    vehicle_model?: string;
    vehicle_transmission?: 'manual' | 'automatic';
}

interface Review {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    student_id: string;
}

interface Availability {
    day_of_week: number;
    start_time: string;
    end_time: string;
}

interface LessonPackage {
    id: string;
    name: string;
    total_lessons: number;
    vehicle_type: string;
    total_price: number;
    discount_percent: number;
    is_active: boolean;
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function InstructorProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const [instructor, setInstructor] = useState<Instructor | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [packages, setPackages] = useState<LessonPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [showPackageModal, setShowPackageModal] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<LessonPackage | null>(null);
    const [purchasingPackage, setPurchasingPackage] = useState(false);

    useEffect(() => {
        if (id) {
            fetchInstructorData();
        }
    }, [id]);

    const fetchInstructorData = async () => {
        try {
            // Fetch instructor
            const { data: instructorData, error: instructorError } = await supabase
                .from('instructors')
                .select('*')
                .eq('id', id)
                .single();

            if (instructorError) throw instructorError;
            setInstructor(instructorData as Instructor);

            // Fetch reviews
            const { data: reviewsData } = await supabase
                .from('reviews')
                .select('id, rating, comment, created_at, student_id')
                .eq('instructor_id', id)
                .order('created_at', { ascending: false })
                .limit(5);

            setReviews((reviewsData || []) as Review[]);

            // Fetch availability
            const { data: availabilityData } = await supabase
                .from('instructor_availability')
                .select('day_of_week, start_time, end_time')
                .eq('instructor_id', id)
                .order('day_of_week');

            setAvailability(availabilityData || []);

            // Fetch packages
            const { data: packagesData } = await supabase
                .from('lesson_packages')
                .select('*')
                .eq('instructor_id', id)
                .eq('is_active', true)
                .order('total_lessons');

            setPackages((packagesData || []) as LessonPackage[]);
        } catch (error) {
            console.error('Error fetching instructor:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(price);
    };

    const formatTime = (time: string) => {
        return time.substring(0, 5);
    };

    const handleContact = () => {
        if (instructor?.phone) {
            const phoneNumber = instructor.phone.replace(/\D/g, '');
            Linking.openURL(`tel:${phoneNumber}`);
        }
    };

    const handleWhatsApp = () => {
        if (instructor?.phone) {
            const phoneNumber = instructor.phone.replace(/\D/g, '');
            Linking.openURL(`https://wa.me/55${phoneNumber}`);
        }
    };

    const handleSubmitReview = async () => {
        if (!user) {
            Alert.alert('Login necessário', 'Você precisa estar logado para avaliar.');
            router.push('/(auth)/login');
            return;
        }

        if (!newComment.trim()) {
            Alert.alert('Erro', 'Por favor, escreva um comentário.');
            return;
        }

        setSubmittingReview(true);
        try {
            // First, find a valid booking for this student and instructor
            const { data: bookingData, error: bookingError } = await supabase
                .from('bookings')
                .select('id')
                .eq('student_id', user.id)
                .eq('instructor_id', id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (bookingError || !bookingData) {
                Alert.alert('Aviso', 'Você precisa ter agendado uma aula com este instrutor para avaliar.');
                setSubmittingReview(false);
                return;
            }

            const { error } = await supabase.from('reviews').insert({
                instructor_id: id,
                student_id: user.id,
                booking_id: bookingData.id, // Linked to the booking
                rating: newRating,
                comment: newComment,
                created_at: new Date().toISOString(),
            });

            if (error) throw error;

            Alert.alert('Sucesso', 'Avaliação enviada com sucesso!');
            setShowReviewModal(false);
            setNewComment('');
            setNewRating(5);
            fetchInstructorData(); // Refresh reviews
        } catch (error: any) {
            console.error('Error submitting review:', error);
            Alert.alert('Erro', 'Não foi possível enviar a avaliação.');
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleBooking = () => {
        if (!user) {
            router.push('/(auth)/login');
            return;
        }
        router.push(`/connect/agendar/${id}`);
    };

    const openPackageModal = (pkg: LessonPackage) => {
        if (!user) {
            router.push('/(auth)/login');
            return;
        }
        setSelectedPackage(pkg);
        setShowPackageModal(true);
    };

    const handlePurchasePackage = async () => {
        if (!user || !selectedPackage || !instructor) return;

        setPurchasingPackage(true);
        try {
            // Check for existing active package
            const { data: existingPackage } = await supabase
                .from('student_packages')
                .select('id')
                .eq('student_id', user.id)
                .eq('status', 'active')
                .single();

            if (existingPackage) {
                Alert.alert('Pacote Ativo', 'Você já possui um pacote ativo. Finalize-o antes de comprar outro.');
                setShowPackageModal(false);
                return;
            }

            const { error } = await supabase.from('student_packages').insert({
                student_id: user.id,
                package_id: selectedPackage.id,
                instructor_id: instructor.id,
                lessons_total: selectedPackage.total_lessons,
                lessons_used: 0,
                vehicle_type: selectedPackage.vehicle_type,
                total_paid: selectedPackage.total_price,
                status: 'active',
            });

            if (error) throw error;

            Alert.alert(
                'Compra Realizada! 🎉',
                `Você adquiriu ${selectedPackage.total_lessons} aulas. Agora você pode agendar!`,
                [{ text: 'Agendar Agora', onPress: () => router.push(`/connect/agendar/${id}`) }]
            );
            setShowPackageModal(false);
        } catch (error: any) {
            console.error('Purchase error:', error);
            Alert.alert('Erro', error.message || 'Não foi possível completar a compra');
        } finally {
            setPurchasingPackage(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!instructor) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={[styles.backButton, { backgroundColor: theme.card }]}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={22} color={theme.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={[styles.errorText, { color: theme.text }]}>
                        Instrutor não encontrado
                    </Text>
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
                <Text style={[styles.headerTitle, { color: theme.text }]}>Perfil</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Card */}
                <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
                    {/* Photo */}
                    <View style={styles.photoSection}>
                        {instructor.photo_url ? (
                            <Image
                                source={{ uri: instructor.photo_url }}
                                style={styles.profilePhoto}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[styles.photoPlaceholder, { backgroundColor: theme.primary }]}>
                                <Text style={styles.photoInitial}>
                                    {instructor.full_name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        {instructor.is_verified && (
                            <View style={[styles.verifiedBadge, { backgroundColor: theme.primary }]}>
                                <Ionicons name="checkmark" size={14} color="#fff" />
                            </View>
                        )}
                    </View>

                    {/* Info */}
                    <Text style={[styles.instructorName, { color: theme.text }]}>
                        {instructor.full_name}
                    </Text>

                    {/* Vehicle Info Badge */}
                    {(instructor.vehicle_model || instructor.vehicle_transmission) && (
                        <View style={[styles.vehicleBadgeContainer, { backgroundColor: theme.background }]}>
                            <Ionicons name="car-sport-outline" size={14} color={theme.primary} />
                            <Text style={[styles.vehicleText, { color: theme.text }]}>
                                {instructor.vehicle_model ? instructor.vehicle_model : 'Carro'} • {instructor.vehicle_transmission === 'automatic' ? 'Automático' : 'Manual'}
                            </Text>
                        </View>
                    )}

                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={16} color={theme.textMuted} />
                        <Text style={[styles.locationText, { color: theme.textMuted }]}>
                            {instructor.city}, {instructor.state}
                        </Text>
                    </View>

                    {/* Rating */}
                    <View style={styles.ratingContainer}>
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Ionicons
                                    key={star}
                                    name={star <= Math.round(instructor.average_rating) ? 'star' : 'star-outline'}
                                    size={20}
                                    color="#f59e0b"
                                />
                            ))}
                        </View>
                        <Text style={[styles.ratingText, { color: theme.text }]}>
                            {Number(instructor.average_rating).toFixed(1)}
                        </Text>
                        <Text style={[styles.reviewsText, { color: theme.textMuted }]}>
                            ({instructor.total_reviews} avaliações)
                        </Text>
                    </View>

                    {/* Categories */}
                    <View style={styles.categoriesRow}>
                        {instructor.categories.map((cat) => (
                            <View
                                key={cat}
                                style={[styles.categoryBadge, { backgroundColor: theme.primaryLight }]}
                            >
                                <Text style={[styles.categoryText, { color: theme.primary }]}>
                                    Categoria {cat}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Stats */}
                    <View style={[styles.statsRow, { borderTopColor: theme.cardBorder }]}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.primary }]}>
                                {instructor.total_lessons}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Aulas</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.primary }]}>
                                {instructor.lesson_duration_minutes}min
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Duração</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.primary }]}>
                                {formatPrice(instructor.price_per_lesson)}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Por aula</Text>
                        </View>
                    </View>
                </View>

                {/* Bio */}
                {instructor.bio && (
                    <View style={[styles.section, { backgroundColor: theme.card }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Sobre</Text>
                        <Text style={[styles.bioText, { color: theme.textSecondary }]}>
                            {instructor.bio}
                        </Text>
                    </View>
                )}

                {/* Availability */}
                {availability.length > 0 && (
                    <View style={[styles.section, { backgroundColor: theme.card }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Disponibilidade</Text>
                        <View style={styles.availabilityGrid}>
                            {availability.map((slot, index) => (
                                <View
                                    key={index}
                                    style={[styles.availabilityItem, { backgroundColor: theme.background }]}
                                >
                                    <Text style={[styles.dayName, { color: theme.text }]}>
                                        {DAY_NAMES[slot.day_of_week]}
                                    </Text>
                                    <Text style={[styles.timeRange, { color: theme.textMuted }]}>
                                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Packages */}
                {packages.length > 0 && (
                    <View style={[styles.section, { backgroundColor: theme.card }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            📦 Pacotes de Aulas
                        </Text>
                        <Text style={[styles.packageSubtitle, { color: theme.textMuted }]}>
                            Economize comprando um pacote de aulas
                        </Text>
                        <View style={styles.packagesContainer}>
                            {packages.map((pkg) => (
                                <TouchableOpacity
                                    key={pkg.id}
                                    style={[styles.packageCard, { backgroundColor: theme.background, borderColor: theme.primaryLight }]}
                                    onPress={() => openPackageModal(pkg)}
                                >
                                    <View style={styles.packageCardHeader}>
                                        <Text style={[styles.packageCardName, { color: theme.text }]}>
                                            {pkg.name}
                                        </Text>
                                        <View style={[styles.packageDiscount, { backgroundColor: '#dcfce7' }]}>
                                            <Text style={styles.packageDiscountText}>-{pkg.discount_percent}%</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.packageCardLessons, { color: theme.textSecondary }]}>
                                        {pkg.total_lessons} aulas • {pkg.vehicle_type === 'instructor' ? '🚗 Carro instrutor' : '🔑 Seu carro'}
                                    </Text>
                                    <Text style={[styles.packageCardPrice, { color: theme.primary }]}>
                                        {formatPrice(pkg.total_price)}
                                    </Text>
                                    <Text style={[styles.packageCardPerLesson, { color: theme.textMuted }]}>
                                        {formatPrice(pkg.total_price / pkg.total_lessons)}/aula
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Reviews */}
                <View style={[styles.section, { backgroundColor: theme.card }]}>
                    <View style={styles.reviewsHeaderContainer}>
                        <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Avaliações</Text>
                        <TouchableOpacity
                            style={[styles.addReviewButton, { borderColor: theme.primary }]}
                            onPress={() => setShowReviewModal(true)}
                        >
                            <Text style={[styles.addReviewText, { color: theme.primary }]}>Avaliar</Text>
                        </TouchableOpacity>
                    </View>
                    {reviews.length === 0 ? (
                        <Text style={{ color: theme.textMuted, marginTop: 12, fontStyle: 'italic' }}>
                            Seja o primeiro a avaliar este instrutor!
                        </Text>
                    ) : (
                        reviews.map((review) => (
                            <View
                                key={review.id}
                                style={[styles.reviewItem, { borderBottomColor: theme.cardBorder }]}
                            >
                                <View style={styles.reviewHeader}>
                                    <View style={styles.reviewStars}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Ionicons
                                                key={star}
                                                name={star <= review.rating ? 'star' : 'star-outline'}
                                                size={14}
                                                color="#f59e0b"
                                            />
                                        ))}
                                    </View>
                                    <Text style={[styles.reviewDate, { color: theme.textMuted }]}>
                                        {new Date(review.created_at).toLocaleDateString('pt-BR')}
                                    </Text>
                                </View>
                                {review.comment && (
                                    <Text style={[styles.reviewComment, { color: theme.textSecondary }]}>
                                        {review.comment}
                                    </Text>
                                )}
                            </View>
                        ))
                    )}
                </View>

                {/* Contact info only available after booking */}
                <View style={[styles.section, { backgroundColor: theme.card }]}>
                    <View style={styles.contactInfoLocked}>
                        <Ionicons name="lock-closed" size={24} color={theme.textMuted} />
                        <Text style={[styles.contactLockedTitle, { color: theme.text }]}>
                            Dados de contato
                        </Text>
                        <Text style={[styles.contactLockedText, { color: theme.textMuted }]}>
                            Telefone e WhatsApp disponíveis após agendar e pagar a aula
                        </Text>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Book Button */}
            <View style={[styles.bookButtonContainer, { backgroundColor: theme.background }]}>
                {user?.id === instructor.user_id ? (
                    <View style={[styles.bookButton, { backgroundColor: theme.cardBorder }]}>
                        <Ionicons name="person" size={22} color={theme.textMuted} />
                        <Text style={[styles.bookButtonText, { color: theme.textMuted }]}>
                            Este é seu perfil
                        </Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.bookButton, { backgroundColor: theme.primary }]}
                        onPress={handleBooking}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="calendar-outline" size={22} color="#fff" />
                        <Text style={styles.bookButtonText}>Agendar Aula</Text>
                        <Text style={styles.bookButtonPrice}>
                            {formatPrice(instructor.price_per_lesson)}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <Modal
                visible={showReviewModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowReviewModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Avaliar Instrutor</Text>
                            <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                                <Ionicons name="close" size={24} color={theme.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.ratingInputContainer}>
                            <Text style={[styles.ratingLabel, { color: theme.textSecondary }]}>Sua nota:</Text>
                            <View style={styles.starsInput}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setNewRating(star)}>
                                        <Ionicons
                                            name={star <= newRating ? 'star' : 'star-outline'}
                                            size={32}
                                            color="#f59e0b"
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <TextInput
                            style={[
                                styles.commentInput,
                                {
                                    backgroundColor: theme.background,
                                    color: theme.text,
                                    borderColor: theme.inputBorder
                                }
                            ]}
                            placeholder="Escreva seu comentário sobre a aula..."
                            placeholderTextColor={theme.textMuted}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            value={newComment}
                            onChangeText={setNewComment}
                        />

                        <TouchableOpacity
                            style={[styles.submitReviewButton, { backgroundColor: theme.primary }]}
                            onPress={handleSubmitReview}
                            disabled={submittingReview}
                        >
                            {submittingReview ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitReviewText}>Enviar Avaliação</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Package Purchase Modal */}
            <Modal
                visible={showPackageModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowPackageModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.packageModalContent, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Comprar Pacote</Text>
                            <TouchableOpacity onPress={() => setShowPackageModal(false)}>
                                <Ionicons name="close" size={24} color={theme.textMuted} />
                            </TouchableOpacity>
                        </View>

                        {selectedPackage && (
                            <>
                                <View style={[styles.packageModalCard, { backgroundColor: theme.background }]}>
                                    <View style={styles.packageModalHeader}>
                                        <Text style={[styles.packageModalName, { color: theme.text }]}>
                                            {selectedPackage.name}
                                        </Text>
                                        <View style={[styles.packageDiscount, { backgroundColor: '#dcfce7' }]}>
                                            <Text style={styles.packageDiscountText}>-{selectedPackage.discount_percent}%</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.packageModalLessons, { color: theme.textMuted }]}>
                                        {selectedPackage.total_lessons} aulas • {selectedPackage.vehicle_type === 'instructor' ? '🚗 Carro instrutor' : '🔑 Seu carro'}
                                    </Text>
                                </View>

                                <View style={styles.packageModalBenefits}>
                                    <View style={styles.benefitRow}>
                                        <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                                        <Text style={[styles.benefitText, { color: theme.text }]}>Economia de {selectedPackage.discount_percent}%</Text>
                                    </View>
                                    <View style={styles.benefitRow}>
                                        <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                                        <Text style={[styles.benefitText, { color: theme.text }]}>Sem prazo de validade</Text>
                                    </View>
                                </View>

                                <View style={[styles.packageModalTotal, { borderTopColor: theme.cardBorder }]}>
                                    <Text style={{ color: theme.textMuted }}>Total</Text>
                                    <Text style={[styles.packageModalPrice, { color: theme.primary }]}>
                                        {formatPrice(selectedPackage.total_price)}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={[styles.purchaseButton, { backgroundColor: theme.primary }]}
                                    onPress={handlePurchasePackage}
                                    disabled={purchasingPackage}
                                >
                                    {purchasingPackage ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="cart" size={20} color="#fff" />
                                            <Text style={styles.purchaseButtonText}>Comprar Agora</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // ... existing styles ...
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    // Profile Card
    profileCard: {
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
    },
    photoSection: {
        position: 'relative',
        marginBottom: 16,
    },
    profilePhoto: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    photoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoInitial: {
        fontSize: 48,
        fontWeight: '700',
        color: '#fff',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    instructorName: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    vehicleBadgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 12,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    vehicleText: {
        fontSize: 14,
        fontWeight: '600',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    locationText: {
        fontSize: 14,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 2,
    },
    ratingText: {
        fontSize: 16,
        fontWeight: '700',
    },
    reviewsText: {
        fontSize: 14,
    },
    categoriesRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    categoryBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        width: '100%',
        borderTopWidth: 1,
        paddingTop: 20,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
    },
    statDivider: {
        width: 1,
        height: 40,
    },
    // Section
    section: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    bioText: {
        fontSize: 14,
        lineHeight: 22,
    },
    // Availability
    availabilityGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    availabilityItem: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    dayName: {
        fontSize: 13,
        fontWeight: '600',
    },
    timeRange: {
        fontSize: 11,
    },
    // Reviews
    reviewsHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    addReviewButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    addReviewText: {
        fontSize: 12,
        fontWeight: '600',
    },
    reviewItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    reviewStars: {
        flexDirection: 'row',
        gap: 2,
    },
    reviewDate: {
        fontSize: 12,
    },
    reviewComment: {
        fontSize: 14,
        lineHeight: 20,
    },
    // Contact Buttons
    contactButtons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    contactButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
    },
    contactButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    // Locked Contact Info
    contactInfoLocked: {
        alignItems: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    contactLockedTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 4,
    },
    contactLockedText: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
    },
    // Book Button
    bookButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 32,
    },
    bookButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 18,
        borderRadius: 16,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    bookButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    bookButtonPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        opacity: 0.9,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    ratingInputContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    ratingLabel: {
        fontSize: 16,
        marginBottom: 12,
    },
    starsInput: {
        flexDirection: 'row',
        gap: 8,
    },
    commentInput: {
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        marginBottom: 24,
        height: 120,
    },
    submitReviewButton: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitReviewText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Packages
    packageSubtitle: {
        fontSize: 13,
        marginTop: -8,
        marginBottom: 16,
    },
    packagesContainer: {
        gap: 12,
    },
    packageCard: {
        padding: 16,
        borderRadius: 14,
        borderWidth: 2,
    },
    packageCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    packageCardName: {
        fontSize: 16,
        fontWeight: '600',
    },
    packageDiscount: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    packageDiscountText: {
        color: '#166534',
        fontSize: 12,
        fontWeight: '700',
    },
    packageCardLessons: {
        fontSize: 13,
        marginBottom: 8,
    },
    packageCardPrice: {
        fontSize: 22,
        fontWeight: '700',
    },
    packageCardPerLesson: {
        fontSize: 12,
        marginTop: 2,
    },
    // Package Modal Styles
    packageModalContent: {
        width: '90%',
        maxWidth: 380,
        borderRadius: 24,
        padding: 24,
    },
    packageModalCard: {
        padding: 16,
        borderRadius: 14,
        marginBottom: 16,
    },
    packageModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    packageModalName: {
        fontSize: 18,
        fontWeight: '700',
    },
    packageModalLessons: {
        fontSize: 14,
    },
    packageModalBenefits: {
        marginBottom: 16,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    benefitText: {
        fontSize: 14,
    },
    packageModalTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        marginBottom: 20,
    },
    packageModalPrice: {
        fontSize: 24,
        fontWeight: '800',
    },
    purchaseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 52,
        borderRadius: 14,
    },
    purchaseButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
