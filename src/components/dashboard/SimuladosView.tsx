import { useState, useEffect } from "react"
import { Clock, Play, History, Trophy, CheckCircle, XCircle } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

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
  const [timeLeft, setTimeLeft] = useState(2400) // 40 minutos
  const [quizStarted, setQuizStarted] = useState(false)
  const [attemptHistory, setAttemptHistory] = useState<QuizAttempt[]>([])
  const [currentAttemptId, setCurrentAttemptId] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    fetchAttemptHistory()
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (quizStarted && timeLeft > 0 && view === "quiz") {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            finishQuiz()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
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
      
      // Shuffle questions
      const shuffled = (data || []).sort(() => Math.random() - 0.5)
      setQuestions(shuffled)
      setView("quiz")
      setQuizStarted(true)
      setCurrentQuestion(0)
      setUserAnswers({})
      setSelectedAnswer("")
      setTimeLeft(type === "official" ? 2400 : 1200) // 40 min ou 20 min
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
        setCurrentAttemptId(attemptData.id)

        // Save individual answers
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
    return `${mins}:${secs.toString().padStart(2, "0")}`
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
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${passed ? 'bg-success/10' : 'bg-destructive/10'}`}>
            {passed ? (
              <CheckCircle className="h-12 w-12 text-success" />
            ) : (
              <XCircle className="h-12 w-12 text-destructive" />
            )}
          </div>

          <h2 className="text-3xl font-bold mb-2">
            {passed ? "Parabéns! Você foi aprovado!" : "Não foi dessa vez"}
          </h2>
          
          <p className="text-6xl font-bold my-6" style={{ color: passed ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }}>
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
            <button
              onClick={() => setView("menu")}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Voltar ao Menu
            </button>
            <button
              onClick={() => startQuiz(questions.length === 30 ? "official" : "practice")}
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Revisão das Questões</h3>
          <div className="space-y-4">
            {questions.map((q, index) => {
              const userAnswer = userAnswers[index]
              const isCorrect = userAnswer === q.correct_option
              
              return (
                <div key={q.id} className={`p-4 rounded-lg border ${isCorrect ? 'border-success/50 bg-success/5' : 'border-destructive/50 bg-destructive/5'}`}>
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-1" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium mb-2">{index + 1}. {q.question_text}</p>
                      <p className="text-sm text-muted-foreground mb-1">
                        Sua resposta: <span className={isCorrect ? 'text-success' : 'text-destructive'}>{userAnswer || "Não respondida"}</span>
                      </p>
                      {!isCorrect && (
                        <>
                          <p className="text-sm text-success mb-2">
                            Resposta correta: {q.correct_option}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {q.explanation}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // View: Quiz in Progress
  if (view === "quiz" && questions.length > 0) {
    const currentQ = questions[currentQuestion]
    const progress = ((currentQuestion + 1) / questions.length) * 100

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
          <div>
            <p className="text-sm text-muted-foreground">Questão</p>
            <p className="text-xl font-bold">{currentQuestion + 1} / {questions.length}</p>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <Clock className="h-5 w-5" />
            <span className="text-xl font-mono font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-lg font-medium mb-6">{currentQ.question_text}</p>

          <div className="space-y-3">
            {['A', 'B', 'C', 'D'].map((option) => (
              <button
                key={option}
                onClick={() => handleAnswerSelect(option)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswer === option
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="font-bold mr-3">{option})</span>
                {currentQ[`option_${option.toLowerCase()}` as keyof QuizQuestion]}
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            
            {currentQuestion < questions.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Próxima
              </button>
            ) : (
              <button
                onClick={finishQuiz}
                className="flex-1 px-4 py-2 bg-success text-success-foreground rounded-lg hover:bg-success/90"
              >
                Finalizar Simulado
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-10 gap-2">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentQuestion(index)
                setSelectedAnswer(userAnswers[index] || "")
              }}
              className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                userAnswers[index]
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              } ${currentQuestion === index ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // View: History
  if (view === "history") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Histórico de Simulados</h2>
          <button
            onClick={() => setView("menu")}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
          >
            Voltar
          </button>
        </div>

        <div className="space-y-3">
          {attemptHistory.map((attempt) => (
            <div key={attempt.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {attempt.quiz_type === "official" ? "Simulado Oficial" : "Simulado de Prática"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(attempt.completed_at).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(attempt.completed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${attempt.score_percentage >= 70 ? 'text-success' : 'text-destructive'}`}>
                    {attempt.score_percentage}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {attempt.correct_answers}/{attempt.total_questions} acertos
                  </p>
                </div>
              </div>
            </div>
          ))}

          {attemptHistory.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum simulado realizado ainda</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // View: Main Menu
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Simulados</h2>
        <p className="text-muted-foreground mt-1">
          Teste seus conhecimentos com simulados fiéis ao exame oficial
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Simulado Oficial</h3>
              <p className="text-sm text-muted-foreground mb-4">
                30 questões • 40 minutos • Idêntico ao exame do DETRAN
              </p>
              <button
                onClick={() => startQuiz("official")}
                className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Play className="h-4 w-4" />
                Iniciar Simulado Oficial
              </button>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-secondary/10 rounded-lg">
              <Play className="h-6 w-6 text-secondary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Simulado de Prática</h3>
              <p className="text-sm text-muted-foreground mb-4">
                15 questões • 20 minutos • Prática rápida
              </p>
              <button
                onClick={() => startQuiz("practice")}
                className="w-full py-2 px-4 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Play className="h-4 w-4" />
                Iniciar Prática Rápida
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Histórico Recente</h3>
          <button
            onClick={() => setView("history")}
            className="text-primary hover:underline flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            Ver Tudo
          </button>
        </div>

        {attemptHistory.slice(0, 3).map((attempt) => (
          <div key={attempt.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div>
              <p className="font-medium">
                {attempt.quiz_type === "official" ? "Simulado Oficial" : "Prática"}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(attempt.completed_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-xl font-bold ${attempt.score_percentage >= 70 ? 'text-success' : 'text-destructive'}`}>
                {attempt.score_percentage}%
              </p>
              <p className="text-xs text-muted-foreground">
                {attempt.correct_answers}/{attempt.total_questions}
              </p>
            </div>
          </div>
        ))}

        {attemptHistory.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            Faça seu primeiro simulado para começar!
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Total de Simulados</h4>
          <p className="text-2xl font-bold text-primary">{attemptHistory.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Média Geral</h4>
          <p className="text-2xl font-bold text-success">
            {attemptHistory.length > 0
              ? Math.round(attemptHistory.reduce((acc, a) => acc + a.score_percentage, 0) / attemptHistory.length)
              : 0}%
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Melhor Resultado</h4>
          <p className="text-2xl font-bold text-secondary">
            {attemptHistory.length > 0
              ? Math.max(...attemptHistory.map(a => a.score_percentage))
              : 0}%
          </p>
        </div>
      </div>
    </div>
  )
}
