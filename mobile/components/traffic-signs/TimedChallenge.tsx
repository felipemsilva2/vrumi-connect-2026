import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Sign {
    id: string;
    name: string;
    code: string;
    category: string;
    description: string;
    image_url: string | null;
}

interface ChallengeOption {
    id: string;
    text: string;
    isCorrect: boolean;
}

interface ChallengeQuestion {
    sign: Sign;
    options: ChallengeOption[];
}

interface TimedChallengeProps {
    signs: Sign[];
    category: string;
    onClose: () => void;
}

const GAME_DURATION = 60;
const POINTS_PER_CORRECT = 100;
const WRONG_ANSWER_PENALTY = 5;
const TIME_BONUS_MULTIPLIER = 2;

export default function TimedChallenge({ signs, category, onClose }: TimedChallengeProps) {
    const { theme } = useTheme();
    const { user } = useAuth();

    const [gameState, setGameState] = useState<'menu' | 'playing' | 'finished'>('menu');
    const [currentQuestion, setCurrentQuestion] = useState<ChallengeQuestion | null>(null);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Timer effect
    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (gameState === 'playing' && timeRemaining > 0 && !isProcessing) {
            timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        finishChallenge();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [gameState, timeRemaining, isProcessing]);

    const generateRandomWrongAnswer = (signCategory: string): string => {
        const wrongAnswers: Record<string, string[]> = {
            'Regulamentação': [
                'Velocidade Mínima', 'Passagem Livre', 'Siga em Frente',
                'Proibido Parar', 'Ultrapassagem Permitida', 'Conversão Obrigatória'
            ],
            'Advertência': [
                'Pista Escorregadia', 'Curva Perigosa', 'Cruzamento à Direita',
                'Passagem de Nível', 'Trânsito de Pedestres', 'Animais na Pista'
            ],
            // Add other categories as needed
        };

        const categoryAnswers = wrongAnswers[signCategory] || wrongAnswers['Regulamentação'];
        return categoryAnswers[Math.floor(Math.random() * categoryAnswers.length)];
    };

    const generateQuestion = useCallback((availableSigns: Sign[]): ChallengeQuestion => {
        if (availableSigns.length === 0) throw new Error('No signs available');

        const correctSign = availableSigns[Math.floor(Math.random() * availableSigns.length)];

        const wrongSigns = availableSigns
            .filter(sign => sign.id !== correctSign.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        while (wrongSigns.length < 3) {
            wrongSigns.push({
                id: `dummy-${Math.random()}`,
                code: 'X',
                name: generateRandomWrongAnswer(correctSign.category),
                category: correctSign.category,
                image_url: null,
                description: ''
            });
        }

        const options: ChallengeOption[] = [
            { id: correctSign.id, text: correctSign.name, isCorrect: true },
            ...wrongSigns.map(sign => ({
                id: sign.id,
                text: sign.name,
                isCorrect: false
            }))
        ].sort(() => Math.random() - 0.5);

        return { sign: correctSign, options };
    }, []);

    const startChallenge = () => {
        setGameState('playing');
        setQuestionIndex(0);
        setScore(0);
        setCorrectAnswers(0);
        setTimeRemaining(GAME_DURATION);
        setSelectedOption(null);
        setFeedback(null);

        try {
            setCurrentQuestion(generateQuestion(signs));
        } catch (error) {
            Alert.alert("Erro", "Não há placas suficientes para jogar.");
            onClose();
        }
    };

    const handleAnswerSelect = (optionId: string) => {
        if (isProcessing || !currentQuestion) return;

        setIsProcessing(true);
        setSelectedOption(optionId);

        const option = currentQuestion.options.find(opt => opt.id === optionId);
        const isCorrect = option?.isCorrect || false;

        if (isCorrect) {
            setCorrectAnswers(prev => prev + 1);
            setFeedback('correct');
            const timeBonus = Math.floor(timeRemaining * TIME_BONUS_MULTIPLIER);
            setScore(prev => prev + POINTS_PER_CORRECT + timeBonus);
        } else {
            setFeedback('incorrect');
            setTimeRemaining(prev => Math.max(0, prev - WRONG_ANSWER_PENALTY));
        }

        setTimeout(() => {
            nextQuestion();
        }, 1500);
    };

    const nextQuestion = () => {
        setSelectedOption(null);
        setFeedback(null);
        setIsProcessing(false);

        if (timeRemaining > 0) {
            setQuestionIndex(prev => prev + 1);
            setCurrentQuestion(generateQuestion(signs));
        } else {
            finishChallenge();
        }
    };

    const finishChallenge = async () => {
        setGameState('finished');

        if (user) {
            try {
                await supabase.rpc('save_challenge_result', {
                    p_user_id: user.id,
                    p_category: category,
                    p_total_questions: questionIndex + 1,
                    p_correct_answers: correctAnswers,
                    p_time_seconds: GAME_DURATION - timeRemaining
                });
            } catch (error) {
                console.error('Erro ao salvar resultado:', error);
            }
        }
    };

    if (gameState === 'menu') {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.menuContent}>
                    <TouchableOpacity onPress={onClose} style={[styles.menuCloseButton, { backgroundColor: theme.card }]}>
                        <Ionicons name="close" size={24} color={theme.text} />
                    </TouchableOpacity>

                    <View style={styles.iconContainer}>
                        <Ionicons name="flash" size={48} color="#fff" />
                    </View>

                    <Text style={[styles.title, { color: theme.text }]}>Desafio Cronometrado</Text>
                    <Text style={[styles.description, { color: theme.textSecondary }]}>
                        Você tem {GAME_DURATION} segundos para acertar o maior número de placas possível!
                    </Text>

                    <View style={styles.statsRow}>
                        <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                            <Ionicons name="time" size={24} color={theme.primary} />
                            <Text style={[styles.statValue, { color: theme.text }]}>{GAME_DURATION}s</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Tempo</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                            <Ionicons name="star" size={24} color="#f59e0b" />
                            <Text style={[styles.statValue, { color: theme.text }]}>{POINTS_PER_CORRECT}</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Pontos/Acerto</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.playButton, { backgroundColor: theme.primary }]}
                        onPress={startChallenge}
                    >
                        <Text style={styles.playButtonText}>Começar Desafio</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (gameState === 'finished') {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.menuContent}>
                    <View style={[styles.iconContainer, { backgroundColor: '#22c55e' }]}>
                        <Ionicons name="trophy" size={48} color="#fff" />
                    </View>

                    <Text style={[styles.title, { color: theme.text }]}>Desafio Concluído!</Text>

                    <View style={[styles.scoreCard, { backgroundColor: theme.card }]}>
                        <Text style={[styles.scoreValue, { color: theme.primary }]}>{score}</Text>
                        <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>Pontos Totais</Text>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={[styles.statBox, { backgroundColor: theme.card }]}>
                            <Text style={[styles.statValue, { color: theme.text }]}>{correctAnswers}</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Acertos</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: theme.card }]}>
                            <Text style={[styles.statValue, { color: theme.text }]}>
                                {questionIndex > 0 ? Math.round((correctAnswers / (questionIndex + 1)) * 100) : 0}%
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Precisão</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.playButton, { backgroundColor: theme.primary }]}
                        onPress={startChallenge}
                    >
                        <Text style={styles.playButtonText}>Jogar Novamente</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.secondaryButton, { borderColor: theme.cardBorder }]}
                        onPress={onClose}
                    >
                        <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Voltar para Biblioteca</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={styles.gameHeader}>
                <TouchableOpacity onPress={onClose} style={[styles.smallButton, { backgroundColor: theme.card }]}>
                    <Ionicons name="close" size={20} color={theme.text} />
                </TouchableOpacity>

                <View style={[styles.timerBadge, { backgroundColor: timeRemaining <= 10 ? '#fee2e2' : theme.card }]}>
                    <Ionicons name="time" size={18} color={timeRemaining <= 10 ? '#ef4444' : theme.primary} />
                    <Text style={[
                        styles.timerText,
                        { color: timeRemaining <= 10 ? '#ef4444' : theme.text }
                    ]}>
                        {timeRemaining}s
                    </Text>
                </View>

                <View style={[styles.scoreBadge, { backgroundColor: theme.card }]}>
                    <Ionicons name="flash" size={18} color="#f59e0b" />
                    <Text style={[styles.scoreText, { color: theme.text }]}>{score}</Text>
                </View>
            </View>

            {/* Question */}
            {currentQuestion && (
                <View style={styles.gameContent}>
                    <Text style={[styles.questionText, { color: theme.text }]}>Qual é esta placa?</Text>

                    <View style={[styles.imageContainer, { backgroundColor: theme.card }]}>
                        {currentQuestion.sign.image_url ? (
                            <Image
                                source={{ uri: currentQuestion.sign.image_url }}
                                style={styles.gameImage}
                                resizeMode="contain"
                            />
                        ) : (
                            <View style={styles.placeholder}>
                                <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
                                    {currentQuestion.sign.code}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.optionsGrid}>
                        {currentQuestion.options.map((option) => {
                            let optionStyle = {};
                            let textStyle = {};

                            if (selectedOption !== null) {
                                if (option.id === selectedOption) {
                                    if (feedback === 'correct') {
                                        optionStyle = { backgroundColor: '#dcfce7', borderColor: '#22c55e' };
                                        textStyle = { color: '#166534' };
                                    } else {
                                        optionStyle = { backgroundColor: '#fee2e2', borderColor: '#ef4444' };
                                        textStyle = { color: '#991b1b' };
                                    }
                                } else if (option.isCorrect) {
                                    optionStyle = { backgroundColor: '#dcfce7', borderColor: '#22c55e' };
                                    textStyle = { color: '#166534' };
                                } else {
                                    optionStyle = { opacity: 0.5 };
                                }
                            }

                            return (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.optionButton,
                                        { backgroundColor: theme.card, borderColor: theme.cardBorder },
                                        optionStyle
                                    ]}
                                    onPress={() => handleAnswerSelect(option.id)}
                                    disabled={isProcessing}
                                >
                                    <Text style={[styles.optionText, { color: theme.text }, textStyle]}>
                                        {option.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        paddingTop: 40,
    },
    menuContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    menuCloseButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f59e0b',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: "#f59e0b",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
        width: '100%',
    },
    statBox: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginVertical: 4,
    },
    statLabel: {
        fontSize: 12,
    },
    playButton: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    playButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        borderWidth: 1,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    scoreCard: {
        padding: 24,
        borderRadius: 24,
        alignItems: 'center',
        width: '100%',
        marginBottom: 24,
    },
    scoreValue: {
        fontSize: 48,
        fontWeight: 'bold',
    },
    scoreLabel: {
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    gameHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    smallButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    timerText: {
        fontSize: 16,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    scoreBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    scoreText: {
        fontSize: 16,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    gameContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    questionText: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 24,
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 1.5,
        borderRadius: 24,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    gameImage: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    optionsGrid: {
        gap: 12,
        paddingBottom: 40,
    },
    optionButton: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
});
