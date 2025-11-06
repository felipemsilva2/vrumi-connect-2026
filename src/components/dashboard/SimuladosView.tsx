import { useState, useEffect, useRef } from "react"
import { Clock, Play, History, Trophy, CheckCircle, XCircle, ArrowLeft, ArrowRight, Lock, Calendar } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { ImageWithFallback } from "@/components/ImageWithFallback"
import { useActivePass } from "@/hooks/useActivePass"
import { useNavigate } from "react-router-dom"

interface QuizQuestion {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
  explanation: string
  chapter_id: string
  image_url?: string
}

interface QuizAttempt {
  id: string
  quiz_type: string
  total_questions: number
  correct_answers: number
  score_percentage: number
  time_taken: number
  completed_at: string
}

export const SimuladosView = () => {
  const [view, setView] = useState<"menu" | "quiz" | "results" | "history">("menu")
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>("")
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(2400)
  const [quizStarted, setQuizStarted] = useState(false)
  const [attemptHistory, setAttemptHistory] = useState<QuizAttempt[]>([])
  const [showConfirmFinish, setShowConfirmFinish] = useState(false)
  const [userId, setUserId] = useState<string>()
  const timerRef = useRef<number | null>(null)
  const { toast } = useToast()
  const navigate = useNavigate()
  const { hasActivePass, activePass, isLoading, daysRemaining } = useActivePass(userId)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    getUser()
  }, [])

  useEffect(() => {
    fetchAttemptHistory()
  }, [])

  useEffect(() => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    
    if (quizStarted && timeLeft > 0 && view === "quiz") {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            window.clearInterval(timerRef.current!)
            finishQuiz()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [quizStarted, timeLeft, view])

  const fetchAttemptHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("user_quiz_attempts")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(10)

      if (error) throw error
      setAttemptHistory(data || [])
    } catch (error) {
      console.error("Error fetching history:", error)
    }
  }

  const startQuiz = async (type: "practice" | "official") => {
    try {
      const limit = type === "official" ? 30 : 15
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .limit(limit)

      if (error) throw error
      
      const shuffled = (data || []).sort(() => Math.random() - 0.5)
      setQuestions(shuffled)
      setView("quiz")
      setQuizStarted(true)
      setCurrentQuestion(0)
      setUserAnswers({})
      setSelectedAnswer("")
      setTimeLeft(type === "official" ? 2400 : 1200)
    } catch (error) {
      console.error("Error starting quiz:", error)
      toast({
        title: "Erro ao iniciar simulado",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      })
    }
  }

  const handleAnswerSelect = (option: string) => {
    setSelectedAnswer(option)
    setUserAnswers({ ...userAnswers, [currentQuestion]: option })
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(userAnswers[currentQuestion + 1] || "")
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setSelectedAnswer(userAnswers[currentQuestion - 1] || "")
    }
  }

  const jumpTo = (index: number) => {
    setCurrentQuestion(index)
    setSelectedAnswer(userAnswers[index] || "")
  }

  const finishQuiz = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let correctCount = 0
      questions.forEach((q, index) => {
        if (userAnswers[index] === q.correct_option) {
          correctCount++
        }
      })

      const scorePercentage = Math.round((correctCount / questions.length) * 100)
      const timeTaken = questions.length === 30 ? (2400 - timeLeft) : (1200 - timeLeft)

      const { data: attemptData, error: attemptError } = await supabase
        .from("user_quiz_attempts")
        .insert({
          user_id: user.id,
          quiz_type: questions.length === 30 ? "official" : "practice",
          total_questions: questions.length,
          correct_answers: correctCount,
          score_percentage: scorePercentage,
          time_taken: Math.floor(timeTaken / 60),
        })
        .select()
        .single()

      if (attemptError) throw attemptError

      if (attemptData) {
        const answers = questions.map((q, index) => ({
          attempt_id: attemptData.id,
          question_id: q.id,
          selected_option: userAnswers[index] || "A",
          is_correct: userAnswers[index] === q.correct_option,
        }))

        const { error: answersError } = await supabase
          .from("user_quiz_answers")
          .insert(answers)

        if (answersError) throw answersError
      }

      setQuizStarted(false)
      setShowConfirmFinish(false)
      setView("results")
      fetchAttemptHistory()
    } catch (error) {
      console.error("Error finishing quiz:", error)
      toast({
        title: "Erro ao finalizar simulado",
        description: "Tente novamente",
        variant: "destructive",
      })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const calculateCorrectAnswers = () => {
    return questions.filter((q, index) => userAnswers[index] === q.correct_option).length
  }

  const calculateScore = () => {
    return Math.round((calculateCorrectAnswers() / questions.length) * 100)
  }

  // View: Quiz Results
  if (view === "results") {
    const score = calculateScore()
    const passed = score >= 70

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card className="shadow-lg border-2">
          <CardContent className="p-8 text-center">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${passed ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
              {passed ? (
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
              )}
            </div>

            <h2 className="text-3xl font-bold mb-2">
              {passed ? "Parabéns! Você foi aprovado!" : "Não foi dessa vez"}
            </h2>
            
            <p className={`text-6xl font-bold my-6 ${passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {score}%
            </p>

            <p className="text-muted-foreground mb-6">
              Você acertou {calculateCorrectAnswers()} de {questions.length} questões
            </p>

            {!passed && (
              <p className="text-sm text-muted-foreground mb-4">
                É necessário 70% de acertos para aprovação. Continue estudando!
              </p>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setView("menu")}
                variant="outline"
                size="lg"
              >
                Voltar ao Menu
              </Button>
              <Button
                onClick={() => startQuiz(questions.length === 30 ? "official" : "practice")}
                size="lg"
                className="bg-green-500 hover:bg-green-600"
              >
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <h3 className="text-xl font-bold">Revisão das Questões</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((q, index) => {
              const userAnswer = userAnswers[index]
              const isCorrect = userAnswer === q.correct_option
              
              return (
                <div key={q.id} className={`p-4 rounded-lg border-2 ${isCorrect ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950' : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950'}`}>
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium mb-2">{index + 1}. {q.question_text}</p>
                      <p className="text-sm text-muted-foreground mb-1">
                        Sua resposta: <span className={isCorrect ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold'}>{userAnswer || "Não respondida"}</span>
                      </p>
                      {!isCorrect && (
                        <>
                          <p className="text-sm text-green-600 dark:text-green-400 mb-2 font-semibold">
                            Resposta correta: {q.correct_option}
                          </p>
                          <p className="text-sm text-muted-foreground italic">
                            {q.explanation}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // View: Quiz in Progress
  if (view === "quiz" && questions.length > 0) {
    const currentQ = questions[currentQuestion]
    const answeredCount = Object.keys(userAnswers).length
    const progress = Math.round(((currentQuestion + 1) / questions.length) * 100)

    const cardVariants = {
      enter: { opacity: 0, y: 8 },
      center: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -8 },
    }

    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="w-full max-w-6xl mx-auto">
          {/* Header com timer e progresso */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="shadow-md border-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Questão</div>
                    <div className="text-2xl font-bold text-foreground">
                      {currentQuestion + 1}/{questions.length}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-foreground">
                      <Clock size={20} />
                      <span className="text-xl font-mono font-bold">{formatTime(timeLeft)}</span>
                    </div>
                  </div>
                </div>
                <div className="h-2 w-full bg-green-100 dark:bg-green-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Questão e alternativas */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-2">
                <CardContent className="p-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentQuestion}
                      variants={cardVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="text-lg font-semibold text-foreground mb-6">
                        {currentQ.question_text}
                      </h3>

                      {currentQ.image_url && (
                        <div className="mb-6 flex justify-center">
                          <ImageWithFallback
                            src={currentQ.image_url}
                            alt="Imagem da questão"
                            className="max-w-md w-full rounded-lg shadow-md"
                            fallbackClassName="h-64"
                          />
                        </div>
                      )}

                      <div className="space-y-3">
                        {['A', 'B', 'C', 'D'].map((option) => {
                          const isSelected = selectedAnswer === option
                          const optionText = currentQ[`option_${option.toLowerCase()}` as keyof QuizQuestion] as string
                          
                          return (
                            <button
                              key={option}
                              onClick={() => handleAnswerSelect(option)}
                              className={`w-full text-left rounded-lg border-2 px-4 py-3 flex items-center justify-between transition-all ${
                                isSelected
                                  ? "bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700 shadow-md"
                                  : "bg-background border-border hover:shadow-md hover:border-primary/50"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${isSelected ? 'border-green-500 bg-green-100 dark:bg-green-900' : 'border-border'}`}>
                                  <span className="font-bold text-sm">{option}</span>
                                </div>
                                <div className="text-sm text-foreground">{optionText}</div>
                              </div>
                              {isSelected && (
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                                  <CheckCircle size={18} />
                                  <span className="hidden sm:inline">Selecionada</span>
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {/* Navegação */}
                      <div className="mt-6 flex items-center gap-3">
                        <Button
                          onClick={handlePrevious}
                          disabled={currentQuestion === 0}
                          variant="outline"
                          size="lg"
                        >
                          <ArrowLeft size={16} className="mr-2" /> Anterior
                        </Button>

                        <Button
                          onClick={() => setShowConfirmFinish(true)}
                          variant="outline"
                          size="lg"
                          className="ml-auto text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          Finalizar
                        </Button>

                        <Button
                          onClick={handleNext}
                          size="lg"
                          className="bg-green-500 hover:bg-green-600"
                        >
                          Próxima <ArrowRight size={16} className="ml-2" />
                        </Button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </CardContent>
              </Card>

              <div className="mt-4 text-sm text-muted-foreground">
                💡 Dica: Selecione a alternativa e navegue usando os botões ou o grid à direita
              </div>
            </div>

            {/* Grid de navegação */}
            <aside className="lg:sticky lg:top-6 h-fit">
              <Card className="shadow-lg border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-muted-foreground">Progresso</div>
                    <div className="text-sm font-semibold text-foreground">
                      {answeredCount}/{questions.length}
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {questions.map((_, idx) => {
                      const status = userAnswers[idx]
                        ? "answered"
                        : idx === currentQuestion
                        ? "current"
                        : "unanswered"

                      const classes = {
                        answered: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-2 border-green-300 dark:border-green-700",
                        current: "bg-background text-primary border-2 border-primary shadow-md",
                        unanswered: "bg-muted text-muted-foreground border-2 border-border",
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => jumpTo(idx)}
                          className={`h-12 rounded-lg text-sm font-semibold transition-all hover:scale-105 ${classes[status]}`}
                        >
                          {idx + 1}
                        </button>
                      )
                    })}
                  </div>

                  <Button
                    onClick={() => jumpTo(0)}
                    variant="outline"
                    className="w-full mt-4"
                    size="sm"
                  >
                    Ir para primeira
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>

        {/* Modal de confirmação */}
        <AnimatePresence>
          {showConfirmFinish && (
            <motion.div
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmFinish(false)}
            >
              <motion.div
                className="max-w-md w-full"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <Card className="shadow-2xl border-2">
                  <CardContent className="p-6">
                    <h4 className="text-xl font-bold text-foreground mb-2">Finalizar simulado?</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Você respondeu {answeredCount} de {questions.length} questões. Tem certeza que deseja enviar suas respostas e finalizar o simulado?
                    </p>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowConfirmFinish(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Voltar
                      </Button>
                      <Button
                        onClick={finishQuiz}
                        className="flex-1 bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} /> Enviar e finalizar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // View: History
  if (view === "history") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Histórico de Simulados</h2>
          <Button onClick={() => setView("menu")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>

        <div className="space-y-3">
          {attemptHistory.map((attempt) => (
            <Card key={attempt.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {attempt.quiz_type === "official" ? "🏆 Simulado Oficial" : "📝 Simulado de Prática"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(attempt.completed_at).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(attempt.completed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${attempt.score_percentage >= 70 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {attempt.score_percentage}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {attempt.correct_answers}/{attempt.total_questions} acertos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {attemptHistory.length === 0 && (
            <Card className="shadow-md">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Nenhum simulado realizado ainda</p>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>
    )
  }

  // View: Locked (No Active Pass)
  if (!isLoading && !hasActivePass) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h2 className="text-3xl font-bold text-foreground">Simulados</h2>
          <p className="text-muted-foreground mt-1">
            Adquira um Passaporte de Acesso para desbloquear os simulados
          </p>
        </div>

        <Card className="shadow-lg border-2 border-primary/20 bg-muted/30">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            
            <h3 className="text-2xl font-bold mb-3">Simulados Bloqueados</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Os simulados oficiais e de prática estão disponíveis apenas para usuários com um Passaporte de Acesso ativo.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-w-2xl mx-auto">
              <Card className="bg-card border-2 hover:border-primary/50 transition-all">
                <CardContent className="p-4">
                  <div className="text-primary font-semibold mb-2">Passaporte 30 Dias</div>
                  <div className="text-2xl font-bold mb-1">R$ 29,90</div>
                  <div className="text-sm text-muted-foreground">O Apressado</div>
                </CardContent>
              </Card>
              
              <Card className="bg-card border-2 border-primary shadow-md">
                <CardContent className="p-4">
                  <div className="text-primary font-semibold mb-2">Passaporte 90 Dias</div>
                  <div className="text-2xl font-bold mb-1">R$ 49,90</div>
                  <div className="text-sm text-muted-foreground">O Garantido ⭐</div>
                </CardContent>
              </Card>
            </div>

            <Button 
              onClick={() => navigate("/#preço")}
              size="lg"
              className="bg-primary hover:bg-primary/90"
            >
              Ver Passaportes
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="p-6">
            <h4 className="font-semibold mb-3">O que está incluído:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Trophy className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Simulados Oficiais ilimitados (30 questões, 40 minutos)</span>
              </li>
              <li className="flex items-start gap-2">
                <Play className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Simulados de Prática ilimitados (15 questões, 20 minutos)</span>
              </li>
              <li className="flex items-start gap-2">
                <History className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Histórico completo de desempenho e evolução</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // View: Main Menu
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-foreground">Simulados</h2>
        <p className="text-muted-foreground mt-1">
          Teste seus conhecimentos com simulados fiéis ao exame oficial do DETRAN
        </p>
        {hasActivePass && activePass && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
            <Calendar className="h-4 w-4" />
            <span>
              {daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'} no seu passaporte
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-all border-2 hover:border-primary/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Trophy className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-1">Simulado Oficial</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  30 questões • 40 minutos • Idêntico ao exame do DETRAN
                </p>
                <Button
                  onClick={() => startQuiz("official")}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Iniciar Simulado Oficial
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all border-2 hover:border-secondary/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-secondary/10 rounded-xl">
                <Play className="h-7 w-7 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-1">Simulado de Prática</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  15 questões • 20 minutos • Prática rápida
                </p>
                <Button
                  onClick={() => startQuiz("practice")}
                  className="w-full"
                  variant="secondary"
                  size="lg"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Iniciar Prática Rápida
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Histórico Recente</h3>
            <Button
              onClick={() => setView("history")}
              variant="ghost"
              size="sm"
            >
              <History className="mr-2 h-4 w-4" />
              Ver tudo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {attemptHistory.slice(0, 3).map((attempt) => (
            <div key={attempt.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <p className="font-medium text-sm">
                  {attempt.quiz_type === "official" ? "Simulado Oficial" : "Prática"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(attempt.completed_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-xl font-bold ${attempt.score_percentage >= 70 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {attempt.score_percentage}%
                </p>
              </div>
            </div>
          ))}

          {attemptHistory.length === 0 && (
            <p className="text-center py-4 text-muted-foreground text-sm">
              Nenhum simulado realizado ainda. Comece agora!
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}