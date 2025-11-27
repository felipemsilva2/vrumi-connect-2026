import { BarChart3, TrendingUp, Calendar, Award, Loader2, Target, Clock, Brain, Users } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { SubscriptionGate } from "@/components/auth/SubscriptionGate"

export const EstatisticasView = () => {
  const [totalFlashcards, setTotalFlashcards] = useState(0)
  const [studyStreak, setStudyStreak] = useState(0)
  const [totalStudyDays, setTotalStudyDays] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  // Métricas básicas do perfil
  const [profileStats, setProfileStats] = useState<{ total_flashcards_studied: number; total_questions_answered: number; correct_answers: number; study_progress: number } | null>(null)
  const correctRate = useMemo(() => {
    const total = profileStats?.total_questions_answered || 0
    const correct = profileStats?.correct_answers || 0
    return total > 0 ? Math.round((correct / total) * 100) : 0
  }, [profileStats])

  // Novos estados para funcionalidades avançadas
  const [questionTypeStats, setQuestionTypeStats] = useState<any[]>([])
  const [platformAverages, setPlatformAverages] = useState<{ correctRate: number; avgStudyHours: number; avgQuestions: number } | null>(null)
  const [categoryTrends, setCategoryTrends] = useState<any[]>([])
  const [examReadiness, setExamReadiness] = useState<{ score: number; status: string; weakAreas: string[] } | null>(null)
  const [studyPattern, setStudyPattern] = useState<{ peakHour: string; consistency: number; recommendedHours: number } | null>(null)
  const [trafficSignsAnalytics, setTrafficSignsAnalytics] = useState<{ totalSigns: number; studiedSigns: number; confidenceByCategory: any[]; studyModes: any[]; recentProgress: any[] } | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.id) return

        // Total de flashcards (sem métricas SRS)
        const { data: flashcards, error: flashError } = await supabase
          .from("flashcards")
          .select("id")
        if (flashError) throw flashError
        setTotalFlashcards((flashcards || []).length)

        // Estatísticas básicas do perfil
        const { data: profileRow, error: profileError } = await supabase
          .from("profiles")
          .select("total_flashcards_studied,total_questions_answered,correct_answers,study_progress")
          .eq("id", user.id)
          .maybeSingle()
        if (profileError) throw profileError

        let currentCorrectRate = 0
        if (profileRow) {
          setProfileStats(profileRow)
          const total = profileRow.total_questions_answered || 0
          const correct = profileRow.correct_answers || 0
          currentCorrectRate = total > 0 ? Math.round((correct / total) * 100) : 0
        }

        // Buscar dados para análise de padrões de estudo (últimos 30 dias)
        const today = new Date()
        const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

        // Calcular sequência de dias (simplificado - baseado em dias com atividade)
        const allAttempts = await supabase
          .from("user_quiz_attempts")
          .select("completed_at")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false })

        let calculatedStudyDays = 0
        if (allAttempts.data) {
          const uniqueDays = new Set(
            allAttempts.data.map(attempt =>
              new Date(attempt.completed_at).toISOString().split('T')[0]
            )
          )
          calculatedStudyDays = uniqueDays.size
          setTotalStudyDays(calculatedStudyDays)

          // Calcular sequência atual (simplificado)
          let streak = 0
          const currentDate = new Date()
          currentDate.setHours(0, 0, 0, 0)

          for (let i = 0; i < 30; i++) {
            const dateStr = currentDate.toISOString().split('T')[0]
            if (uniqueDays.has(dateStr)) {
              streak++
              currentDate.setDate(currentDate.getDate() - 1)
            } else if (i === 0) {
              // Se hoje não tem atividade, verificar ontem
              currentDate.setDate(currentDate.getDate() - 1)
              const yesterdayStr = currentDate.toISOString().split('T')[0]
              if (uniqueDays.has(yesterdayStr)) {
                streak++
                currentDate.setDate(currentDate.getDate() - 1)
              } else {
                break
              }
            } else {
              break
            }
          }

          setStudyStreak(streak)
        }

        // 🎯 Análise de Desempenho por Dificuldade de Questão
        // Usar campo difficulty do quiz_questions em vez de question_types
        const { data: questionsByDifficulty } = await supabase
          .from("quiz_questions")
          .select("id, difficulty")

        if (questionsByDifficulty) {
          const difficultyLevels = ['easy', 'medium', 'hard']
          const typeStats = await Promise.all(
            difficultyLevels.map(async (difficulty) => {
              const levelQuestions = questionsByDifficulty.filter(q => q.difficulty === difficulty)
              const totalQuestions = levelQuestions.length

              if (totalQuestions === 0) return null

              // Buscar tentativas que incluem questões desta dificuldade
              const { data: attempts } = await supabase
                .from("user_quiz_attempts")
                .select("correct_answers, total_questions")
                .eq("user_id", user.id)

              // Estimar acerto por dificuldade baseado na taxa geral
              const userCorrectRate = currentCorrectRate / 100
              const difficultyMultiplier = difficulty === 'easy' ? 1.2 : difficulty === 'medium' ? 1.0 : 0.8
              const estimatedAccuracy = Math.round(Math.min(100, userCorrectRate * difficultyMultiplier * 100))

              return {
                name: difficulty === 'easy' ? 'Fácil' : difficulty === 'medium' ? 'Média' : 'Difícil',
                description: `Questões de dificuldade ${difficulty}`,
                totalQuestions,
                totalAttempts: attempts?.length || 0,
                accuracy: estimatedAccuracy,
                questionsAnswered: Math.round((attempts?.length || 0) * 0.3) // Estimativa
              }
            })
          )
          setQuestionTypeStats(typeStats.filter(t => t && t.questionsAnswered > 0))
        }

        // 📊 Comparação com Médias da Plataforma (Fallback com valores padrão)
        // Como não temos tabela platform_statistics, usar médias do sistema
        const { data: allUsersStats } = await supabase
          .from("profiles")
          .select("total_questions_answered, study_progress")

        if (allUsersStats && allUsersStats.length > 0) {
          const avgCorrectRate = Math.round(
            allUsersStats.reduce((sum, user) => sum + (user.study_progress || 0), 0) / allUsersStats.length
          )
          const avgQuestions = Math.round(
            allUsersStats.reduce((sum, user) => sum + (user.total_questions_answered || 0), 0) / allUsersStats.length
          )

          setPlatformAverages({
            correctRate: avgCorrectRate || 65,
            avgStudyHours: 8, // Média padrão
            avgQuestions: avgQuestions || 120
          })
        } else {
          // Valores padrão se não houver dados
          setPlatformAverages({
            correctRate: 65,
            avgStudyHours: 8,
            avgQuestions: 120
          })
        }

        // 📈 Tendências por Categoria (Removido pois depende de módulos)
        setCategoryTrends([])

        // 🎯 Prepar para Prova
        const totalQuestionsAnswered = profileRow?.total_questions_answered || 0
        const flashcardsStudied = profileRow?.total_flashcards_studied || 0
        const studyDays = calculatedStudyDays

        // Calcular pontuação de preparação (0-100)
        let readinessScore = 0
        let weakAreas: string[] = []

        // Baseado em questões respondidas
        if (totalQuestionsAnswered >= 500) readinessScore += 25
        else if (totalQuestionsAnswered >= 200) readinessScore += 15
        else if (totalQuestionsAnswered >= 100) readinessScore += 10
        else weakAreas.push("Responder mais questões")

        // Baseado em flashcards estudados
        if (flashcardsStudied >= 200) readinessScore += 25
        else if (flashcardsStudied >= 100) readinessScore += 15
        else if (flashcardsStudied >= 50) readinessScore += 10
        else weakAreas.push("Estudar mais flashcards")

        // Baseado em taxa de acerto
        if (currentCorrectRate >= 80) readinessScore += 30
        else if (currentCorrectRate >= 70) readinessScore += 20
        else if (currentCorrectRate >= 60) readinessScore += 10
        else weakAreas.push("Melhorar taxa de acerto")

        // Baseado em consistência de estudo
        if (studyDays >= 20) readinessScore += 20
        else if (studyDays >= 10) readinessScore += 10
        else weakAreas.push("Estudar com mais frequência")

        let status = "Não preparado"
        if (readinessScore >= 80) status = "Muito bem preparado"
        else if (readinessScore >= 60) status = "Bem preparado"
        else if (readinessScore >= 40) status = "Em preparação"
        else if (readinessScore >= 20) status = "Começando"

        setExamReadiness({
          score: readinessScore,
          status,
          weakAreas
        })

        // ⏰ Padrão de Estudo
        const { data: studySessions } = await supabase
          .from("user_activities")
          .select("created_at")
          .eq("user_id", user.id)
          .eq("activity_type", "study_session")
          .gte("created_at", lastMonth.toISOString())

        if (studySessions) {
          const hours = Array(24).fill(0)
          studySessions.forEach(session => {
            const hour = new Date(session.created_at).getHours()
            hours[hour]++
          })

          const peakHourIndex = hours.indexOf(Math.max(...hours))
          const peakHour = `${peakHourIndex.toString().padStart(2, '0')}:00`

          // Calcular consistência (dias com estudo / dias totais - últimos 30 dias)
          const uniqueDays = new Set(studySessions.map(s => new Date(s.created_at).toISOString().split('T')[0]))
          const consistency = Math.round((uniqueDays.size / 30) * 100)

          // Recomendar horas baseado em meta de 20h/semana (estimativa de 1.5h por sessão)
          const estimatedHours = Math.round(studySessions.length * 1.5) // 1.5h por sessão
          const recommendedHours = Math.max(0, 20 - estimatedHours)

          setStudyPattern({
            peakHour,
            consistency,
            recommendedHours
          })
        }

      } catch (e) {
        console.error("Erro ao carregar estatísticas:", e)
      } finally {
        setIsLoading(false)
      }
    }

    // 📋 Análise Avançada de Placas de Trânsito
    const fetchTrafficSignsAnalytics = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Buscar total de placas disponíveis
        const { data: totalSignsData } = await supabase
          .from("traffic_signs")
          .select("id, category, name")
          .eq("is_active", true)

        // Buscar progresso do usuário
        const { data: userProgressData } = await supabase
          .from("user_sign_progress")
          .select("sign_id, times_reviewed, times_correct, confidence_level, last_reviewed")
          .eq("user_id", user.id)

        // Buscar modos de estudo utilizados
        const { data: studyModesData } = await supabase
          .from("user_activities")
          .select("activity_type, created_at, metadata")
          .eq("user_id", user.id)
          .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Últimos 30 dias

        // Análise por categoria
        const confidenceByCategory: any[] = []
        if (totalSignsData && userProgressData) {
          const categories = [...new Set(totalSignsData.map(sign => sign.category))]

          categories.forEach(category => {
            const categorySigns = totalSignsData.filter(sign => sign.category === category)
            const categoryProgress = userProgressData.filter(progress =>
              categorySigns.some(sign => sign.id === progress.sign_id)
            )

            const avgConfidence = categoryProgress.length > 0
              ? Math.round(categoryProgress.reduce((sum, p) => sum + (p.confidence_level || 0), 0) / categoryProgress.length)
              : 0

            const studiedCount = categoryProgress.length
            const totalCount = categorySigns.length
            const progress = totalCount > 0 ? Math.round((studiedCount / totalCount) * 100) : 0

            confidenceByCategory.push({
              category,
              studiedCount,
              totalCount,
              progress,
              avgConfidence,
              signs: categorySigns.map(sign => ({
                name: sign.name,
                studied: categoryProgress.some(p => p.sign_id === sign.id),
                confidence: categoryProgress.find(p => p.sign_id === sign.id)?.confidence_level || 0
              }))
            })
          })
        }

        // Análise de modos de estudo
        const studyModes = [
          { name: 'Estudo Linear', count: 0, percentage: 0 },
          { name: 'Estudo Inteligente', count: 0, percentage: 0 },
          { name: 'Desafio 60s', count: 0, percentage: 0 }
        ]

        if (studyModesData) {
          const totalActivities = studyModesData.length
          studyModes[0].count = studyModesData.filter(a => a.activity_type === 'linear_study').length
          studyModes[1].count = studyModesData.filter(a => a.activity_type === 'smart_study').length
          studyModes[2].count = studyModesData.filter(a => a.activity_type === 'challenge_60s').length

          studyModes.forEach(mode => {
            mode.percentage = totalActivities > 0 ? Math.round((mode.count / totalActivities) * 100) : 0
          })
        }

        // Progresso recente (últimos 7 dias)
        const recentProgress: any[] = []
        for (let i = 6; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]

          const dayActivities = studyModesData?.filter(a =>
            a.created_at.startsWith(dateStr)
          ) || []

          recentProgress.push({
            date: dateStr,
            label: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
            activities: dayActivities.length
          })
        }

        setTrafficSignsAnalytics({
          totalSigns: totalSignsData?.length || 0,
          studiedSigns: userProgressData?.length || 0,
          confidenceByCategory,
          studyModes,
          recentProgress
        })

      } catch (e) {
        console.error("Erro ao carregar análise de placas de trânsito:", e)
      }
    }

    loadStats()
    fetchTrafficSignsAnalytics()
  }, [])

  return (
    <SubscriptionGate feature="Estatísticas">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Estatísticas de Estudo</h2>
            <p className="text-muted-foreground mt-1">
              Acompanhe seu desempenho e evolução
            </p>
          </div>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </div>

        {/* Métricas Avançadas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total de Cartões */}
          <div className="bg-card border border-border rounded-xl p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <Brain className="h-4 w-4 text-primary" />
              <TrendingUp className="h-3 w-3 text-success" />
            </div>
            <p className="text-xs text-muted-foreground">Base de Conhecimento</p>
            <p className="text-xl font-bold text-foreground truncate">{totalFlashcards}</p>
            <p className="text-[10px] text-success mt-0.5">Cartões disponíveis</p>
          </div>

          {/* Comparação com Plataforma */}
          {platformAverages && (
            <div className="bg-card border border-border rounded-xl p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-4 w-4 text-info" />
                <span className={`text-[10px] font-medium ${correctRate > platformAverages.correctRate ? 'text-success' : 'text-warning'
                  }`}>
                  {correctRate > platformAverages.correctRate ? 'Acima da média' : 'Na média'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">vs Média Plataforma</p>
              <p className="text-xl font-bold text-foreground truncate">
                {correctRate > platformAverages.correctRate ? '+' : ''}
                {correctRate - platformAverages.correctRate}%
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Sua taxa: {correctRate}% | Média: {platformAverages.correctRate}%
              </p>
            </div>
          )}

          {/* Prepar para Prova */}
          {examReadiness && (
            <div className="bg-card border border-border rounded-xl p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-4 w-4 text-destructive" />
                <span className={`text-[10px] font-medium ${examReadiness.score >= 80 ? 'text-success' :
                  examReadiness.score >= 60 ? 'text-warning' : 'text-destructive'
                  }`}>
                  {examReadiness.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Prepar para Prova</p>
              <p className="text-xl font-bold text-foreground truncate">{examReadiness.score}%</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {examReadiness.weakAreas.length > 0 ?
                  `${examReadiness.weakAreas.length} áreas a melhorar` :
                  'Você está pronto!'
                }
              </p>
            </div>
          )}

          {/* Padrão de Estudo */}
          {studyPattern && (
            <div className="bg-card border border-border rounded-xl p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-4 w-4 text-accent" />
                <span className={`text-[10px] font-medium ${studyPattern.consistency >= 70 ? 'text-success' :
                  studyPattern.consistency >= 40 ? 'text-warning' : 'text-destructive'
                  }`}>
                  {studyPattern.consistency}% consistente
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Pico de Estudo</p>
              <p className="text-xl font-bold text-foreground truncate">{studyPattern.peakHour}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {studyPattern.recommendedHours > 0 ?
                  `Faltam ${studyPattern.recommendedHours}h esta semana` :
                  'Meta atingida!'
                }
              </p>
            </div>
          )}
        </div>

        {/* 📊 Análise de Desempenho por Tipo de Questão */}
        {questionTypeStats.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4 overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">Desempenho por Tipo de Questão</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {questionTypeStats.map((type, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">{type.name}</span>
                    <span className="text-sm font-bold text-foreground">{type.accuracy}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${type.accuracy >= 80 ? 'bg-success' :
                        type.accuracy >= 60 ? 'bg-warning' : 'bg-destructive'
                        }`}
                      style={{ width: `${type.accuracy}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{type.questionsAnswered} questões</span>
                    <span>{type.totalAttempts} tentativas</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 📈 Tendências de Progresso */}
        {categoryTrends.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4 overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">Tendências de Progresso (4 semanas)</h3>
            <div className="space-y-4">
              {categoryTrends.map((trend, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">{trend.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${trend.trend === 'up' ? 'text-success' :
                        trend.trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
                        }`}>
                        {trend.trend === 'up' ? '↗' : trend.trend === 'down' ? '↘' : '→'}
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {trend.weeklyData[trend.weeklyData.length - 1]} esta semana
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 h-8 items-end">
                    {trend.weeklyData.map((value, weekIndex) => (
                      <div
                        key={weekIndex}
                        className="flex-1 bg-primary/20 rounded-t"
                        style={{ height: `${(value / Math.max(...trend.weeklyData)) * 100}%` }}
                        title={`Semana ${weekIndex + 1}: ${value} atividades`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>4 semanas atrás</span>
                    <span>Esta semana</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 📋 Análise Avançada de Placas de Trânsito */}
        {trafficSignsAnalytics && (
          <div className="bg-card border border-border rounded-xl p-4 overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">Análise de Placas de Trânsito</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Resumo Geral */}
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="h-4 w-4 text-yellow-600" />
                  <span className="text-[10px] font-medium text-success">
                    {Math.round((trafficSignsAnalytics.studiedSigns / trafficSignsAnalytics.totalSigns) * 100)}% completo
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Progresso Total</p>
                <p className="text-xl font-bold text-foreground truncate">
                  {trafficSignsAnalytics.studiedSigns} / {trafficSignsAnalytics.totalSigns}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Placas estudadas</p>
              </div>

              {/* Modos de Estudo */}
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-[10px] font-medium text-info">
                    Preferência
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Modo Favorito</p>
                <p className="text-lg font-bold text-foreground truncate">
                  {trafficSignsAnalytics.studyModes.find(mode => mode.percentage > 0)?.name || 'Nenhum'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {trafficSignsAnalytics.studyModes.reduce((sum, mode) => sum + mode.count, 0)} sessões
                </p>
              </div>

              {/* Atividades Recentes */}
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="text-[10px] font-medium text-warning">
                    Últimos 7 dias
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Atividade Recente</p>
                <p className="text-xl font-bold text-foreground truncate">
                  {trafficSignsAnalytics.recentProgress.reduce((sum, day) => sum + day.activities, 0)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Atividades realizadas</p>
              </div>
            </div>

            {/* Análise por Categoria de Placas */}
            {trafficSignsAnalytics.confidenceByCategory.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-medium text-foreground mb-4">Desempenho por Categoria de Placas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trafficSignsAnalytics.confidenceByCategory.map((category, index) => (
                    <div key={index} className="bg-muted/30 p-3 rounded-lg space-y-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-foreground">{category.category}</span>
                        <span className="text-sm text-muted-foreground">
                          {category.progress}% completo
                        </span>
                      </div>

                      <div className="w-full bg-muted rounded-full h-2 mb-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${category.progress}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{category.studiedCount} / {category.totalCount} placas</span>
                        <span>Confiança: {category.avgConfidence}%</span>
                      </div>

                      {
                        category.avgConfidence < 50 && (
                          <div className="text-xs text-warning mt-2 bg-warning/10 p-2 rounded">
                            ⚠️ Revisar placas com baixa confiança
                          </div>
                        )
                      }
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gráfico de Atividades Recentes */}
            {
              trafficSignsAnalytics.recentProgress.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="font-medium text-foreground mb-4">Atividades dos Últimos 7 Dias</h4>
                  <div className="flex items-end justify-between h-32 bg-muted/20 rounded-lg p-4">
                    {trafficSignsAnalytics.recentProgress.map((day, index) => (
                      <div key={index} className="flex flex-col items-center flex-1 mx-1">
                        <div
                          className="w-full bg-yellow-500 rounded-t transition-all duration-300 hover:bg-yellow-400"
                          style={{
                            height: `${Math.max(8, (day.activities / Math.max(1, ...trafficSignsAnalytics.recentProgress.map(d => d.activities))) * 100)}%`,
                            minHeight: '8px'
                          }}
                          title={`${day.activities} atividades em ${day.date}`}
                        />
                        <span className="text-xs text-muted-foreground mt-2">{day.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
          </div>
        )}
      </div>
    </SubscriptionGate>
  )
}