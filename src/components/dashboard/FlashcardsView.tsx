import { useState, useEffect } from "react"
import { BookOpen, ArrowRight, ArrowLeft, RotateCcw, CheckCircle, XCircle, HelpCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { ImageWithFallback } from "@/components/ImageWithFallback"
import { SubscriptionGate } from "@/components/auth/SubscriptionGate"

interface Flashcard {
  id: string
  question: string
  answer: string
  category: string
  difficulty: string
  image_url?: string
}

interface FlashcardStats {
  times_reviewed: number
  times_correct: number
  times_incorrect: number
}

export const FlashcardsView = () => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentCard, setCurrentCard] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [direction, setDirection] = useState(0)
  const [stats, setStats] = useState<FlashcardStats>({ times_reviewed: 0, times_correct: 0, times_incorrect: 0 })
  const [loading, setLoading] = useState(true)
  const [globalStats, setGlobalStats] = useState({
    total_studied: 0,
    total_correct: 0
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchFlashcards()
    fetchGlobalStats()
  }, [])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()
        if (!isFlipped) setIsFlipped(true)
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault()
        handlePrevious()
      } else if (event.code === 'ArrowRight') {
        event.preventDefault()
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentCard, isFlipped, flashcards.length])

  // Embaralhamento Fisher-Yates
  const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  const fetchGlobalStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("profiles")
        .select("total_flashcards_studied, correct_answers")
        .eq("id", user.id)
        .maybeSingle()

      if (error) throw error
      if (data) {
        setGlobalStats({
          total_studied: data.total_flashcards_studied || 0,
          total_correct: data.correct_answers || 0
        })
      }
    } catch (error) {
      console.error("Error fetching global stats:", error)
    }
  }

  const fetchFlashcards = async () => {
    if (!isSupabaseConfigured || !navigator.onLine) {
      setLoading(false)
      return
    }
    try {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")

      if (error) throw error
      const shuffled = shuffleArray(data || [])
      setFlashcards(shuffled)
      if (shuffled && shuffled.length > 0) {
        fetchCardStats(shuffled[0].id)
      }
    } catch (error) {
      console.error("Error fetching flashcards:", error)
      toast({
        title: "Erro ao carregar flashcards",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCardStats = async (cardId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("user_flashcard_stats")
        .select("*")
        .eq("user_id", user.id)
        .eq("flashcard_id", cardId)
        .maybeSingle()

      if (error) throw error
      if (data) {
        setStats({
          times_reviewed: data.times_reviewed || 0,
          times_correct: data.times_correct || 0,
          times_incorrect: data.times_incorrect || 0,
        })
      } else {
        setStats({ times_reviewed: 0, times_correct: 0, times_incorrect: 0 })
      }
    } catch (error) {
      console.error("Error fetching card stats:", error)
    }
  }

  const updateCardStats = async (difficulty: 'easy' | 'medium' | 'hard') => {
    if (flashcards.length === 0) return

    const isCorrect = difficulty === 'easy'

    // Optimistic global stats update
    setGlobalStats(prev => ({
      total_studied: prev.total_studied + 1,
      total_correct: prev.total_correct + (isCorrect ? 1 : 0)
    }))

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const currentFlashcard = flashcards[currentCard]

      const { error } = await supabase
        .from("user_flashcard_stats")
        .upsert({
          user_id: user.id,
          flashcard_id: currentFlashcard.id,
          times_reviewed: stats.times_reviewed + 1,
          times_correct: stats.times_correct + (difficulty === 'easy' ? 1 : 0),
          times_incorrect: stats.times_incorrect + (difficulty === 'hard' ? 1 : 0),
          last_reviewed: new Date().toISOString(),
        })

      if (error) throw error

      // Atualiza totais no perfil do usuário (para Dashboard/Estatísticas)
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("total_flashcards_studied,total_questions_answered,correct_answers")
        .eq("id", user.id)
        .maybeSingle()

      if (!profileError && profileData) {
        const prevFlash = profileData.total_flashcards_studied || 0
        const prevQuestions = profileData.total_questions_answered || 0
        const prevCorrect = profileData.correct_answers || 0
        await supabase
          .from("profiles")
          .update({
            total_flashcards_studied: prevFlash + 1,
            total_questions_answered: prevQuestions + 1,
            correct_answers: prevCorrect + (isCorrect ? 1 : 0),
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)
      }

      // Registra atividade para aparecer em "Atividades Recentes"
      await supabase
        .from("user_activities")
        .insert({
          user_id: user.id,
          activity_type: "flashcard_studied",
          metadata: {
            title: "Flashcard estudado",
            description: difficulty === 'easy' ? "Você acertou um flashcard" :
              difficulty === 'medium' ? "Você revisou um flashcard" : "Você errou um flashcard",
            category: currentFlashcard.category,
            flashcard_id: currentFlashcard.id,
            correct: isCorrect,
            difficulty: difficulty
          },
          created_at: new Date().toISOString(),
        })
    } catch (error) {
      console.error("Error updating card stats:", error)
    }
  }

  const handleNext = async (difficulty?: 'easy' | 'medium' | 'hard') => {
    // Optimistic update: Move to next card immediately
    if (currentCard < flashcards.length - 1) {
      setDirection(1)
      setIsFlipped(false)
      const nextIndex = currentCard + 1
      setTimeout(() => {
        setCurrentCard(nextIndex)
        fetchCardStats(flashcards[nextIndex].id)
      }, 200)
    }

    // Update stats in the background
    if (difficulty && isFlipped) {
      updateCardStats(difficulty).catch(console.error)

      const messages = {
        easy: "Ótimo! Este card será mostrado com menos frequência.",
        medium: "Entendido! Vamos revisar este card novamente em breve.",
        hard: "Vamos praticar mais! Este card aparecerá com mais frequência."
      }

      toast({
        title: "Progresso salvo!",
        description: messages[difficulty],
      })
    }
  }

  const handlePrevious = () => {
    if (currentCard > 0) {
      setDirection(-1)
      setIsFlipped(false)
      const prevIndex = currentCard - 1
      setTimeout(() => {
        setCurrentCard(prevIndex)
        fetchCardStats(flashcards[prevIndex].id)
      }, 200)
    }
  }

  const handleReset = () => {
    const shuffled = shuffleArray(flashcards)
    setFlashcards(shuffled)
    setCurrentCard(0)
    setIsFlipped(false)
    if (shuffled.length > 0) {
      fetchCardStats(shuffled[0].id)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Carregando flashcards...</div>
  }

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum flashcard disponível no momento.</p>
      </div>
    )
  }

  const card = flashcards[currentCard]

  return (
    <SubscriptionGate feature="Flashcards">
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Flashcards de Estudo</h2>
            <p className="text-muted-foreground mt-1">
              Cartão {currentCard + 1} de {flashcards.length}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-card border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Recomeçar
          </button>
        </div>

        <div className="flex justify-center items-center min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCard}
              initial={{ opacity: 0, x: direction * 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -100 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl"
            >
              <motion.div
                className="relative cursor-pointer"
                onClick={() => !isFlipped && setIsFlipped(true)}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className="bg-card border border-border rounded-2xl p-4 sm:p-8 shadow-card min-h-[300px] flex flex-col justify-center items-center"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                  }}
                >
                  <div className="absolute top-4 left-4">
                    <span className="text-xs font-medium px-3 py-1 bg-primary/10 text-primary rounded-full">
                      {card.category}
                    </span>
                  </div>
                  <BookOpen className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold text-foreground text-center mb-4">
                    {isFlipped ? "Resposta" : "Pergunta"}
                  </h3>

                  {!isFlipped && card.image_url && (
                    <div className="mb-4 flex justify-center">
                      <ImageWithFallback
                        src={card.image_url}
                        alt={`Imagem ilustrativa sobre ${card.category}`}
                        className="max-w-xs w-full rounded-lg shadow-md"
                        fallbackClassName="h-48"
                      />
                    </div>
                  )}

                  <p className="text-lg text-foreground text-center break-words max-w-full">
                    {isFlipped ? card.answer : card.question}
                  </p>
                  {!isFlipped && (
                    <p className="text-sm text-muted-foreground mt-6">
                      Clique para ver a resposta
                    </p>
                  )}
                  {isFlipped && (
                    <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full sm:w-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleNext('hard')
                        }}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md hover:shadow-lg font-medium w-full sm:w-auto"
                      >
                        <XCircle className="h-5 w-5" />
                        Errei
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleNext('medium')
                        }}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors shadow-md hover:shadow-lg font-medium w-full sm:w-auto"
                      >
                        <HelpCircle className="h-5 w-5" />
                        Dúvida
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleNext('easy')
                        }}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md hover:shadow-lg font-medium w-full sm:w-auto"
                      >
                        <CheckCircle className="h-5 w-5" />
                        Acertei
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentCard === 0}
            className="flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Anterior</span>
            <span className="sm:hidden">Ant.</span>
          </button>
          <button
            onClick={() => handleNext()}
            disabled={currentCard === flashcards.length - 1}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="hidden sm:inline">Próximo</span>
            <span className="sm:hidden">Prox.</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Cards Totais</h4>
            <p className="text-2xl font-bold text-primary">{flashcards.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Revisões Totais</h4>
            <p className="text-2xl font-bold text-secondary">{globalStats.total_studied}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Taxa de Acerto Geral</h4>
            <p className="text-2xl font-bold text-success">
              {globalStats.total_studied > 0
                ? Math.round((globalStats.total_correct / globalStats.total_studied) * 100)
                : 0}%
            </p>
          </div>
        </div>
      </div>
    </SubscriptionGate>
  )
}
