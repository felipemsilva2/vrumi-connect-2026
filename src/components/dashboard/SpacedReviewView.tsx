import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react"

interface SRSFlashcard {
  id: string
  question: string
  answer: string
  ease_factor: number
  interval_days: number
  repetitions: number
  due_date: string
  last_reviewed: string | null
  lapses: number
}

function calculateNextReview(card: SRSFlashcard, quality: number) {
  let easeFactor = card.ease_factor
  let interval = card.interval_days
  let repetitions = card.repetitions

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetitions += 1
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  } else {
    repetitions = 0
    interval = 1
  }

  easeFactor = Math.max(1.3, easeFactor)

  const nextDue = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString()

  return {
    ease_factor: easeFactor,
    interval_days: interval,
    repetitions,
    due_date: nextDue,
    last_reviewed: new Date().toISOString(),
  }
}

export const SpacedReviewView = () => {
  const [cards, setCards] = useState<SRSFlashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [feedback, setFeedback] = useState<{ score: number; message: string; type: "success" | "warning" | "error" } | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [sm2ColumnsAvailable, setSm2ColumnsAvailable] = useState<boolean>(true)

  const cardsDueToday = useMemo(() => {
    const now = new Date()
    return cards.filter(c => new Date(c.due_date) <= now)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
  }, [cards])

  const checkSm2Columns = async () => {
    try {
      const { error } = await supabase
        .from("flashcards")
        .select("id,ease_factor,interval_days,repetitions,due_date,last_reviewed,lapses")
        .limit(1)
      if (error) {
        if ((error as any).code === "42703") {
          setSm2ColumnsAvailable(false)
          return
        }
        throw error
      }
      setSm2ColumnsAvailable(true)
    } catch (err) {
      console.warn("Falha ao detectar colunas SM-2, assumindo indisponíveis.", err)
      setSm2ColumnsAvailable(false)
    }
  }

  useEffect(() => {
    (async () => {
      await checkSm2Columns()
      await fetchDueCards()
    })()
  }, [])

  const fetchDueCards = async () => {
    try {
      const nowIso = new Date().toISOString()
      if (sm2ColumnsAvailable) {
        const { data, error } = await supabase
          .from("flashcards")
          .select("id,question,answer,ease_factor,interval_days,repetitions,due_date,last_reviewed,lapses")
          .lte("due_date", nowIso)
          .order("due_date", { ascending: true })
        if (error) throw error
        setCards(data || [])
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setCards([])
          return
        }
        const { data: stats, error: statsError } = await supabase
          .from("user_flashcard_stats")
          .select("flashcard_id,next_review,last_reviewed,times_reviewed,times_incorrect")
          .eq("user_id", user.id)
          .lte("next_review", nowIso)
          .order("next_review", { ascending: true })
        if (statsError) throw statsError
        const ids = (stats || []).map(s => s.flashcard_id)
        if (ids.length === 0) {
          setCards([])
          return
        }
        const { data: cardsData, error: cardsError } = await supabase
          .from("flashcards")
          .select("id,question,answer")
          .in("id", ids)
        if (cardsError) throw cardsError
        const statById = new Map((stats || []).map(s => [s.flashcard_id, s]))
        const merged = (cardsData || []).map(fc => {
          const st = statById.get(fc.id)
          return {
            id: fc.id,
            question: fc.question,
            answer: fc.answer,
            ease_factor: 2.5,
            interval_days: 0,
            repetitions: (st?.times_reviewed ?? 0),
            due_date: st?.next_review ?? nowIso,
            last_reviewed: st?.last_reviewed ?? null,
            lapses: st?.times_incorrect ?? 0,
          } as SRSFlashcard
        })
        setCards(merged)
      }
    } catch (err) {
      console.error("Erro ao carregar cartões SRS:", err)
      toast({ title: "Erro", description: "Falha ao carregar cartões de revisão.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const evaluateAnswer = (userText: string, correctAnswer: string): { score: number; message: string; type: "success" | "warning" | "error" } => {
    const normalizedUser = userText.trim().toLowerCase()
    const normalizedCorrect = correctAnswer.trim().toLowerCase()

    if (!normalizedUser) {
      return { score: 1, message: "Sem resposta.", type: "error" }
    }
    if (normalizedUser === normalizedCorrect) {
      return { score: 5, message: "Resposta exata!", type: "success" }
    }
    if (normalizedUser.includes(normalizedCorrect)) {
      return { score: 4, message: "Muito próxima.", type: "success" }
    }
    // parcial: pelo menos metade das palavras-chave
    const correctTokens = normalizedCorrect.split(/\s+/)
    const userTokens = new Set(normalizedUser.split(/\s+/))
    const matches = correctTokens.filter(t => userTokens.has(t)).length
    if (matches >= Math.ceil(correctTokens.length / 2)) {
      return { score: 3, message: "Parcialmente correta.", type: "warning" }
    }
    return { score: 2, message: "Incorreta, mas houve tentativa.", type: "error" }
  }

  const handleSubmit = () => {
    if (!cardsDueToday.length) return
    const card = cardsDueToday[currentIndex] || cardsDueToday[0]
    const result = evaluateAnswer(userAnswer, card.answer)
    setFeedback(result)
  }

  const applySM2AndNext = async () => {
    if (!cardsDueToday.length) return
    const card = cardsDueToday[currentIndex] || cardsDueToday[0]
    if (!feedback) {
      toast({ title: "Avalie a resposta", description: "Clique em Enviar Resposta antes de continuar.", variant: "destructive" })
      return
    }

    const next = calculateNextReview(card, feedback.score)

    try {
      if (sm2ColumnsAvailable) {
        const { error } = await supabase
          .from("flashcards")
          .update({
            ease_factor: next.ease_factor,
            interval_days: next.interval_days,
            repetitions: next.repetitions,
            due_date: next.due_date,
            last_reviewed: next.last_reviewed,
          })
          .eq("id", card.id)
        if (error) throw error

        if (feedback.score < 3) {
          await supabase
            .from("flashcards")
            .update({ lapses: (card.lapses || 0) + 1 })
            .eq("id", card.id)
        }
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const isCorrect = feedback.score >= 3

        const { data: existingStats, error: fetchStatsError } = await supabase
          .from("user_flashcard_stats")
          .select("times_reviewed, times_correct, times_incorrect")
          .eq("user_id", user.id)
          .eq("flashcard_id", card.id)
          .maybeSingle()
        if (fetchStatsError) {
          console.error("Erro ao buscar estatísticas do cartão:", fetchStatsError)
        }

        const prevReviewed = existingStats?.times_reviewed || 0
        const prevCorrect = existingStats?.times_correct || 0
        const prevIncorrect = existingStats?.times_incorrect || 0

        await supabase
          .from("user_flashcard_stats")
          .upsert({
            user_id: user.id,
            flashcard_id: card.id,
            times_reviewed: prevReviewed + 1,
            times_correct: prevCorrect + (isCorrect ? 1 : 0),
            times_incorrect: prevIncorrect + (isCorrect ? 0 : 1),
            last_reviewed: new Date().toISOString(),
            next_review: next.due_date,
          }, { onConflict: "user_id,flashcard_id" })

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("total_flashcards_studied,total_questions_answered,correct_answers")
          .eq("id", user.id)
          .maybeSingle()
        if (!profileError && profileData) {
          const prevFlash = profileData.total_flashcards_studied || 0
          const prevQuestions = profileData.total_questions_answered || 0
          const prevCorrectTotal = profileData.correct_answers || 0
          await supabase
            .from("profiles")
            .update({
              total_flashcards_studied: prevFlash + 1,
              total_questions_answered: prevQuestions + 1,
              correct_answers: prevCorrectTotal + (isCorrect ? 1 : 0),
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id)
        }

        await supabase
          .from("user_activities")
          .insert({
            user_id: user.id,
            activity_type: "flashcard_studied",
            metadata: {
              title: "Revisão SRS",
              description: isCorrect ? "Você acertou na revisão SRS" : "Você errou na revisão SRS",
              flashcard_id: card.id,
              correct: isCorrect,
              quality: feedback.score,
            },
            created_at: new Date().toISOString(),
          })
      }

      setUserAnswer("")
      setFeedback(null)
      await fetchDueCards()
      setCurrentIndex(0)

      toast({ title: "Revisão registrada", description: "Próximo cartão carregado.", variant: "default" })
    } catch (err) {
      console.error("Erro ao atualizar cartão SRS:", err)
      toast({ title: "Erro", description: "Falha ao salvar revisão.", variant: "destructive" })
    }
  }

  if (loading) {
    return <div className="text-center py-8">Carregando cartões de revisão...</div>
  }

  const current = cardsDueToday[currentIndex]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Revisão (SRS)</h2>
        <div className="text-sm text-muted-foreground">Cartões devidos hoje: {cardsDueToday.length}</div>
      </div>

      {!current ? (
        <div className="p-6 border rounded-lg bg-card text-center">Nenhum cartão devido hoje. Parabéns!</div>
      ) : (
        <div className="space-y-4">
          <div className="p-6 border rounded-lg bg-card">
            <div className="text-sm text-muted-foreground mb-2">Intervalo: {current.interval_days} dia(s) • Repetições: {current.repetitions} • Facilidade: {current.ease_factor.toFixed(2)}</div>
            <h3 className="text-lg font-semibold">{current.question}</h3>
          </div>

          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-lg p-2"
              placeholder="Digite sua resposta"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
            />
            <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Enviar Resposta</button>
          </div>

          {feedback && (
            <div className={`p-4 rounded-lg border ${feedback.type === "success" ? "bg-green-50 border-green-200" : feedback.type === "warning" ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-center gap-2">
                {feedback.type === "success" && <CheckCircle className="h-5 w-5 text-green-600" />}
                {feedback.type === "warning" && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                {feedback.type === "error" && <XCircle className="h-5 w-5 text-red-600" />}
                <span className="font-medium">{feedback.message} (nota {feedback.score})</span>
              </div>
              <div className="mt-2 text-sm">Resposta correta: <span className="font-semibold">{current.answer}</span></div>
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={applySM2AndNext} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground">Próximo</button>
          </div>
        </div>
      )}
    </div>
  )
}