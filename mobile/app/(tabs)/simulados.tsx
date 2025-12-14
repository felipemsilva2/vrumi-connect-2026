import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Alert,
    BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useQuizLock } from '../../contexts/QuizLockContext';
import { useGamification } from '../../contexts/GamificationContext';
import { supabase } from '../../src/lib/supabase';


interface QuizQuestion {
    id: string;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: string;
    explanation?: string | null;
}

interface Question {
    id: string;
    question: string;
    options: string[];
    correct_answer: number;
    explanation?: string | null;
}

type QuizState = 'start' | 'quiz' | 'review' | 'result';

export default function SimuladosScreen() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const { setQuizActive, registerResetCallback } = useQuizLock();
    const { recordActivity } = useGamification();
    const navigation = useNavigation();
    const [state, setState] = useState<QuizState>('start');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(false);
    const [reviewIndex, setReviewIndex] = useState(0);
    const [selectedQuizType, setSelectedQuizType] = useState<'standard' | 'extended' | null>(null);


    const isQuizActive = state === 'quiz';

    // Register reset callback so context can reset our state when user exits via tab bar
    useEffect(() => {
        registerResetCallback(() => {
            setState('start');
            setQuestions([]);
            setCurrentIndex(0);
            setUserAnswers({});
        });
    }, [registerResetCallback]);

    // Sync quiz state with context for tab bar blocking
    useEffect(() => {
        setQuizActive(isQuizActive);
    }, [isQuizActive, setQuizActive]);

    // Prevent back navigation during quiz (Android back button)
    useEffect(() => {
        if (!isQuizActive) return;

        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            Alert.alert(
                'Sair do Simulado?',
                'Você tem um simulado em andamento. Se sair agora, todo seu progresso será perdido.',
                [
                    { text: 'Continuar Prova', style: 'cancel' },
                    {
                        text: 'Sair e Perder Progresso',
                        style: 'destructive',
                        onPress: () => {
                            setState('start');
                            setQuestions([]);
                            setCurrentIndex(0);
                            setUserAnswers({});
                        }
                    }
                ]
            );
            return true; // Prevent default back behavior
        });

        return () => backHandler.remove();
    }, [isQuizActive]);

    const fetchQuestions = useCallback(async (questionCount: number) => {
        setLoading(true);
        try {
            // Fetch ALL questions for randomization
            const { data, error } = await supabase
                .from('quiz_questions')
                .select('id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation');

            if (error) throw error;

            const transformed: Question[] = (data || []).map((q: QuizQuestion) => ({
                id: q.id,
                question: q.question_text,
                options: [q.option_a, q.option_b, q.option_c, q.option_d],
                correct_answer: ['A', 'B', 'C', 'D'].indexOf(q.correct_option.toUpperCase()),
                explanation: q.explanation,
            }));

            // Shuffle and take requested number of questions
            const shuffled = transformed.sort(() => Math.random() - 0.5).slice(0, questionCount);
            setQuestions(shuffled);
        } catch (error) {
            console.error('Error fetching questions:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const startQuiz = async (type: 'standard' | 'extended') => {
        const questionCount = type === 'standard' ? 30 : 40;
        setSelectedQuizType(type);
        await fetchQuestions(questionCount);
        setCurrentIndex(0);
        setUserAnswers({});
        setState('quiz'); // useEffect will sync to context
    };

    const handleSelectAnswer = (answerIndex: number) => {
        setUserAnswers(prev => ({
            ...prev,
            [currentIndex]: answerIndex
        }));
    };

    const goToQuestion = (index: number) => {
        setCurrentIndex(index);
    };

    const nextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const prevQuestion = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const finishQuiz = async () => {
        const answeredCount = Object.keys(userAnswers).length;
        const unansweredCount = questions.length - answeredCount;

        if (unansweredCount > 0) {
            Alert.alert(
                'Questões não respondidas',
                `Você ainda tem ${unansweredCount} questão(ões) sem responder. Deseja finalizar mesmo assim?`,
                [
                    { text: 'Continuar prova', style: 'cancel' },
                    { text: 'Finalizar', style: 'destructive', onPress: submitQuiz }
                ]
            );
        } else {
            submitQuiz();
        }
    };

    const submitQuiz = async () => {
        // Calculate score
        let correctCount = 0;
        questions.forEach((q, index) => {
            if (userAnswers[index] === q.correct_answer) {
                correctCount++;
            }
        });

        // Save to Supabase
        if (user?.id) {
            try {
                const scorePercentage = Math.round((correctCount / questions.length) * 100);

                await supabase.from('user_quiz_attempts').insert({
                    user_id: user.id,
                    quiz_type: 'practice',
                    total_questions: questions.length,
                    correct_answers: correctCount,
                    score_percentage: scorePercentage,
                    created_at: new Date().toISOString(),
                });

                await supabase.from('user_activities').insert({
                    user_id: user.id,
                    activity_type: 'quiz_completed',
                    metadata: {
                        quiz_type: 'practice',
                        total_questions: questions.length,
                        correct_answers: correctCount,
                        score_percentage: scorePercentage,
                    },
                    created_at: new Date().toISOString(),
                });

                // Record XP for gamification
                // XP = 10 per correct answer + bonus 50 if passed (70%+)
                const xpFromAnswers = correctCount * 10;
                const passBonus = scorePercentage >= 70 ? 50 : 0;
                const totalXP = xpFromAnswers + passBonus;
                await recordActivity('quiz_correct', totalXP, `Simulado concluído: ${scorePercentage}%`);
            } catch (error) {
                console.error('Error saving quiz result:', error);
            }
        }

        setReviewIndex(0);
        setState('review'); // useEffect will sync to context
    };

    const finishReview = () => {
        setState('result');
    };


    const restartQuiz = () => {
        setState('start'); // useEffect will sync to context
        setQuestions([]);
        setCurrentIndex(0);
        setUserAnswers({});
    };

    const currentQuestion = questions[currentIndex];
    const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

    // Calculate score
    const correctCount = questions.reduce((count: number, q: Question, idx: number) =>
        userAnswers[idx] === q.correct_answer ? count + 1 : count, 0);
    const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    // Start Screen
    if (state === 'start') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
                <View style={styles.headerStart}>
                    <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.card }]} onPress={() => router.replace('/(tabs)')}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={styles.startScrollContent} showsVerticalScrollIndicator={false}>
                    <View style={[styles.startIconBg, { backgroundColor: theme.primaryLight }]}>
                        <Ionicons name="clipboard" size={56} color={theme.primary} />
                    </View>
                    <Text style={[styles.startTitle, { color: theme.text }]}>Simulado DETRAN</Text>
                    <Text style={[styles.startSubtitle, { color: theme.textSecondary }]}>
                        Escolha o tipo de prova para praticar
                    </Text>

                    {/* Standard Quiz - 30 questions */}
                    <TouchableOpacity
                        style={[styles.quizTypeCard, { backgroundColor: theme.card, borderColor: theme.primary }]}
                        onPress={() => startQuiz('standard')}
                        disabled={loading}
                    >
                        <View style={[styles.quizTypeIcon, { backgroundColor: theme.primaryLight }]}>
                            <Ionicons name="document-text" size={28} color={theme.primary} />
                        </View>
                        <View style={styles.quizTypeContent}>
                            <View style={styles.quizTypeHeader}>
                                <Text style={[styles.quizTypeTitle, { color: theme.text }]}>Prova Padrão</Text>
                                <View style={[styles.quizTypeBadge, { backgroundColor: theme.primaryLight }]}>
                                    <Text style={[styles.quizTypeBadgeText, { color: theme.primary }]}>Mais estados</Text>
                                </View>
                            </View>
                            <Text style={[styles.quizTypeDescription, { color: theme.textSecondary }]}>
                                30 questões • 21 para aprovar (70%)
                            </Text>
                            <Text style={[styles.quizTypeStates, { color: theme.textMuted }]}>
                                SP, RJ, MG, RS e maioria dos estados
                            </Text>
                        </View>
                        {loading ? (
                            <ActivityIndicator color={theme.primary} />
                        ) : (
                            <Ionicons name="play-circle" size={32} color={theme.primary} />
                        )}
                    </TouchableOpacity>

                    {/* Extended Quiz - 40 questions */}
                    <TouchableOpacity
                        style={[styles.quizTypeCard, { backgroundColor: theme.card, borderColor: '#f59e0b' }]}
                        onPress={() => startQuiz('extended')}
                        disabled={loading}
                    >
                        <View style={[styles.quizTypeIcon, { backgroundColor: isDark ? '#451a03' : '#fef3c7' }]}>
                            <Ionicons name="documents" size={28} color="#f59e0b" />
                        </View>
                        <View style={styles.quizTypeContent}>
                            <View style={styles.quizTypeHeader}>
                                <Text style={[styles.quizTypeTitle, { color: theme.text }]}>Prova Estendida</Text>
                                <View style={[styles.quizTypeBadge, { backgroundColor: isDark ? '#451a03' : '#fef3c7' }]}>
                                    <Text style={[styles.quizTypeBadgeText, { color: '#f59e0b' }]}>BA / DF</Text>
                                </View>
                            </View>
                            <Text style={[styles.quizTypeDescription, { color: theme.textSecondary }]}>
                                40 questões • 28 para aprovar (70%)
                            </Text>
                            <Text style={[styles.quizTypeStates, { color: theme.textMuted }]}>
                                Bahia e Distrito Federal
                            </Text>
                        </View>
                        {loading ? (
                            <ActivityIndicator color="#f59e0b" />
                        ) : (
                            <Ionicons name="play-circle" size={32} color="#f59e0b" />
                        )}
                    </TouchableOpacity>

                    {/* Info box */}
                    <View style={[styles.infoBox, { backgroundColor: isDark ? '#0c4a6e' : '#e0f2fe' }]}>
                        <Ionicons name="information-circle" size={20} color={isDark ? '#7dd3fc' : '#0284c7'} />
                        <Text style={[styles.infoText, { color: isDark ? '#7dd3fc' : '#0369a1' }]}>
                            Ambas as provas seguem o formato oficial do DETRAN. Responda todas as questões e veja o gabarito no final.
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Review Screen (after finishing - show correct/incorrect for each question)
    if (state === 'review') {
        const reviewQuestion = questions[reviewIndex];
        const userAnswer = userAnswers[reviewIndex];
        const isCorrect = userAnswer === reviewQuestion?.correct_answer;

        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
                <View style={styles.header}>
                    <Text style={[styles.questionNumber, { color: theme.textSecondary }]}>
                        Revisão {reviewIndex + 1} de {questions.length}
                    </Text>
                    <View style={[styles.progressBadge, { backgroundColor: isCorrect ? theme.primaryLight : (isDark ? '#450a0a' : '#fef2f2') }]}>
                        <Ionicons
                            name={isCorrect ? "checkmark-circle" : "close-circle"}
                            size={16}
                            color={isCorrect ? theme.primary : "#ef4444"}
                        />
                        <Text style={[styles.progressText, { color: isCorrect ? theme.primary : "#ef4444" }]}>
                            {isCorrect ? 'Correta' : 'Incorreta'}
                        </Text>
                    </View>
                </View>

                <View style={[styles.progressBarContainer, { backgroundColor: theme.cardBorder }]}>
                    <View style={[styles.progressBar, { width: `${((reviewIndex + 1) / questions.length) * 100}%`, backgroundColor: theme.primary }]} />
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={[styles.questionCard, { backgroundColor: theme.card }]}>
                        <Text style={[styles.questionText, { color: theme.text }]}>{reviewQuestion?.question}</Text>
                    </View>

                    <View style={styles.optionsContainer}>
                        {reviewQuestion?.options.map((option, index) => {
                            const isThisCorrect = index === reviewQuestion.correct_answer;
                            const wasSelected = userAnswer === index;

                            let bgColor = theme.card;
                            let borderColor = 'transparent';

                            if (isThisCorrect) {
                                bgColor = isDark ? '#064e3b' : '#ecfdf5';
                                borderColor = theme.primary;
                            } else if (wasSelected && !isThisCorrect) {
                                bgColor = isDark ? '#450a0a' : '#fef2f2';
                                borderColor = '#ef4444';
                            }

                            return (
                                <View key={index} style={[styles.optionCard, { backgroundColor: bgColor, borderColor }]}>
                                    <View style={[styles.optionLetter, { backgroundColor: theme.background }]}>
                                        <Text style={[styles.optionLetterText, { color: theme.text }]}>
                                            {String.fromCharCode(65 + index)}
                                        </Text>
                                    </View>
                                    <Text style={[styles.optionText, { color: theme.text }]}>{option}</Text>
                                    {isThisCorrect && <Ionicons name="checkmark-circle" size={22} color={theme.primary} />}
                                    {wasSelected && !isThisCorrect && <Ionicons name="close-circle" size={22} color="#ef4444" />}
                                </View>
                            );
                        })}
                    </View>

                    {reviewQuestion?.explanation && (
                        <View style={[styles.explanationCard, { backgroundColor: isDark ? '#451a03' : '#fffbeb' }]}>
                            <View style={styles.explanationHeader}>
                                <Ionicons name="bulb" size={18} color="#f59e0b" />
                                <Text style={styles.explanationTitle}>Explicação</Text>
                            </View>
                            <Text style={[styles.explanationText, { color: isDark ? '#fcd34d' : '#78350f' }]}>{reviewQuestion.explanation}</Text>
                        </View>
                    )}
                </ScrollView>

                <View style={styles.reviewNavigation}>
                    <TouchableOpacity
                        style={[styles.navButton, { backgroundColor: theme.card, opacity: reviewIndex === 0 ? 0.5 : 1 }]}
                        onPress={() => setReviewIndex(reviewIndex - 1)}
                        disabled={reviewIndex === 0}
                    >
                        <Ionicons name="arrow-back" size={20} color={theme.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.finishReviewButton}
                        onPress={reviewIndex === questions.length - 1 ? finishReview : () => setReviewIndex(reviewIndex + 1)}
                    >
                        <Text style={styles.finishReviewText}>
                            {reviewIndex === questions.length - 1 ? 'Ver Resultado Final' : 'Próxima'}
                        </Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Result Screen
    if (state === 'result') {
        const isGood = percentage >= 70;

        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
                <View style={styles.resultContainer}>
                    <View style={[styles.resultIconBg, { backgroundColor: isGood ? theme.primaryLight : (isDark ? '#450a0a' : '#fef2f2') }]}>
                        <Ionicons
                            name={isGood ? "trophy" : "refresh"}
                            size={56}
                            color={isGood ? theme.primary : "#ef4444"}
                        />
                    </View>

                    <Text style={[styles.resultTitle, { color: theme.text }]}>
                        {isGood ? 'Parabéns!' : 'Continue praticando'}
                    </Text>

                    <Text style={[styles.resultScore, { color: isGood ? theme.primary : '#ef4444' }]}>
                        {percentage}%
                    </Text>
                    <Text style={[styles.resultDetail, { color: theme.textSecondary }]}>
                        {correctCount} de {questions.length} questões corretas
                    </Text>

                    <Text style={[styles.resultMessage, { color: theme.textSecondary }]}>
                        {percentage >= 70
                            ? 'Você está pronto para a prova!'
                            : 'Revise os tópicos e tente novamente.'}
                    </Text>

                    <TouchableOpacity style={styles.restartButton} onPress={restartQuiz}>
                        <Ionicons name="refresh" size={18} color="#fff" />
                        <Text style={styles.restartButtonText}>Novo Simulado</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Quiz Screen (Exam Mode - no immediate feedback)
    const answeredCount = Object.keys(userAnswers).length;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.questionNumber, { color: theme.textSecondary }]}>
                    Questão {currentIndex + 1} de {questions.length}
                </Text>
                <View style={[styles.answeredBadge, { backgroundColor: theme.primaryLight }]}>
                    <Text style={[styles.progressText, { color: theme.primary }]}>
                        {answeredCount}/{questions.length} respondidas
                    </Text>
                </View>
            </View>

            {/* Progress Bar */}
            <View style={[styles.progressBarContainer, { backgroundColor: theme.cardBorder }]}>
                <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: theme.primary }]} />
            </View>

            {/* Question Navigator */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.questionNav} contentContainerStyle={styles.questionNavContent}>
                {questions.map((_, idx) => {
                    const isAnswered = userAnswers[idx] !== undefined;
                    const isCurrent = idx === currentIndex;

                    return (
                        <TouchableOpacity
                            key={idx}
                            style={[
                                styles.questionDot,
                                {
                                    backgroundColor: isCurrent ? theme.primary : (isAnswered ? theme.primaryLight : theme.card),
                                    borderColor: isCurrent ? theme.primary : 'transparent'
                                }
                            ]}
                            onPress={() => goToQuestion(idx)}
                        >
                            <Text style={[
                                styles.questionDotText,
                                { color: isCurrent ? '#fff' : (isAnswered ? theme.primary : theme.textSecondary) }
                            ]}>
                                {idx + 1}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Question Card */}
                <View style={[styles.questionCard, { backgroundColor: theme.card }]}>
                    <Text style={[styles.questionText, { color: theme.text }]}>{currentQuestion?.question}</Text>
                </View>

                {/* Options - No immediate feedback */}
                <View style={styles.optionsContainer}>
                    {currentQuestion?.options.map((option, index) => {
                        const isSelected = userAnswers[currentIndex] === index;

                        return (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.optionCard,
                                    {
                                        backgroundColor: isSelected ? (isDark ? '#064e3b' : '#f0fdf4') : theme.card,
                                        borderColor: isSelected ? theme.primary : 'transparent'
                                    }
                                ]}
                                onPress={() => handleSelectAnswer(index)}
                            >
                                <View style={[
                                    styles.optionLetter,
                                    { backgroundColor: isSelected ? theme.primaryLight : theme.background }
                                ]}>
                                    <Text style={[
                                        styles.optionLetterText,
                                        { color: isSelected ? theme.primary : theme.text }
                                    ]}>
                                        {String.fromCharCode(65 + index)}
                                    </Text>
                                </View>
                                <Text style={[styles.optionText, { color: theme.text }]}>{option}</Text>
                                {isSelected && <Ionicons name="checkmark-circle" size={22} color={theme.primary} />}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Navigation and Finish */}
            <View style={styles.quizNavigation}>
                <View style={styles.navRow}>
                    <TouchableOpacity
                        style={[styles.navButton, { backgroundColor: theme.card, opacity: currentIndex === 0 ? 0.5 : 1 }]}
                        onPress={prevQuestion}
                        disabled={currentIndex === 0}
                    >
                        <Ionicons name="arrow-back" size={20} color={theme.text} />
                    </TouchableOpacity>

                    {currentIndex < questions.length - 1 ? (
                        <TouchableOpacity style={styles.nextNavButton} onPress={nextQuestion}>
                            <Text style={styles.nextNavText}>Próxima</Text>
                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.finishButton} onPress={finishQuiz}>
                            <Ionicons name="checkmark-done" size={20} color="#fff" />
                            <Text style={styles.finishButtonText}>Finalizar Prova</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerStart: {
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    startContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    startIconBg: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    startTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    startSubtitle: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 48,
        lineHeight: 24,
    },
    startButton: {
        flexDirection: 'row',
        backgroundColor: '#10b981',
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 32,
        alignItems: 'center',
        gap: 10,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    startButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    startScrollContent: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
    },
    quizTypeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        borderWidth: 2,
        width: '100%',
        gap: 12,
    },
    quizTypeIcon: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quizTypeContent: {
        flex: 1,
    },
    quizTypeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    quizTypeTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    quizTypeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    quizTypeBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    quizTypeDescription: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 2,
    },
    quizTypeStates: {
        fontSize: 12,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderRadius: 12,
        padding: 14,
        marginTop: 24,
        gap: 10,
        width: '100%',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    resultContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    resultIconBg: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    resultTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    resultScore: {
        fontSize: 56,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    resultDetail: {
        fontSize: 15,
        marginBottom: 16,
    },
    resultMessage: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 48,
    },
    restartButton: {
        flexDirection: 'row',
        backgroundColor: '#10b981',
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 32,
        alignItems: 'center',
        gap: 10,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    restartButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 12,
    },
    questionNumber: {
        fontSize: 15,
        fontWeight: '500',
    },
    progressBadge: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignItems: 'center',
        gap: 6,
    },
    answeredBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    progressText: {
        fontSize: 13,
        fontWeight: '600',
    },
    progressBarContainer: {
        height: 4,
        marginHorizontal: 24,
        borderRadius: 2,
    },
    progressBar: {
        height: '100%',
        borderRadius: 2,
    },
    questionNav: {
        maxHeight: 50,
        marginTop: 12,
    },
    questionNavContent: {
        paddingHorizontal: 24,
        gap: 8,
    },
    questionDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    questionDotText: {
        fontSize: 13,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 16,
    },
    questionCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    questionText: {
        fontSize: 17,
        fontWeight: '600',
        lineHeight: 26,
    },
    optionsContainer: {
        gap: 12,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
    },
    optionLetter: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    optionLetterText: {
        fontSize: 14,
        fontWeight: '600',
    },
    optionText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
    },
    explanationCard: {
        borderRadius: 16,
        padding: 20,
        marginTop: 20,
    },
    explanationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    explanationTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#92400e',
    },
    explanationText: {
        fontSize: 14,
        lineHeight: 22,
    },
    quizNavigation: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        paddingTop: 12,
    },
    navRow: {
        flexDirection: 'row',
        gap: 12,
    },
    navButton: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextNavButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#10b981',
        borderRadius: 14,
        padding: 14,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    nextNavText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    finishButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#3b82f6',
        borderRadius: 14,
        padding: 14,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    finishButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    reviewNavigation: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingBottom: 24,
        paddingTop: 12,
        gap: 12,
    },
    finishReviewButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#10b981',
        borderRadius: 14,
        padding: 14,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    finishReviewText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
});
