import { Check } from "lucide-react"
import { useNavigate } from "react-router-dom"

const PricingSection = () => {
  const navigate = useNavigate()

  const plans = [
    {
      name: "Plano Gratuito",
      price: "R$ 0",
      period: "para sempre",
      features: [
        "50 flashcards",
        "2 simulados",
        "Materiais básicos",
        "Estatísticas simples"
      ],
      buttonText: "Começar Grátis",
      popular: false
    },
    {
      name: "Plano Premium",
      price: "R$ 49,90",
      period: "por mês",
      features: [
        "Flashcards ilimitados",
        "Simulados ilimitados",
        "Todos os materiais",
        "Estatísticas avançadas",
        "Sistema de conquistas",
        "Suporte prioritário"
      ],
      buttonText: "Assinar Agora",
      popular: true
    },
    {
      name: "Plano Anual",
      price: "R$ 399,90",
      period: "por ano",
      features: [
        "Tudo do Premium",
        "2 meses grátis",
        "Certificado de conclusão",
        "Aulas ao vivo mensais",
        "Grupo exclusivo VIP"
      ],
      buttonText: "Melhor Oferta",
      popular: false
    }
  ]

  return (
    <section id="preço" className="py-20 px-4 bg-muted">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Escolha o melhor plano para você
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comece grátis ou acelere sua aprovação com nossos planos premium
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
          Todos os planos incluem 7 dias de garantia. Cancele quando quiser.
        </p>
      </div>
    </section>
  )
}

export default PricingSection
