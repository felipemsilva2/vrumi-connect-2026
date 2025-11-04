import { BarChart3, TrendingUp, Calendar, Award } from "lucide-react"

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

  const maxHours = Math.max(...weekData.map(d => d.hours))

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
