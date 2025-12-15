import { Check } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useActivePass } from "@/hooks/useActivePass"
import { cn } from "@/lib/utils"

interface MousePos {
  readonly x: number;
  readonly y: number;
}

interface PricingCardProps {
  plan: {
    name: string;
    subtitle: string;
    price: string;
    period: string;
    features: string[];
    buttonText: string;
    popular: boolean;
    description: string;
    passType: string;
  };
  buttonState: { disabled: boolean; text: string | null };
  loading: string | null;
  onPurchase: (passType: string) => void;
}

const PricingCard3D = ({ plan, buttonState, loading, onPurchase }: PricingCardProps) => {
  const [mousePos, setMousePos] = useState<MousePos>({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({
      x: (x / rect.width - 0.5) * 15,
      y: (y / rect.height - 0.5) * -15,
    });
  }, []);

  const handleEnter = useCallback(() => setHovered(true), []);
  const handleLeave = useCallback(() => {
    setHovered(false);
    setMousePos({ x: 0, y: 0 });
  }, []);

  return (
    <motion.div
      className={cn(
        "relative bg-card rounded-2xl p-6 sm:p-8 transition-all transform-gpu",
        plan.popular
          ? "border-2 border-primary shadow-xl scale-105 mt-6"
          : "border border-border shadow-lg hover:shadow-xl overflow-hidden"
      )}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      animate={{
        rotateX: mousePos.y,
        rotateY: mousePos.x,
        z: hovered ? 20 : 0,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 35, mass: 0.8 }}
      style={{ transformStyle: "preserve-3d", perspective: "1200px" }}
    >
      {/* Gradient overlay on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: plan.popular
            ? `linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, transparent 50%, hsl(var(--primary) / 0.05) 100%)`
            : `linear-gradient(135deg, transparent 0%, hsl(var(--primary) / 0.03) 50%, transparent 100%)`,
          transform: "translateZ(5px)",
        }}
        animate={{ opacity: hovered ? 1 : 0.5 }}
        transition={{ duration: 0.3 }}
      />

      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
        style={{ transform: "translateZ(10px)" }}
      >
        <motion.div
          className="absolute -inset-full"
          animate={{
            background: hovered
              ? `linear-gradient(${mousePos.x + 135}deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)`
              : "transparent",
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>

      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
          <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium shadow-lg">
            Mais Popular
          </span>
        </div>
      )}

      <motion.div
        className="relative z-10"
        style={{ transform: "translateZ(15px)" }}
      >
        <div className="text-center mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            {plan.name}
          </h3>
          {plan.subtitle && (
            <p className="text-sm text-muted-foreground font-medium mb-3">
              {plan.subtitle}
            </p>
          )}
          <div className="flex items-baseline justify-center gap-1 mb-2">
            <motion.span
              className="text-3xl sm:text-4xl font-bold text-foreground"
              animate={{ scale: hovered ? 1.05 : 1 }}
              transition={{ duration: 0.3 }}
            >
              {plan.price}
            </motion.span>
          </div>
          <span className="text-sm text-muted-foreground">{plan.period}</span>
          {plan.description && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-4 italic leading-relaxed">
              "{plan.description}"
            </p>
          )}
        </div>

        <ul className="space-y-3 mb-8">
          {plan.features.map((feature, i) => (
            <motion.li
              key={i}
              className="flex items-center gap-3"
              animate={{ x: hovered ? 5 : 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
            >
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-3 w-3 text-primary" />
              </div>
              <span className="text-sm text-foreground">{feature}</span>
            </motion.li>
          ))}
        </ul>

        <motion.button
          onClick={() => plan.passType && onPurchase(plan.passType)}
          disabled={loading === plan.passType || buttonState.disabled}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "w-full h-12 px-6 rounded-lg font-medium transition-colors",
            plan.popular
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-card border border-border text-foreground hover:bg-muted",
            (loading === plan.passType || buttonState.disabled) && "opacity-50 cursor-not-allowed"
          )}
        >
          {loading === plan.passType ? "Processando..." : (buttonState.text || plan.buttonText)}
        </motion.button>
      </motion.div>

      {/* Glow effect for popular */}
      {plan.popular && (
        <motion.div
          className="absolute -inset-0.5 rounded-2xl opacity-0 pointer-events-none -z-10"
          style={{
            background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.5))`,
            filter: "blur(15px)",
          }}
          animate={{ opacity: hovered ? 0.3 : 0.1 }}
          transition={{ duration: 0.4 }}
        />
      )}
    </motion.div>
  );
};

const PricingSection = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const { toast } = useToast()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  const { activePass, hasActivePass, isLoading: isSubscriptionLoading } = useActivePass(userId)

  const handlePurchase = async (passType: string) => {
    setLoading(passType)
    try {
      navigate(`/pagamento?pass=${passType}`)
    } catch (error) {
      console.error('Erro ao redirecionar:', error)
    } finally {
      setLoading(null)
    }
  }

  const PLAN_LEVELS: Record<string, number> = {
    'individual_30_days': 1,
    'individual_90_days': 2,
    'family_90_days': 3
  }

  const getButtonState = (planPassType: string) => {
    if (isSubscriptionLoading) {
      return { disabled: true, text: "Carregando..." }
    }
    if (!hasActivePass || !activePass) {
      return { disabled: false, text: null }
    }
    const currentLevel = PLAN_LEVELS[activePass.pass_type] || 0
    const planLevel = PLAN_LEVELS[planPassType] || 0
    if (activePass.pass_type === planPassType) {
      return { disabled: true, text: "Plano Atual" }
    }
    if (planLevel > currentLevel) {
      return { disabled: false, text: "Fazer Upgrade" }
    }
    if (planLevel < currentLevel) {
      return { disabled: true, text: "Plano Inferior" }
    }
    return { disabled: false, text: null }
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
    <section id="preço" className="py-16 sm:py-20 px-4 bg-muted">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Passaportes de Acesso
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Não é assinatura, é tempo de acesso. Compre uma vez, estude até passar.
          </p>
        </motion.div>

        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto"
          style={{ perspective: "1500px", transformStyle: "preserve-3d" }}
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40, rotateX: -15 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                type: "spring",
                stiffness: 100,
                damping: 12
              }}
            >
              <PricingCard3D
                plan={plan}
                buttonState={getButtonState(plan.passType)}
                loading={loading}
                onPurchase={handlePurchase}
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12 space-y-2"
        >
          <p className="text-muted-foreground text-sm">
            💡 <strong>Honestidade Total:</strong> Você sabe exatamente o que está comprando. Sem renovação automática.
          </p>
          <p className="text-muted-foreground text-sm">
            ✅ Reprovou? Simples! Compre um novo passaporte e continue estudando.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

export default PricingSection
