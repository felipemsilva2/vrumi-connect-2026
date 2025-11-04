import { Trophy, Award, Star, Zap, Target, BookOpen, Calendar, TrendingUp } from "lucide-react"

const conquistas = [
  {
    id: 1,
    title: "Primeiro Passo",
    description: "Complete seu primeiro flashcard",
    icon: BookOpen,
    unlocked: true,
    date: "15 Nov 2024"
  },
  {
    id: 2,
    title: "Estudante Dedicado",
    description: "Estude por 7 dias consecutivos",
    icon: Calendar,
    unlocked: true,
    date: "20 Nov 2024"
  },
  {
    id: 3,
    title: "Expert em Legislação",
    description: "Complete 100% da categoria Legislação",
    icon: Award,
    unlocked: false,
    progress: 78
  },
  {
    id: 4,
    title: "Mestre dos Simulados",
    description: "Complete 10 simulados com 80%+ de acerto",
    icon: Target,
    unlocked: false,
    progress: 40
  },
  {
    id: 5,
    title: "Velocista",
    description: "Responda 50 questões em um dia",
    icon: Zap,
    unlocked: true,
    date: "18 Nov 2024"
  },
  {
    id: 6,
    title: "Perfeccionista",
    description: "Acerte 100% em um simulado completo",
    icon: Star,
    unlocked: false,
    progress: 95
  },
  {
    id: 7,
    title: "Maratonista",
    description: "Estude por 30 dias consecutivos",
    icon: TrendingUp,
    unlocked: false,
    progress: 23
  },
  {
    id: 8,
    title: "Campeão",
    description: "Complete todos os simulados disponíveis",
    icon: Trophy,
    unlocked: false,
    progress: 50
  }
]

export const ConquistasView = () => {
  const unlockedCount = conquistas.filter(c => c.unlocked).length
  const totalCount = conquistas.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Conquistas</h2>
          <p className="text-muted-foreground mt-1">
            {unlockedCount} de {totalCount} conquistas desbloqueadas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <Trophy className="h-8 w-8 text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Total de Conquistas</p>
          <p className="text-3xl font-bold text-foreground">{unlockedCount}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <Award className="h-8 w-8 text-success mb-2" />
          <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
          <p className="text-3xl font-bold text-foreground">
            {Math.round((unlockedCount / totalCount) * 100)}%
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <Star className="h-8 w-8 text-secondary mb-2" />
          <p className="text-sm text-muted-foreground">Pontos Totais</p>
          <p className="text-3xl font-bold text-foreground">
            {unlockedCount * 100}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {conquistas.map((conquista) => {
          const Icon = conquista.icon
          return (
            <div
              key={conquista.id}
              className={`bg-card border rounded-xl p-6 transition-all ${
                conquista.unlocked
                  ? "border-primary shadow-card"
                  : "border-border opacity-75"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-xl ${
                    conquista.unlocked
                      ? "bg-primary/10"
                      : "bg-muted"
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 ${
                      conquista.unlocked ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3
                      className={`font-semibold ${
                        conquista.unlocked ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {conquista.title}
                    </h3>
                    {conquista.unlocked && (
                      <span className="px-2 py-1 text-xs font-medium bg-success/10 text-success rounded-full">
                        Desbloqueada
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {conquista.description}
                  </p>

                  {conquista.unlocked ? (
                    <p className="text-xs text-muted-foreground">
                      Desbloqueada em {conquista.date}
                    </p>
                  ) : conquista.progress !== undefined ? (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">Progresso</span>
                        <span className="text-xs font-medium text-foreground">
                          {conquista.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${conquista.progress}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
