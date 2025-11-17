import { BarChart3, TrendingUp, Calendar, Award, Loader2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/integrations/supabase/client"

export const EstatisticasView = () => {
  const [weekData, setWeekData] = useState([
    { day: "Seg", hours: 0, questions: 0 },
    { day: "Ter", hours: 0, questions: 0 },
    { day: "Qua", hours: 0, questions: 0 },
    { day: "Qui", hours: 0, questions: 0 },
    { day: "Sex", hours: 0, questions: 0 },
    { day: "Sáb", hours: 0, questions: 0 },
    { day: "Dom", hours: 0, questions: 0 }
  ])

  const [categoryProgress, setCategoryProgress] = useState([
    { name: "Meio Ambiente e Convívio Social", progress: 0, color: "primary", module_code: "PMAC" },
    { name: "Direção Defensiva", progress: 0, color: "success", module_code: "DD" },
    { name: "Legislação de Trânsito", progress: 0, color: "secondary", module_code: "LT" },
    { name: "Mecânica Básica", progress: 0, color: "accent", module_code: "NFV" },
    { name: "Primeiros Socorros", progress: 0, color: "destructive", module_code: "PS" }
  ])

  const [totalFlashcards, setTotalFlashcards] = useState(0)
  const [totalHours, setTotalHours] = useState(0)
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
  const maxHours = Math.max(...weekData.map(d => d.hours))

  // Função para calcular sequência de dias (streak)
  const calculateStreak = (activities: { study_date: string }[]) => {
    if (!activities || activities.length === 0) return 0
    
    // Ordenar por data decrescente
    const sortedActivities = activities.sort((a, b) => 
      new Date(b.study_date).getTime() - new Date(a.study_date).getTime()
    )
    
    let streak = 0
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)
    
    for (const activity of sortedActivities) {
      const activityDate = new Date(activity.study_date)
      activityDate.setHours(0, 0, 0, 0)
      
      const diffDays = Math.floor((currentDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays === streak) {
        streak++
      } else {
        break
      }
      
      // Se a diferença for maior que o streak atual, quebrar a sequência
      if (diffDays > streak) break
    }
    
    return streak
  }

  // Removido: efeito e estados de métricas SRS (due_date, ease_factor)
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
        if (profileRow) {
          setProfileStats(profileRow)
        }

        // Buscar dados da semana atual (últimos 7 dias)
        const today = new Date()
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        
        // Buscar progresso por módulo/categoria
        const { data: modules } = await supabase
          .from("study_modules")
          .select("id, code, title")
        
        if (modules) {
          const moduleProgress = await Promise.all(
            modules.map(async (module) => {
              // Total de capítulos no módulo
              const { data: totalChapters } = await supabase
                .from("study_chapters")
                .select("id")
                .eq("module_id", module.id)
              
              // Capítulos completados pelo usuário
              const { data: completedChapters } = await supabase
                .from("user_progress")
                .select("id")
                .eq("user_id", user.id)
                .eq("completed", true)
              
              const total = totalChapters?.length || 0
              const completed = completedChapters?.length || 0
              const progress = total > 0 ? Math.round((completed / total) * 100) : 0
              
              const colorMap: { [key: string]: string } = {
                'PMAC': 'primary',
                'DD': 'success', 
                'LT': 'secondary',
                'NFV': 'accent',
                'PS': 'destructive'
              }
              
              return {
                name: module.title,
                progress,
                color: colorMap[module.code] || 'primary',
                module_code: module.code
              }
            })
          )
          
          setCategoryProgress(moduleProgress.filter(m => m.progress > 0))
        }

        // Buscar tentativas de quiz da semana
        const { data: quizAttempts } = await supabase
          .from("user_quiz_attempts")
          .select("completed_at, correct_answers, total_questions")
          .eq("user_id", user.id)
          .gte("completed_at", lastWeek.toISOString())

        // Processar dados por dia da semana
        const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
        const weekDataProcessed = weekDays.map((day, index) => {
          const dayStart = new Date(today)
          dayStart.setDate(today.getDate() - (6 - index))
          dayStart.setHours(0, 0, 0, 0)
          
          const dayEnd = new Date(dayStart)
          dayEnd.setHours(23, 59, 59, 999)
          
          const dayAttempts = quizAttempts?.filter(attempt => {
            const attemptDate = new Date(attempt.completed_at)
            return attemptDate >= dayStart && attemptDate <= dayEnd
          }) || []
          
          const questions = dayAttempts.reduce((sum, attempt) => sum + attempt.total_questions, 0)
          // Estimar horas baseado em 2 minutos por questão + tempo de revisão
          const hours = Math.round((questions * 2 + (questions > 0 ? 30 : 0)) / 60 * 10) / 10
          
          return {
            day,
            hours,
            questions
          }
        })
        
        setWeekData(weekDataProcessed)

        // Calcular total de horas
        const totalHoursCalc = weekDataProcessed.reduce((sum, day) => sum + day.hours, 0)
        setTotalHours(totalHoursCalc)

        // Calcular sequência de dias (simplificado - baseado em dias com atividade)
        const allAttempts = await supabase
          .from("user_quiz_attempts")
          .select("completed_at")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false })

        if (allAttempts.data) {
          const uniqueDays = new Set(
            allAttempts.data.map(attempt => 
              new Date(attempt.completed_at).toISOString().split('T')[0]
            )
          )
          setTotalStudyDays(uniqueDays.size)
          
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

      } catch (e) {
        console.error("Erro ao carregar estatísticas:", e)
      } finally {
        setIsLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
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

      {/* Métricas Básicas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="h-5 w-5 text-primary" />
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="text-sm text-muted-foreground">Total de Cartões</p>
          <p className="text-2xl font-bold text-foreground">{totalFlashcards}</p>
          <p className="text-xs text-success mt-1">Dados atuais</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="h-5 w-5 text-success" />
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="text-sm text-muted-foreground">Flashcards Estudados</p>
          <p className="text-2xl font-bold text-foreground">{profileStats?.total_flashcards_studied || 0}</p>
          <p className="text-xs text-success mt-1">Com base no seu perfil</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <Award className="h-5 w-5 text-secondary" />
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="text-sm text-muted-foreground">Taxa de Acerto</p>
          <p className="text-2xl font-bold text-foreground">{`${correctRate}%`}</p>
          <p className="text-xs text-success mt-1">Com base em acertos/erros</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="text-sm text-muted-foreground">Progresso de Estudo</p>
          <p className="text-2xl font-bold text-foreground">{profileStats?.study_progress !== undefined && profileStats?.study_progress !== null ? `${profileStats?.study_progress}%` : "–"}</p>
          <p className="text-xs text-success mt-1">Meta de conclusão</p>
        </div>
      </div>

      {/* Progresso por Categoria */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="h-5 w-5 text-primary" />
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="text-sm text-muted-foreground">Dias de Estudo</p>
          <p className="text-2xl font-bold text-foreground">{totalStudyDays}</p>
          <p className="text-xs text-success mt-1">{totalStudyDays > 0 ? `${totalStudyDays} dias únicos` : "Comece a estudar!"}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="h-5 w-5 text-success" />
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="text-sm text-muted-foreground">Horas Totais</p>
          <p className="text-2xl font-bold text-foreground">{totalHours}h</p>
          <p className="text-xs text-success mt-1">Esta semana</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <Award className="h-5 w-5 text-secondary" />
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="text-sm text-muted-foreground">Taxa de Acerto</p>
          <p className="text-2xl font-bold text-foreground">{correctRate}%</p>
          <p className="text-xs text-success mt-1">Geral</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="text-sm text-muted-foreground">Sequência</p>
          <p className="text-2xl font-bold text-foreground">{studyStreak} dias</p>
          <p className="text-xs text-success mt-1">{studyStreak > 0 ? "Em progresso!" : "Comece hoje!"}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Atividade desta Semana</h3>
        <div className="space-y-4">
          <div className="flex items-end gap-2 h-40 sm:h-48">
            {weekData.map((data, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full bg-muted rounded-t-lg overflow-hidden" style={{ height: '100%' }}>
                  <div
                    className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all duration-300"
                    style={{ height: `${(data.hours / maxHours) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{data.day}</span>
                <span className="text-xs text-foreground font-semibold">{data.hours}h</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Progresso por Categoria</h3>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : categoryProgress.filter(m => m.progress > 0).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum progresso ainda. Comece a estudar para ver suas estatísticas!</p>
            </div>
          ) : (
            categoryProgress.filter(m => m.progress > 0).map((category, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">{category.name}</span>
                  <span className="text-sm font-bold text-foreground">{category.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      category.color === 'primary' ? 'bg-primary' :
                      category.color === 'success' ? 'bg-success' :
                      category.color === 'secondary' ? 'bg-secondary' :
                      category.color === 'accent' ? 'bg-accent' :
                      'bg-destructive'
                    }`}
                    style={{ width: `${category.progress}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
