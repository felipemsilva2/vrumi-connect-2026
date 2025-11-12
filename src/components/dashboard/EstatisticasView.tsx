import { BarChart3, TrendingUp, Calendar, Award } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/integrations/supabase/client"

export const EstatisticasView = () => {
  const weekData = [
    { day: "Seg", hours: 2.5, questions: 45 },
    { day: "Ter", hours: 1.8, questions: 32 },
    { day: "Qua", hours: 3.2, questions: 58 },
    { day: "Qui", hours: 2.1, questions: 38 },
    { day: "Sex", hours: 2.8, questions: 51 },
    { day: "Sáb", hours: 4.0, questions: 72 },
    { day: "Dom", hours: 3.5, questions: 63 }
  ]

  const categoryProgress = [
    { name: "Legislação de Trânsito", progress: 78, color: "primary" },
    { name: "Sinalização", progress: 65, color: "success" },
    { name: "Direção Defensiva", progress: 42, color: "secondary" },
    { name: "Primeiros Socorros", progress: 55, color: "accent" },
    { name: "Mecânica Básica", progress: 38, color: "destructive" },
    { name: "Meio Ambiente", progress: 82, color: "primary" }
  ]

  const [totalFlashcards, setTotalFlashcards] = useState(0)
  // Métricas básicas do perfil
  const [profileStats, setProfileStats] = useState<{ total_flashcards_studied: number; total_questions_answered: number; correct_answers: number; study_progress: number } | null>(null)
  const correctRate = useMemo(() => {
    const total = profileStats?.total_questions_answered || 0
    const correct = profileStats?.correct_answers || 0
    return total > 0 ? Math.round((correct / total) * 100) : 0
  }, [profileStats])
  const maxHours = Math.max(...weekData.map(d => d.hours))

  // Removido: efeito e estados de métricas SRS (due_date, ease_factor)
  useEffect(() => {
    const loadStats = async () => {
      try {
        // Total de flashcards (sem métricas SRS)
        const { data: flashcards, error: flashError } = await supabase
          .from("flashcards")
          .select("id")
        if (flashError) throw flashError
        setTotalFlashcards((flashcards || []).length)

        // Estatísticas básicas do perfil
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.id) {
          const { data: profileRow, error: profileError } = await supabase
            .from("profiles")
            .select("total_flashcards_studied,total_questions_answered,correct_answers,study_progress")
            .eq("id", user.id)
            .maybeSingle()
          if (profileError) throw profileError
          if (profileRow) {
            setProfileStats(profileRow as any)
          }
        }
      } catch (e) {
        console.error("Erro ao carregar estatísticas básicas:", e)
      }
    }
    loadStats()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Estatísticas de Estudo</h2>
          <p className="text-muted-foreground mt-1">
            Acompanhe seu desempenho e evolução
          </p>
        </div>
      </div>

      {/* Métricas Básicas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="h-5 w-5 text-primary" />
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="text-sm text-muted-foreground">Total de Cartões</p>
          <p className="text-2xl font-bold text-foreground">{totalFlashcards}</p>
          <p className="text-xs text-success mt-1">Dados atuais</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="h-5 w-5 text-success" />
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="text-sm text-muted-foreground">Flashcards Estudados</p>
          <p className="text-2xl font-bold text-foreground">{profileStats?.total_flashcards_studied || 0}</p>
          <p className="text-xs text-success mt-1">Com base no seu perfil</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Award className="h-5 w-5 text-secondary" />
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="text-sm text-muted-foreground">Taxa de Acerto</p>
          <p className="text-2xl font-bold text-foreground">{`${correctRate}%`}</p>
          <p className="text-xs text-success mt-1">Com base em acertos/erros</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="h-5 w-5 text-primary" />
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="text-sm text-muted-foreground">Dias de Estudo</p>
          <p className="text-2xl font-bold text-foreground">24</p>
          <p className="text-xs text-success mt-1">+3 esta semana</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="h-5 w-5 text-success" />
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="text-sm text-muted-foreground">Horas Totais</p>
          <p className="text-2xl font-bold text-foreground">48.5h</p>
          <p className="text-xs text-success mt-1">+12h esta semana</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Award className="h-5 w-5 text-secondary" />
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="text-sm text-muted-foreground">Taxa de Acerto</p>
          <p className="text-2xl font-bold text-foreground">82%</p>
          <p className="text-xs text-success mt-1">+5% este mês</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="text-sm text-muted-foreground">Sequência</p>
          <p className="text-2xl font-bold text-foreground">7 dias</p>
          <p className="text-xs text-success mt-1">Melhor: 12 dias</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Atividade desta Semana</h3>
        <div className="space-y-4">
          <div className="flex items-end gap-2 h-48">
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

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Progresso por Categoria</h3>
        <div className="space-y-4">
          {categoryProgress.map((category, i) => (
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
          ))}
        </div>
      </div>
    </div>
  )
}
