import { Trophy, Award, Star, Zap, Target, BookOpen, Calendar, TrendingUp } from "lucide-react"
import { SubscriptionGate } from "@/components/auth/SubscriptionGate"

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
    <SubscriptionGate feature="Conquistas">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Conquistas</h2>
            <p className="text-muted-foreground mt-1">
              {unlockedCount} de {totalCount} conquistas desbloqueadas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-foreground">{unlockedCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Award className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Conclusão</p>
                <p className="text-xl font-bold text-foreground">
                  {Math.round((unlockedCount / totalCount) * 100)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Star className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pontos</p>
                <p className="text-xl font-bold text-foreground">
                  {unlockedCount * 100}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {conquistas.map((conquista) => {
            const Icon = conquista.icon
            return (
              <div
                key={conquista.id}
                className={`bg-card border rounded-xl p-4 transition-all ${conquista.unlocked
                    ? "border-primary/50 shadow-sm"
                    : "border-border opacity-75"
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${conquista.unlocked
                        ? "bg-primary/10"
                        : "bg-muted"
                      }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${conquista.unlocked ? "text-primary" : "text-muted-foreground"
                        }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3
                        className={`font-semibold text-sm truncate pr-2 ${conquista.unlocked ? "text-foreground" : "text-muted-foreground"
                          }`}
                      >
                        {conquista.title}
                      </h3>
                      {conquista.unlocked && (
                        <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-success/10 text-success rounded-full">
                          Desbloqueada
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {conquista.description}
                    </p>

                    {conquista.unlocked ? (
                      <p className="text-[10px] text-muted-foreground">
                        {conquista.date}
                      </p>
                    ) : conquista.progress !== undefined ? (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-muted-foreground">Progresso</span>
                          <span className="text-[10px] font-medium text-foreground">
                            {conquista.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-300"
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
    </SubscriptionGate>
  )
}
