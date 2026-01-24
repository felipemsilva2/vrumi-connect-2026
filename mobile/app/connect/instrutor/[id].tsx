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
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../src/lib/supabase';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { getVehicleModel, getVehicleModelByName } from '../../../data/vehicleModels';

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
    approved?: boolean;
    stripe_onboarding_complete?: boolean;
    vehicle_model?: string;
    vehicle_transmission?: 'manual' | 'automatic';
    vehicle_color?: string;
    vehicle_has_ac?: boolean;
    vehicle_steering_type?: 'hydraulic' | 'electric' | 'mechanical';
    vehicle_is_adapted?: boolean;
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
    const [hasAccess, setHasAccess] = useState(false);

    // Unavailable booking modal
    const [showUnavailableModal, setShowUnavailableModal] = useState(false);
    const [unavailableMessage, setUnavailableMessage] = useState('');

    useEffect(() => {
        if (id) {
            fetchInstructorData();
        }
    }, [id]);

    const fetchInstructorData = async () => {
        try {
            const { data: instructorData, error: instructorError } = await supabase
                .from('instructors')
                .select('*')
                .eq('id', id)
                .single();

            if (instructorError) throw instructorError;
            setInstructor(instructorData as Instructor);

            const { data: reviewsData } = await supabase
                .from('reviews')
                .select('id, rating, comment, created_at, student_id')
                .eq('instructor_id', id)
                .order('created_at', { ascending: false })
                .limit(5);

            setReviews((reviewsData || []) as Review[]);

            const { data: availabilityData } = await supabase
                .from('instructor_availability')
                .select('day_of_week, start_time, end_time')
                .eq('instructor_id', id)
                .order('day_of_week');

            setAvailability(availabilityData || []);

            const { data: packagesData } = await supabase
                .from('lesson_packages')
                .select('*')
                .eq('instructor_id', id)
                .eq('is_active', true)
                .order('total_lessons');

            setPackages((packagesData || []) as LessonPackage[]);

            if (user?.id) {
                checkUserAccess();
            }
        } catch (error) {
            console.error('Error fetching instructor:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkUserAccess = async () => {
        if (!user?.id || !id) return;

        try {
            // Check for bookings
            const { data: booking } = await supabase
                .from('bookings')
                .select('id')
                .eq('student_id', user.id)
                .eq('instructor_id', id)
                .limit(1)
                .maybeSingle();

            if (booking) {
                setHasAccess(true);
                return;
            }

            // Check for packages
            const { data: pkg } = await supabase
                .from('student_packages')
                .select('id')
                .eq('student_id', user.id)
                .eq('instructor_id', id)
                .eq('status', 'active')
                .limit(1)
                .maybeSingle();

            if (pkg) {
                setHasAccess(true);
            }
        } catch (error) {
            console.log('Access check:', error);
        }
    };

    const handleOpenChat = async () => {
        if (!user || !instructor) return;

        try {
            // Find existing room
            const { data: room } = await supabase
                .from('connect_chat_rooms')
                .select('id')
                .eq('student_id', user.id)
                .eq('instructor_id', instructor.id)
                .single();

            if (room) {
                router.push(`/connect/chat/${room.id}`);
                return;
            }

            // Create new room if not exists
            const { data: newRoom, error: createError } = await supabase
                .from('connect_chat_rooms')
                .insert({
                    student_id: user.id,
                    instructor_id: instructor.id
                })
                .select()
                .single();

            if (createError) throw createError;
            if (newRoom) router.push(`/connect/chat/${newRoom.id}`);

        } catch (error) {
            console.error('Error opening chat:', error);
            Alert.alert('Erro', 'Não foi possível iniciar a conversa.');
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
            // Get the current date/time
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const currentTime = now.toTimeString().split(' ')[0];

            // Check for a completed lesson (confirmed status and date/time in the past)
            const { data: bookingData, error: bookingError } = await supabase
                .from('bookings')
                .select('id, scheduled_date, scheduled_time, status')
                .eq('student_id', user.id)
                .eq('instructor_id', id)
                .in('status', ['confirmed', 'completed'])
                .order('scheduled_date', { ascending: false })
                .limit(10);

            if (bookingError || !bookingData || bookingData.length === 0) {
                Alert.alert('Aviso', 'Você precisa ter agendado uma aula com este instrutor para avaliar.');
                setSubmittingReview(false);
                return;
            }

            // Find a lesson that has already occurred
            const completedLesson = bookingData.find(booking => {
                if (booking.scheduled_date < today) return true;
                if (booking.scheduled_date === today && booking.scheduled_time < currentTime) return true;
                return false;
            });

            if (!completedLesson) {
                Alert.alert('Aguarde a aula', 'Você só pode avaliar após a aula ter sido realizada.');
                setSubmittingReview(false);
                return;
            }

            const { error } = await supabase.from('reviews').insert({
                instructor_id: id,
                student_id: user.id,
                booking_id: completedLesson.id,
                rating: newRating,
                comment: newComment,
                created_at: new Date().toISOString(),
            });

            if (error) throw error;

            Alert.alert('Sucesso', 'Avaliação enviada com sucesso!');
            setShowReviewModal(false);
            setNewComment('');
            setNewRating(5);
            fetchInstructorData();
        } catch (error: any) {
            console.error('Error submitting review:', error);
            Alert.alert('Erro', 'Não foi possível enviar a avaliação.');
        } finally {
            setSubmittingReview(false);
        }
    };

    // Compute if booking is allowed
    const canBook = instructor?.approved && instructor?.stripe_onboarding_complete;

    const showDisabledAlert = () => {
        let message = '';
        if (!instructor?.approved) {
            message = 'Este instrutor ainda está em processo de verificação. Tente novamente em breve!';
        } else if (!instructor?.stripe_onboarding_complete) {
            message = 'Este instrutor ainda está configurando sua conta para receber pagamentos. Tente novamente em breve!';
        }
        setUnavailableMessage(message);
        setShowUnavailableModal(true);
    };

    const handleBooking = () => {
        if (!user) {
            router.push('/(auth)/login');
            return;
        }
        if (!canBook) {
            showDisabledAlert();
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
            const { data: existingPackage } = await supabase
                .from('student_packages')
                .select('id, instructor_id, lessons_total')
                .eq('student_id', user.id)
                .eq('status', 'active')
                .maybeSingle();

            if (existingPackage) {
                if (existingPackage.instructor_id === instructor.id) {
                    // Offer options for same instructor
                    Alert.alert(
                        'Pacote Ativo',
                        'Você já possui um pacote ativo com este instrutor. O que deseja fazer?',
                        [
                            {
                                text: 'Somar Aulas',
                                onPress: () => initiatePurchase('sum', existingPackage.id)
                            },
                            {
                                text: 'Trocar Plano',
                                onPress: () => initiatePurchase('switch', existingPackage.id)
                            },
                            { text: 'Cancelar', style: 'cancel' }
                        ]
                    );
                } else {
                    Alert.alert('Pacote Ativo', 'Você já possui um pacote ativo com outro instrutor. Finalize-o antes de comprar outro.');
                }
                setShowPackageModal(false);
                return;
            }

            await initiatePurchase();
        } catch (error: any) {
            console.error('Purchase check error:', error);
            Alert.alert('Erro', 'Não foi possível verificar pacotes existentes.');
        } finally {
            setPurchasingPackage(false);
        }
    };

    const initiatePurchase = async (action?: 'sum' | 'switch', oldPackageId?: string) => {
        if (!user || !selectedPackage || !instructor) return;

        setPurchasingPackage(true);
        try {
            const { data: newPkg, error } = await supabase.from('student_packages').insert({
                student_id: user.id,
                package_id: selectedPackage.id,
                instructor_id: instructor.id,
                lessons_total: selectedPackage.total_lessons,
                lessons_used: 0,
                vehicle_type: selectedPackage.vehicle_type,
                total_paid: selectedPackage.total_price,
                status: 'pending',
                metadata: action ? { action, old_package_id: oldPackageId } : {}
            }).select().single();

            if (error) throw error;

            // Redirect to Checkout with action param
            setShowPackageModal(false);
            const actionParam = action ? `&action=${action}&old_id=${oldPackageId}` : '';
            router.push(`/connect/checkout/${newPkg.id}?type=package${actionParam}`);
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
                <TouchableOpacity style={[styles.backButtonFixed, { backgroundColor: theme.card }]} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.loadingContainer}>
                    <Text style={[styles.errorText, { color: theme.text }]}>Instrutor não encontrado</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Immersive Header */}
                <View style={styles.immersiveHeader}>
                    {instructor.photo_url ? (
                        <Image source={{ uri: instructor.photo_url }} style={styles.headerImage} />
                    ) : (
                        <View style={[styles.headerImagePlaceholder, { backgroundColor: theme.primary }]}>
                            <Text style={styles.photoInitialLarge}>{instructor.full_name.charAt(0).toUpperCase()}</Text>
                        </View>
                    )}
                    <View style={styles.headerOverlay} />

                    <TouchableOpacity style={styles.backButtonFixed} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.headerInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.instructorNameWhite}>{instructor.full_name}</Text>
                            {instructor.is_verified && (
                                <View style={styles.verifiedBadgeMini}>
                                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                </View>
                            )}
                        </View>
                        <View style={styles.locationRowWhite}>
                            <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.locationTextWhite}>{instructor.city}, {instructor.state}</Text>
                        </View>
                        {/* Pending Verification Badge */}
                        {!instructor.approved && (
                            <View style={styles.pendingBadge}>
                                <Ionicons name="time" size={14} color="#d97706" />
                                <Text style={styles.pendingBadgeText}>Em verificação</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Warning Banner - Payment not setup */}
                {!canBook && instructor.approved && !instructor.stripe_onboarding_complete && (
                    <View style={styles.warningBanner}>
                        <Ionicons name="alert-circle" size={20} color="#d97706" />
                        <Text style={styles.warningBannerText}>
                            Este instrutor está configurando pagamentos. Agendamento em breve.
                        </Text>
                    </View>
                )}

                {/* Trust Bar */}
                <View style={[styles.trustBar, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
                    <View style={styles.trustItem}>
                        <Text style={[styles.trustValue, { color: theme.text }]}>{Number(instructor.average_rating).toFixed(1)}</Text>
                        <View style={styles.trustLabelRow}>
                            <Ionicons name="star" size={12} color="#f59e0b" />
                            <Text style={[styles.trustLabel, { color: theme.textMuted }]}>{instructor.total_reviews} avaliações</Text>
                        </View>
                    </View>
                    <View style={[styles.trustDivider, { backgroundColor: theme.cardBorder }]} />
                    <View style={styles.trustItem}>
                        <Text style={[styles.trustValue, { color: theme.text }]}>{instructor.total_lessons}</Text>
                        <Text style={[styles.trustLabel, { color: theme.textMuted }]}>Aulas dadas</Text>
                    </View>
                    <View style={[styles.trustDivider, { backgroundColor: theme.cardBorder }]} />
                    <View style={styles.trustItem}>
                        <Text style={[styles.trustValue, { color: theme.text }]}>{instructor.categories.join(', ')}</Text>
                        <Text style={[styles.trustLabel, { color: theme.textMuted }]}>Categorias</Text>
                    </View>
                </View>

                <View style={styles.contentPadding}>
                    {/* Bio Section */}
                    {instructor.bio && (
                        <View style={styles.sectionHeaderless}>
                            <Text style={[styles.bioTextLarge, { color: theme.textSecondary }]}>{instructor.bio}</Text>
                        </View>
                    )}

                    {/* Vehicle Card */}
                    {(instructor.vehicle_model || instructor.vehicle_transmission) && (() => {
                        // Priority: 1) Uploaded photo, 2) Model image from data, 3) Icon
                        const uploadedPhotoUrl = (instructor as any).vehicle_photo_url;
                        const vehicleData = (instructor as any).vehicle_model_id
                            ? getVehicleModel((instructor as any).vehicle_model_id)
                            : getVehicleModelByName(instructor.vehicle_model || '');
                        const vehicleImageUrl = uploadedPhotoUrl || vehicleData?.imageUrl;

                        return (
                            <View style={[styles.vehiclePremiumCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                                {vehicleImageUrl ? (
                                    <Image
                                        source={{ uri: vehicleImageUrl }}
                                        style={styles.vehicleImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={[styles.vehicleIconCircle, { backgroundColor: theme.primaryLight }]}>
                                        <Ionicons name="car-sport" size={24} color={theme.primary} />
                                    </View>
                                )}
                                <View style={styles.vehicleInfoPrimary}>
                                    <Text style={[styles.vehicleTitle, { color: theme.text }]}>Carro de Treino</Text>
                                    <Text style={[styles.vehicleModelText, { color: theme.textSecondary }]}>
                                        {instructor.vehicle_model || 'Não informado'} • {instructor.vehicle_transmission === 'automatic' ? 'Automático' : 'Manual'}
                                        {instructor.vehicle_color ? ` • ${instructor.vehicle_color}` : ''}
                                    </Text>
                                    <View style={styles.vehicleTags}>
                                        {instructor.vehicle_has_ac && (
                                            <View style={[styles.vTag, { backgroundColor: theme.background }]}>
                                                <Text style={[styles.vTagText, { color: theme.textMuted }]}>Ar condicionado</Text>
                                            </View>
                                        )}
                                        {instructor.vehicle_steering_type && (
                                            <View style={[styles.vTag, { backgroundColor: theme.background }]}>
                                                <Text style={[styles.vTagText, { color: theme.textMuted }]}>
                                                    Direção {instructor.vehicle_steering_type === 'hydraulic' ? 'hidráulica' : instructor.vehicle_steering_type === 'electric' ? 'elétrica' : 'mecânica'}
                                                </Text>
                                            </View>
                                        )}
                                        {instructor.vehicle_is_adapted && (
                                            <View style={[styles.vTag, { backgroundColor: '#dbeafe' }]}>
                                                <Text style={[styles.vTagText, { color: '#1e40af' }]}>Comandos Duplos</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        );
                    })()}

                    {/* Packages Horizontal Carousel */}
                    {packages.length > 0 && (
                        <View style={styles.sectionMargin}>
                            <View style={styles.sectionTitleRow}>
                                <Text style={[styles.sectionTitlePremium, { color: theme.text }]}>Economize com Pacotes</Text>
                                <View style={styles.popularBadge}><Text style={styles.popularBadgeText}>MELHOR VALOR</Text></View>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.packagesCarousel}>
                                {packages.map((pkg) => (
                                    <TouchableOpacity
                                        key={pkg.id}
                                        style={[styles.packageCardPremium, { backgroundColor: theme.card, borderColor: theme.primaryLight }]}
                                        onPress={() => openPackageModal(pkg)}
                                    >
                                        <View style={styles.packageDiscountBadge}>
                                            <Text style={styles.discountBadgeText}>-{pkg.discount_percent}%</Text>
                                        </View>
                                        <Text style={[styles.packageCardNameP, { color: theme.text }]}>{pkg.name}</Text>
                                        <Text style={[styles.packageCardLessonsP, { color: theme.textMuted }]}>{pkg.total_lessons} aulas</Text>
                                        <Text style={[styles.packageCardPriceP, { color: theme.primary }]}>{formatPrice(pkg.total_price)}</Text>
                                        <View style={styles.perLessonRow}>
                                            <Text style={[styles.perLessonText, { color: theme.textMuted }]}>{formatPrice(pkg.total_price / pkg.total_lessons)}/aula</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Availability */}
                    {availability.length > 0 && (
                        <View style={styles.sectionMargin}>
                            <Text style={[styles.sectionTitlePremium, { color: theme.text }]}>Disponibilidade</Text>
                            <View style={styles.availabilityListAlt}>
                                {availability.slice(0, 3).map((slot, index) => (
                                    <View key={index} style={styles.availabilityRowAlt}>
                                        <Text style={[styles.dayLabelAlt, { color: theme.text }]}>{DAY_NAMES[slot.day_of_week]}</Text>
                                        <View style={[styles.timeTagAlt, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                                            <Text style={[styles.timeLabelAlt, { color: theme.textMuted }]}>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</Text>
                                        </View>
                                    </View>
                                ))}
                                <TouchableOpacity style={styles.seeFullSchedule} onPress={handleBooking}>
                                    <Text style={[styles.seeFullScheduleText, { color: theme.primary }]}>Ver agenda completa</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Reviews */}
                    <View style={styles.sectionMargin}>
                        <View style={styles.sectionTitleRow}>
                            <Text style={[styles.sectionTitlePremium, { color: theme.text }]}>O que dizem os alunos</Text>
                            <TouchableOpacity onPress={() => setShowReviewModal(true)}>
                                <Text style={[styles.leaveReviewText, { color: theme.primary }]}>Avaliar</Text>
                            </TouchableOpacity>
                        </View>

                        {reviews.length === 0 ? (
                            <View style={[styles.emptyStateBox, { backgroundColor: theme.card }]}>
                                <Text style={[styles.emptyStateText, { color: theme.textMuted }]}>Nenhuma avaliação ainda.</Text>
                            </View>
                        ) : (
                            reviews.map((review) => (
                                <View key={review.id} style={[styles.reviewCardAlt, { borderBottomColor: theme.cardBorder }]}>
                                    <View style={styles.reviewHeaderAlt}>
                                        <View style={styles.starsMini}>
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Ionicons key={s} name={s <= review.rating ? 'star' : 'star-outline'} size={12} color="#f59e0b" />
                                            ))}
                                        </View>
                                        <Text style={[styles.reviewDateAlt, { color: theme.textMuted }]}>{new Date(review.created_at).toLocaleDateString('pt-BR')}</Text>
                                    </View>
                                    <Text style={[styles.reviewCommentAlt, { color: theme.textSecondary }]}>{review.comment}</Text>
                                </View>
                            ))
                        )}
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Sticky Action Button */}
            <View style={[styles.bottomActionBar, { backgroundColor: theme.background, borderTopColor: theme.cardBorder }]}>
                <View style={styles.actionPriceInfo}>
                    <Text style={[styles.priceTagSmall, { color: theme.textMuted }]}>Preço da aula</Text>
                    <Text style={[styles.priceTagLarge, { color: theme.text }]}>{formatPrice(instructor.price_per_lesson)}</Text>
                </View>

                <View style={styles.actionButtonsRow}>
                    {hasAccess && (
                        <TouchableOpacity
                            style={[styles.chatIconButton, { borderColor: theme.cardBorder, borderWidth: 1 }]}
                            onPress={handleOpenChat}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="chatbubble-ellipses-outline" size={24} color={theme.text} />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.primaryActionButton,
                            { backgroundColor: canBook ? theme.primary : '#9ca3af' }
                        ]}
                        onPress={handleBooking}
                        activeOpacity={canBook ? 0.9 : 0.6}
                    >
                        <Text style={styles.primaryActionButtonText}>
                            {canBook ? 'Agendar Aula' : 'Indisponível'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Modals remain similarly structured but with themed styling updates */}
            <Modal visible={showReviewModal} transparent animationType="slide">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={[styles.modalContentAlt, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeaderAlt}>
                            <Text style={[styles.modalTitleAlt, { color: theme.text }]}>Avaliar Instrutor</Text>
                            <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                                <Ionicons name="close" size={24} color={theme.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.ratingInputBox}>
                            <Text style={[styles.ratingLabelAlt, { color: theme.textSecondary }]}>Sua experiência:</Text>
                            <View style={styles.starsInputAlt}>
                                {[1, 2, 3, 4, 5].map(s => (
                                    <TouchableOpacity key={s} onPress={() => setNewRating(s)}>
                                        <Ionicons name={s <= newRating ? 'star' : 'star-outline'} size={36} color="#f59e0b" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        <TextInput
                            style={[styles.commentInputAlt, { backgroundColor: theme.background, color: theme.text, borderColor: theme.cardBorder }]}
                            placeholder="Conte como foi sua aula..."
                            placeholderTextColor={theme.textMuted}
                            multiline
                            textAlignVertical="top"
                            value={newComment}
                            onChangeText={setNewComment}
                        />
                        <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }]} onPress={handleSubmitReview} disabled={submittingReview}>
                            {submittingReview ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitBtnText}>Enviar</Text>}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal visible={showPackageModal} transparent animationType="fade">
                <View style={styles.modalOverlayCenter}>
                    <View style={[styles.packagePurchaseCard, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeaderAlt}>
                            <Text style={[styles.modalTitleAlt, { color: theme.text }]}>Confirme sua compra</Text>
                            <TouchableOpacity onPress={() => setShowPackageModal(false)}>
                                <Ionicons name="close" size={24} color={theme.textMuted} />
                            </TouchableOpacity>
                        </View>
                        {selectedPackage && (
                            <>
                                <View style={[styles.packagePreviewBox, { backgroundColor: theme.background }]}>
                                    <View style={styles.packagePreviewHeader}>
                                        <Text style={[styles.pPName, { color: theme.text }]}>{selectedPackage.name}</Text>
                                        <View style={styles.pPDiscount}><Text style={styles.pPDiscountText}>-{selectedPackage.discount_percent}%</Text></View>
                                    </View>
                                    <Text style={[styles.pPInfo, { color: theme.textMuted }]}>{selectedPackage.total_lessons} aulas • {selectedPackage.vehicle_type === 'instructor' ? '🚗 Carro instrutor' : '🔑 Seu carro'}</Text>
                                </View>
                                <View style={styles.benefitsBox}>
                                    <View style={styles.benefitItem}><Ionicons name="checkmark-circle" size={18} color="#10b981" /><Text style={[styles.benefitTextP, { color: theme.text }]}>Uso ilimitado (sem validade)</Text></View>
                                    <View style={styles.benefitItem}><Ionicons name="checkmark-circle" size={18} color="#10b981" /><Text style={[styles.benefitTextP, { color: theme.text }]}>Flexibilidade total de agenda</Text></View>
                                </View>
                                <View style={[styles.packageTotalRow, { borderTopColor: theme.cardBorder }]}>
                                    <Text style={[styles.totalLabelP, { color: theme.textMuted }]}>Total a pagar</Text>
                                    <Text style={[styles.totalPriceP, { color: theme.primary }]}>{formatPrice(selectedPackage.total_price)}</Text>
                                </View>
                                <TouchableOpacity style={[styles.confirmPurchaseBtn, { backgroundColor: theme.primary }]} onPress={handlePurchasePackage} disabled={purchasingPackage}>
                                    {purchasingPackage ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmPurchaseBtnText}>Confirmar e Pagar</Text>}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Unavailable Booking Modal */}
            <ConfirmationModal
                visible={showUnavailableModal}
                onClose={() => setShowUnavailableModal(false)}
                title="Agendamento Indisponível"
                message={unavailableMessage}
                icon="time-outline"
                type="warning"
                confirmText="Entendi"
                onConfirm={() => setShowUnavailableModal(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { fontSize: 16 },

    // Header
    immersiveHeader: { width: '100%', height: 350, position: 'relative' },
    headerImage: { width: '100%', height: '100%' },
    headerImagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    photoInitialLarge: { fontSize: 72, fontWeight: '800', color: '#fff' },
    headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
    backButtonFixed: { position: 'absolute', top: 50, left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    headerInfo: { position: 'absolute', bottom: 30, left: 24, right: 24 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    instructorNameWhite: { fontSize: 32, fontWeight: '800', color: '#fff' },
    verifiedBadgeMini: { marginTop: 4 },
    locationRowWhite: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    locationTextWhite: { fontSize: 15, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },

    // Trust Bar
    trustBar: { flexDirection: 'row', paddingVertical: 18, borderBottomWidth: 1 },
    trustItem: { flex: 1, alignItems: 'center' },
    trustValue: { fontSize: 18, fontWeight: '700' },
    trustLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    trustLabel: { fontSize: 12, fontWeight: '500' },
    trustDivider: { width: 1, height: '60%', alignSelf: 'center' },

    // Content
    contentPadding: { paddingHorizontal: 20 },
    sectionHeaderless: { marginTop: 24 },
    bioTextLarge: { fontSize: 16, lineHeight: 24 },
    sectionMargin: { marginTop: 32 },
    sectionTitlePremium: { fontSize: 18, fontWeight: '700' },
    sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },

    // Vehicle Card
    vehiclePremiumCard: { padding: 20, borderRadius: 16, marginTop: 24, flexDirection: 'row', gap: 16, borderWidth: 1 },
    vehicleIconCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
    vehicleImage: { width: 80, height: 60, borderRadius: 8 },
    vehicleInfoPrimary: { flex: 1 },
    vehicleTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    vehicleModelText: { fontSize: 14, fontWeight: '500', marginBottom: 10 },
    vehicleTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    vTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    vTagText: { fontSize: 11, fontWeight: '600' },

    // Packages Carousel
    packagesCarousel: { marginHorizontal: -20, paddingLeft: 20, marginTop: 16 },
    packageCardPremium: { width: 160, padding: 16, borderRadius: 16, marginRight: 16, borderWidth: 2, position: 'relative' },
    packageDiscountBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    discountBadgeText: { fontSize: 11, fontWeight: '800', color: '#166534' },
    packageCardNameP: { fontSize: 15, fontWeight: '700', marginTop: 8 },
    packageCardLessonsP: { fontSize: 13, marginTop: 2 },
    packageCardPriceP: { fontSize: 18, fontWeight: '800', marginTop: 12 },
    perLessonRow: { marginTop: 4 },
    perLessonText: { fontSize: 11, fontWeight: '600' },
    popularBadge: { backgroundColor: '#10b981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    popularBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

    // Availability
    availabilityListAlt: { marginTop: 12 },
    availabilityRowAlt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    dayLabelAlt: { fontSize: 15, fontWeight: '600' },
    timeTagAlt: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
    timeLabelAlt: { fontSize: 13, fontWeight: '600' },
    seeFullSchedule: { marginTop: 12 },
    seeFullScheduleText: { fontSize: 14, fontWeight: '700' },

    // Reviews
    emptyStateBox: { padding: 20, borderRadius: 12, alignItems: 'center', marginTop: 8 },
    emptyStateText: { fontSize: 14, fontStyle: 'italic' },
    reviewCardAlt: { paddingVertical: 16, borderBottomWidth: 1 },
    reviewHeaderAlt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    starsMini: { flexDirection: 'row', gap: 2 },
    reviewDateAlt: { fontSize: 12 },
    reviewCommentAlt: { fontSize: 14, lineHeight: 20 },
    leaveReviewText: { fontSize: 14, fontWeight: '700' },

    // Bottom Action Bar
    bottomActionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 20, borderTopWidth: 1, gap: 16 },
    actionPriceInfo: { flex: 1 },
    priceTagSmall: { fontSize: 12, fontWeight: '600' },
    priceTagLarge: { fontSize: 24, fontWeight: '800' },
    primaryActionButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryActionButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
    actionButtonsRow: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    chatIconButton: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Modal Overlays
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContentAlt: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
    modalHeaderAlt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitleAlt: { fontSize: 22, fontWeight: '800' },
    ratingInputBox: { alignItems: 'center', marginBottom: 24 },
    ratingLabelAlt: { fontSize: 16, marginBottom: 12, fontWeight: '600' },
    starsInputAlt: { flexDirection: 'row', gap: 10 },
    commentInputAlt: { height: 120, borderRadius: 16, padding: 16, fontSize: 16, borderWidth: 1, marginBottom: 24 },
    modalSubmitBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    modalSubmitBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },

    // Package Purchase Modal
    packagePurchaseCard: { width: '92%', borderRadius: 24, padding: 24 },
    packagePreviewBox: { padding: 20, borderRadius: 16, marginBottom: 20 },
    packagePreviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
    pPName: { fontSize: 18, fontWeight: '700', flex: 1, marginRight: 8 },
    pPDiscount: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    pPDiscountText: { color: '#166534', fontSize: 12, fontWeight: '800' },
    pPInfo: { fontSize: 14, fontWeight: '500' },
    benefitsBox: { gap: 12, marginBottom: 24 },
    benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    benefitTextP: { fontSize: 14, fontWeight: '500' },
    packageTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTopWidth: 1 },
    totalLabelP: { fontSize: 14, fontWeight: '600' },
    totalPriceP: { fontSize: 24, fontWeight: '800' },
    confirmPurchaseBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
    confirmPurchaseBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },

    // Verification Badge & Warning Banner
    pendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(217, 119, 6, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 10,
        alignSelf: 'flex-start',
    },
    pendingBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fef3c7',
    },
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#fef3c7',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 12,
    },
    warningBannerText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#92400e',
        lineHeight: 18,
    },
});
