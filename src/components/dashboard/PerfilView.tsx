import { User, Mail, Calendar, Trophy, BookOpen, Target } from "lucide-react"
import { useActivePass } from "@/hooks/useActivePass"

interface PerfilViewProps {
  user: any
  profile: any
}

export const PerfilView = ({ user, profile }: PerfilViewProps) => {
  const { hasActivePass, activePass } = useActivePass(user?.id)
  
  const successRate = profile?.total_questions_answered 
    ? Math.round((profile.correct_answers / profile.total_questions_answered) * 100)
    : 0

  const getPlanDisplay = () => {
    if (hasActivePass && activePass) {
      const daysRemaining = Math.ceil((new Date(activePass.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      const planType = activePass.pass_type === 'family_90_days' ? 'Família' : 
                      activePass.pass_type === '90_days' ? 'Premium 90 dias' : 'Premium 30 dias'
      return `${planType} (${daysRemaining}d restantes)`
    }
    return 'Plano Gratuito'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Meu Perfil</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie suas informações e acompanhe seu progresso
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <User className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-1">
                {profile?.full_name || "Estudante"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Plano Gratuito
              </p>
              <button 
                onClick={() => window.location.href = "/#preço"}
                className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Ver Planos
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-border space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">
                  Membro desde Nov 2024
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Estatísticas de Estudo
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-primary/5 rounded-lg">
                <BookOpen className="h-6 w-6 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Flashcards</p>
                <p className="text-2xl font-bold text-foreground">
                  {profile?.total_flashcards_studied || 0}
                </p>
              </div>
              <div className="p-4 bg-success/5 rounded-lg">
                <Target className="h-6 w-6 text-success mb-2" />
                <p className="text-sm text-muted-foreground">Questões</p>
                <p className="text-2xl font-bold text-foreground">
                  {profile?.total_questions_answered || 0}
                </p>
              </div>
              <div className="p-4 bg-secondary/5 rounded-lg">
                <Trophy className="h-6 w-6 text-secondary mb-2" />
                <p className="text-sm text-muted-foreground">Taxa de Acerto</p>
                <p className="text-2xl font-bold text-foreground">{successRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Informações da Conta
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Nome Completo
                </label>
                <input
                  type="text"
                  defaultValue={profile?.full_name || ""}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Seu nome completo"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-muted-foreground cursor-not-allowed"
                />
              </div>
              <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
                Salvar Alterações
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Preferências
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Notificações de Estudo</p>
                  <p className="text-sm text-muted-foreground">
                    Receba lembretes para estudar
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Email Semanal</p>
                  <p className="text-sm text-muted-foreground">
                    Receba resumo semanal do seu progresso
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
