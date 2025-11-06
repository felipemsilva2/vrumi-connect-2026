import { Check } from "lucide-react"
import { useNavigate } from "react-router-dom"

const PricingSection = () => {
  const navigate = useNavigate()

  const plans = [
    {
      name: "Acesso Gratuito",
      price: "R$ 0",
      period: "sempre",
      features: [
        "Todos os materiais de estudo",
        "Flashcards ilimitados",
        "Estatísticas de progresso",
        "Acesso limitado aos simulados"
      ],
      buttonText: "Começar Grátis",
      popular: false,
      badge: "Explore a plataforma"
    },
    {
      name: "Passaporte 30 Dias",
      price: "R$ 29,90",
      period: "pagamento único",
      features: [
        "Tudo do Acesso Gratuito",
        "Simulados DETRAN ilimitados",
        "30 dias de acesso total",
        "Ideal para quem já marcou a prova",
        "Sprint final de estudos"
      ],
      buttonText: "Comprar Agora",
      popular: false,
      badge: "O Apressado"
    },
    {
      name: "Passaporte 90 Dias",
      price: "R$ 49,90",
      period: "pagamento único",
      features: [
        "Tudo do Acesso Gratuito",
        "Simulados DETRAN ilimitados",
        "90 dias de acesso total",
        "Estude no seu ritmo, sem pressão",
        "Cobre todo processo até a prova",
        "Melhor custo-benefício"
      ],
      buttonText: "Garantir Acesso",
      popular: true,
      badge: "O Garantido"
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
            Não é assinatura. É tempo de acesso. Você compra, você sabe exatamente quanto tempo tem.
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
              {(plan.popular || plan.badge) && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className={`px-4 py-1 rounded-full text-sm font-medium ${
                    plan.popular 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground border border-border"
                  }`}>
                    {plan.popular ? "Mais Popular" : plan.badge}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
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
                onClick={() => navigate("/auth")}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  plan.popular
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-card border border-border text-foreground hover:bg-muted"
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-muted-foreground mt-12 text-sm">
          💡 Reprovar faz parte do processo! Se precisar, basta comprar um novo passaporte quando estiver pronto novamente.
        </p>
      </div>
    </section>
  )
}

export default PricingSection
