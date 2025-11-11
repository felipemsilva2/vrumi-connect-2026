import { Check } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

const PricingSection = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const handlePurchase = async (passType: string) => {
    setLoading(passType)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Faça login primeiro",
          description: "Você precisa estar logado para comprar um passaporte",
        })
        navigate("/auth")
        return
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          passType: passType,
          secondUserEmail: null,
        },
      })

      if (error) throw error

      if (!data?.url) {
        throw new Error('URL de checkout não recebida')
      }

      window.open(data.url, '_blank')
    } catch (error) {
      console.error('Erro ao criar checkout:', error)
      toast({
        title: "Erro ao processar pagamento",
        description: "Ocorreu um erro ao iniciar o pagamento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const plans = [
    {
      name: "Passaporte Família",
      subtitle: "Para 2 Pessoas",
      price: "R$ 84,90",
      period: "pagamento único",
      features: [
        "2 contas individuais incluídas",
        "90 dias de acesso total por pessoa",
        "Simulados oficiais ilimitados",
        "Flashcards e estatísticas completas",
        "Progresso individual para cada um",
        "Economia de R$ 14,90"
      ],
      buttonText: "Comprar para Família",
      popular: false,
      description: "Perfeito para irmãos, casais ou amigos que vão tirar a CNH juntos",
      passType: "family_90_days"
    },
    {
      name: "Passaporte 30 Dias",
      subtitle: "O Apressado",
      price: "R$ 29,90",
      period: "pagamento único",
      features: [
        "Tudo do Acesso Gratuito",
        "Simulados oficiais ilimitados",
        "Simulados de prática",
        "Histórico completo de tentativas",
        "30 dias de acesso total"
      ],
      buttonText: "Comprar Passaporte",
      popular: false,
      description: "Ideal para quem já marcou a prova e quer um sprint final de estudos",
      passType: "individual_30_days"
    },
    {
      name: "Passaporte 90 Dias",
      subtitle: "O Garantido",
      price: "R$ 79,90",
      period: "pagamento único",
      features: [
        "Tudo do Acesso Gratuito",
        "Simulados oficiais ilimitados",
        "Simulados de prática",
        "Histórico completo de tentativas",
        "90 dias de acesso total",
        "Melhor custo-benefício"
      ],
      buttonText: "Comprar Passaporte",
      popular: true,
      description: "Estude no seu ritmo, sem pressão. Cobre todo o seu processo, da primeira aula ao dia da prova",
      passType: "individual_90_days"
    }
  ]

  return (
    <section id="preço" className="py-20 px-4 bg-muted">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Passaportes de Acesso
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Não é assinatura, é tempo de acesso. Compre uma vez, estude até passar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-card border rounded-2xl p-8 transition-all hover:shadow-elegant ${
                plan.popular
                  ? "border-primary shadow-card scale-105"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Mais Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {plan.name}
                </h3>
                {plan.subtitle && (
                  <p className="text-sm text-muted-foreground font-medium mb-3">
                    {plan.subtitle}
                  </p>
                )}
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
                {plan.description && (
                  <p className="text-sm text-muted-foreground mt-4 italic">
                    "{plan.description}"
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => plan.passType && handlePurchase(plan.passType)}
                disabled={loading === plan.passType}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  plan.popular
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-card border border-border text-foreground hover:bg-muted"
                } ${loading === plan.passType ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading === plan.passType ? "Processando..." : plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 space-y-2">
          <p className="text-muted-foreground text-sm">
            💡 <strong>Honestidade Total:</strong> Você sabe exatamente o que está comprando. Sem renovação automática.
          </p>
          <p className="text-muted-foreground text-sm">
            ✅ Reprovou? Simples! Compre um novo passaporte e continue estudando.
          </p>
        </div>
      </div>
    </section>
  )
}

export default PricingSection
