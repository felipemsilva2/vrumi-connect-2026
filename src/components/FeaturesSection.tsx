import { Card } from "@/components/ui/card";
import { Zap, Target, TrendingUp, Clock } from "lucide-react";

const features = [
  {
    icon: <Zap className="w-10 h-10 text-primary" />,
    title: "Aprendizado Inteligente",
    description: "Sistema de repetição espaçada que otimiza sua memorização e foca nas suas áreas de dificuldade.",
  },
  {
    icon: <Target className="w-10 h-10 text-primary" />,
    title: "Foco no que Importa",
    description: "Conteúdo atualizado com as questões mais recentes dos exames de habilitação.",
  },
  {
    icon: <TrendingUp className="w-10 h-10 text-primary" />,
    title: "Acompanhe seu Progresso",
    description: "Dashboard completo com estatísticas detalhadas do seu desempenho e evolução.",
  },
  {
    icon: <Clock className="w-10 h-10 text-primary" />,
    title: "Economize Tempo e Dinheiro",
    description: "Estude no seu ritmo, reduza custos com aulas extras e aprove de primeira.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Por que escolher nossa plataforma?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Recursos inteligentes desenvolvidos para maximizar sua aprovação
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-8 text-center hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 bg-card border-border/50"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: "fade-in 0.5s ease-out forwards",
              }}
            >
              <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
