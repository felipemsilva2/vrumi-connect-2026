import { useState } from "react"
import { Target, Play, Clock, Award, CheckCircle2 } from "lucide-react"

const simuladosData = [
  {
    id: 1,
    title: "Simulado Geral - Básico",
    questions: 30,
    duration: 30,
    difficulty: "Fácil",
    completed: true,
    score: 85
  },
  {
    id: 2,
    title: "Simulado de Legislação",
    questions: 20,
    duration: 20,
    difficulty: "Médio",
    completed: true,
    score: 78
  },
  {
    id: 3,
    title: "Simulado Completo",
    questions: 40,
    duration: 40,
    difficulty: "Difícil",
    completed: false
  },
  {
    id: 4,
    title: "Simulado de Sinalização",
    questions: 25,
    duration: 25,
    difficulty: "Médio",
    completed: false
  }
]

export const SimuladosView = () => {
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all")

  const filteredSimulados = simuladosData.filter(sim => {
    if (filter === "completed") return sim.completed
    if (filter === "pending") return !sim.completed
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Simulados</h2>
          <p className="text-muted-foreground mt-1">
            Pratique com questões semelhantes às da prova oficial
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-foreground hover:bg-muted"
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "pending"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-foreground hover:bg-muted"
          }`}
        >
          Pendentes
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "completed"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-foreground hover:bg-muted"
          }`}
        >
          Concluídos
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSimulados.map((simulado) => (
          <div
            key={simulado.id}
            className="bg-card border border-border rounded-xl p-6 hover:shadow-card transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${
                  simulado.completed 
                    ? "bg-success/10" 
                    : "bg-primary/10"
                }`}>
                  {simulado.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  ) : (
                    <Target className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{simulado.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    simulado.difficulty === "Fácil"
                      ? "bg-success/10 text-success"
                      : simulado.difficulty === "Médio"
                      ? "bg-secondary/10 text-secondary"
                      : "bg-destructive/10 text-destructive"
                  }`}>
                    {simulado.difficulty}
                  </span>
                </div>
              </div>
              {simulado.completed && (
                <div className="flex items-center gap-1 text-success">
                  <Award className="h-5 w-5" />
                  <span className="font-bold">{simulado.score}%</span>
                </div>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Target className="h-4 w-4" />
                <span>{simulado.questions} questões</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="h-4 w-4" />
                <span>{simulado.duration} minutos</span>
              </div>
            </div>

            <button className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2">
              <Play className="h-4 w-4" />
              {simulado.completed ? "Refazer" : "Iniciar"}
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Simulados Feitos</h4>
          <p className="text-2xl font-bold text-primary">
            {simuladosData.filter(s => s.completed).length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Média de Acertos</h4>
          <p className="text-2xl font-bold text-success">82%</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Melhor Resultado</h4>
          <p className="text-2xl font-bold text-secondary">95%</p>
        </div>
      </div>
    </div>
  )
}
