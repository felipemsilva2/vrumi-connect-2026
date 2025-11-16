import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Clock, Play, RotateCcw, Target, Zap, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TrafficSign {
  id: string;
  code: string;
  name: string;
  category: string;
  image_url: string;
  description: string;
}

interface ChallengeOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface ChallengeQuestion {
  sign: TrafficSign;
  options: ChallengeOption[];
}

interface ChallengeResult {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  timeRemaining: number;
  isPersonalBest: boolean;
  rankingPosition: number;
}

interface TimedChallengeProps {
  signs: TrafficSign[];
  category: string;
  onClose?: () => void;
}

const GAME_DURATION = 60; // 60 seconds
const POINTS_PER_CORRECT = 10;
const TIME_BONUS_MULTIPLIER = 0.5; // Extra points based on time remaining
const WRONG_ANSWER_PENALTY = 3; // Seconds penalty for wrong answer

export default function TimedChallenge({ signs, category, onClose }: TimedChallengeProps) {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'finished'>('menu');
  const [currentQuestion, setCurrentQuestion] = useState<ChallengeQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [challengeResult, setChallengeResult] = useState<ChallengeResult | null>(null);
  const [flashEffect, setFlashEffect] = useState<'green' | 'red' | null>(null);
  
  const { toast } = useToast();

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (gameState === 'playing' && timeRemaining > 0 && !isProcessing) {
      timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && gameState === 'playing') {
      finishChallenge();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [gameState, timeRemaining, isProcessing]);

  // Generate question
  const generateQuestion = useCallback((availableSigns: TrafficSign[]): ChallengeQuestion => {
    if (availableSigns.length === 0) {
      throw new Error('No signs available for question generation');
    }

    // Select random sign as the correct answer
    const correctSign = availableSigns[Math.floor(Math.random() * availableSigns.length)];
    
    // Get other signs for wrong answers
    const wrongSigns = availableSigns
      .filter(sign => sign.id !== correctSign.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    // If we don't have enough wrong signs, create dummy options
    while (wrongSigns.length < 3) {
      wrongSigns.push({
        id: `dummy-${wrongSigns.length}`,
        code: `X-${wrongSigns.length + 1}`,
        name: generateRandomWrongAnswer(correctSign.category),
        category: correctSign.category,
        image_url: '',
        description: ''
      } as TrafficSign);
    }

    // Create options
    const options: ChallengeOption[] = [
      { id: correctSign.id, text: correctSign.name, isCorrect: true },
      ...wrongSigns.map(sign => ({
        id: sign.id,
        text: sign.name,
        isCorrect: false
      }))
    ].sort(() => Math.random() - 0.5); // Shuffle options

    return {
      sign: correctSign,
      options
    };
  }, []);

  // Generate random wrong answers
  const generateRandomWrongAnswer = (category: string): string => {
    const wrongAnswers = {
      'Regulamentação': [
        'Velocidade Mínima', 'Passagem Livre', 'Siga em Frente', 
        'Proibido Parar', 'Ultrapassagem Permitida', 'Conversão Obrigatória'
      ],
      'Advertência': [
        'Pista Escorregadia', 'Curva Perigosa', 'Cruzamento à Direita',
        'Passagem de Nível', 'Trânsito de Pedestres', 'Animais na Pista'
      ],
      'Serviços Auxiliares': [
        'Posto Policial', 'Restaurante', 'Hotel',
        'Hospital', 'Telefone', 'Oficina Mecânica'
      ],
      'Indicação': [
        'Direção Obrigatória', 'Sentido Único', 'Velocidade Máxima',
        'Distância', 'Fim de Restrição', 'Via de Pedestres'
      ],
      'Obras': [
        'Trabalhadores', 'Desvio à Direita', 'Desvio à Esquerda',
        'Pista Estreita', 'Pavimentação', 'Obras à Frente'
      ]
    };

    const categoryAnswers = wrongAnswers[category as keyof typeof wrongAnswers] || wrongAnswers['Regulamentação'];
    return categoryAnswers[Math.floor(Math.random() * categoryAnswers.length)];
  };

  // Start challenge
  const startChallenge = () => {
    setGameState('playing');
    setQuestionIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setTimeRemaining(GAME_DURATION);
    setSelectedOption(null);
    setFeedback(null);
    setChallengeResult(null);
    
    // Generate first question
    try {
      const question = generateQuestion(signs);
      setCurrentQuestion(question);
    } catch (error) {
      console.error('Error generating first question:', error);
      toast({
        title: "Erro",
        description: "Não há placas suficientes para iniciar o desafio",
        variant: "destructive",
      });
      setGameState('menu');
    }
  };

  // Handle answer selection
  const handleAnswerSelect = async (optionId: string) => {
    if (isProcessing || !currentQuestion) return;
    
    setIsProcessing(true);
    setSelectedOption(optionId);
    
    const selectedOption = currentQuestion.options.find(opt => opt.id === optionId);
    const isCorrect = selectedOption?.isCorrect || false;
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setFeedback('correct');
      setFlashEffect('green');
      
      // Calculate points with time bonus
      const timeBonus = Math.floor(timeRemaining * TIME_BONUS_MULTIPLIER);
      const questionPoints = POINTS_PER_CORRECT + timeBonus;
      setScore(prev => prev + questionPoints);
      
      toast({
        title: "Correto!",
        description: `+${questionPoints} pontos`,
      });
    } else {
      setFeedback('incorrect');
      setFlashEffect('red');
      
      // Time penalty for wrong answer
      setTimeRemaining(prev => Math.max(0, prev - WRONG_ANSWER_PENALTY));
      
      toast({
        title: "Incorreto!",
        description: `-${WRONG_ANSWER_PENALTY} segundos`,
        variant: "destructive",
      });
    }

    // Clear flash effect
    setTimeout(() => setFlashEffect(null), 300);

    // Move to next question after delay
    setTimeout(() => {
      nextQuestion();
    }, 1500);
  };

  // Move to next question
  const nextQuestion = () => {
    setSelectedOption(null);
    setFeedback(null);
    setIsProcessing(false);
    
    if (questionIndex < signs.length - 1) {
      setQuestionIndex(prev => prev + 1);
      try {
        const question = generateQuestion(signs);
        setCurrentQuestion(question);
      } catch (error) {
        console.error('Error generating next question:', error);
        finishChallenge();
      }
    } else {
      // No more questions, finish challenge
      finishChallenge();
    }
  };

  // Finish challenge and save results
  const finishChallenge = async () => {
    setGameState('finished');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const accuracy = questionIndex > 0 ? (correctAnswers / questionIndex) * 100 : 0;
        
        // Save challenge result
        const { data: resultData, error } = await supabase
          .rpc('save_challenge_result', {
            p_user_id: user.id,
            p_category: category,
            p_score: score,
            p_correct_answers: correctAnswers,
            p_total_questions: questionIndex,
            p_time_remaining: timeRemaining
          });

        if (error) {
          console.error('Error saving challenge result:', error);
        } else {
          setChallengeResult({
            score,
            correctAnswers,
            totalQuestions: questionIndex,
            accuracy,
            timeRemaining,
            isPersonalBest: resultData?.is_personal_best || false,
            rankingPosition: resultData?.ranking_position || 0
          });
        }
      }
    } catch (error) {
      console.error('Error finishing challenge:', error);
    }
  };

  // Get option button styling
  const getOptionButtonClass = (optionId: string) => {
    let baseClass = "w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ";
    
    if (selectedOption === null) {
      baseClass += "border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20";
    } else if (optionId === selectedOption) {
      if (feedback === 'correct') {
        baseClass += "border-green-500 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200";
      } else {
        baseClass += "border-red-500 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200";
      }
    } else {
      const option = currentQuestion?.options.find(opt => opt.id === optionId);
      if (option?.isCorrect && feedback === 'incorrect') {
        baseClass += "border-green-500 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200";
      } else {
        baseClass += "border-gray-200 dark:border-gray-700 opacity-50";
      }
    }
    
    return baseClass;
  };

  if (gameState === 'menu') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Desafio Cronometrado
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Teste seus conhecimentos contra o tempo! Você tem {GAME_DURATION} segundos para acertar o máximo de placas possível.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">{GAME_DURATION}s</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">Tempo total</p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900 dark:text-green-100">{POINTS_PER_CORRECT}</h3>
              <p className="text-sm text-green-700 dark:text-green-300">Pontos por acerto</p>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <Clock className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <h3 className="font-semibold text-red-900 dark:text-red-100">-{WRONG_ANSWER_PENALTY}s</h3>
              <p className="text-sm text-red-700 dark:text-red-300">Penalidade por erro</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={startChallenge}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Iniciar Desafio
            </Button>
            
            {onClose && (
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full"
              >
                Voltar
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Desafio Concluído!
            </h2>
          </div>

          {challengeResult && (
            <div className="space-y-6">
              {/* Score */}
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-6 rounded-lg">
                <div className="text-4xl font-bold mb-2">{challengeResult.score}</div>
                <div className="text-lg">pontos</div>
                {challengeResult.isPersonalBest && (
                  <div className="flex items-center justify-center mt-2 text-sm">
                    <Star className="w-4 h-4 mr-1" />
                    Novo Recorde Pessoal!
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {challengeResult.correctAnswers}/{challengeResult.totalQuestions}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Acertos</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {challengeResult.accuracy.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Precisão</div>
                </div>
              </div>

              {/* Ranking */}
              {challengeResult.rankingPosition > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    Posição no Ranking: #{challengeResult.rankingPosition}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Hoje em {category}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={startChallenge}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Jogar Novamente
                </Button>
                
                {onClose && (
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="w-full"
                  >
                    Voltar
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Playing state
  return (
    <div className={`max-w-2xl mx-auto p-6 transition-all duration-300 ${
      flashEffect === 'green' ? 'bg-green-100 dark:bg-green-900/20' :
      flashEffect === 'red' ? 'bg-red-100 dark:bg-red-900/20' : ''
    }`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="secondary" className="text-lg">
            {category}
          </Badge>
          
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Timer and Score */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 text-2xl font-bold ${
            timeRemaining <= 10 ? 'text-red-500 animate-pulse' : 'text-gray-900 dark:text-gray-100'
          }`}>
            <Clock className="w-6 h-6" />
            {timeRemaining}s
          </div>
          
          <div className="flex items-center gap-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
            <Zap className="w-6 h-6" />
            {score}
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Pergunta {questionIndex + 1}</span>
            <span>{correctAnswers} acertos</span>
          </div>
          <Progress value={(questionIndex / signs.length) * 100} className="h-2" />
        </div>
      </div>

      {/* Question */}
      {currentQuestion && (
        <Card className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Qual é o nome desta placa?
            </h3>
            
            <div className="aspect-square w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-lg mx-auto mb-4 flex items-center justify-center overflow-hidden">
              {currentQuestion.sign.image_url ? (
                <img
                  src={currentQuestion.sign.image_url}
                  alt={currentQuestion.sign.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://via.placeholder.com/300x300/e5e7eb/6b7280?text=${encodeURIComponent(currentQuestion.sign.code)}`;
                  }}
                />
              ) : (
                <div className="text-gray-400 text-4xl font-bold">
                  {currentQuestion.sign.code}
                </div>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswerSelect(option.id)}
                disabled={isProcessing}
                className={getOptionButtonClass(option.id)}
              >
                {option.text}
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}