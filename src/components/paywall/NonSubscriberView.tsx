import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Lock, Trophy, Play, History, Calendar, Award } from "lucide-react"
import { analytics } from "@/utils/studyAnalytics"
import { useNavigate } from "react-router-dom"

interface NonSubscriberViewProps {
  feature?: string
}

export const NonSubscriberView = ({ feature }: NonSubscriberViewProps) => {
  const navigate = useNavigate()

  const handleCTA = () => {
    analytics.trackEvent("cta", "click", "pricing")
    navigate("/", { state: { scrollTo: "preço" } })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">{feature || "Recursos Premium"}</h2>
        <p className="text-muted-foreground mt-1">Assine para desbloquear todo o conteúdo</p>
      </div>

      <Card className="shadow-lg border-2 border-primary/20 bg-muted/30">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Lock className="h-10 w-10 text-primary" />
          </div>

          <h3 className="text-2xl font-bold mb-3">Conteúdo bloqueado</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Torne-se assinante para acessar simulados, flashcards, estatísticas e mais.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="bg-card border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-4">
                <div className="text-primary font-semibold mb-2">Passaporte 30 Dias</div>
                <div className="text-2xl font-bold mb-1">R$ 29,90</div>
                <div className="text-sm text-muted-foreground">O Apressado</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-2 border-primary shadow-md">
              <CardContent className="p-4">
                <div className="text-primary font-semibold mb-2">Passaporte 90 Dias</div>
                <div className="text-2xl font-bold mb-1">R$ 79,90</div>
                <div className="text-sm text-muted-foreground">O Garantido ⭐</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-4">
                <div className="text-primary font-semibold mb-2">Passaporte Família</div>
                <div className="text-2xl font-bold mb-1">R$ 84,90</div>
                <div className="text-sm text-muted-foreground">Para 2 Pessoas</div>
              </CardContent>
            </Card>
          </div>

          <Button onClick={handleCTA} size="lg" className="bg-primary hover:bg-primary/90">
            Ver Planos
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardContent className="p-6">
          <h4 className="font-semibold mb-3">Você terá acesso a:</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><Trophy className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" /><span>Simulados Oficiais ilimitados</span></li>
            <li className="flex items-start gap-2"><Play className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" /><span>Simulados de Prática ilimitados</span></li>
            <li className="flex items-start gap-2"><History className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" /><span>Histórico completo e evolução</span></li>
            <li className="flex items-start gap-2"><Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" /><span>Sala de Estudos com acompanhamento</span></li>
            <li className="flex items-start gap-2"><Award className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" /><span>Conquistas e biblioteca completa de placas</span></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}