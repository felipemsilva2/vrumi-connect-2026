import { Card } from "@/components/ui/card";
import { Zap, Target, TrendingUp, Clock } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: <Zap className="w-8 h-8 text-primary" />,
    title: "Aprendizado Inteligente",
    description: "Sistema de repetição espaçada que otimiza sua memorização e foca nas suas áreas de dificuldade.",
  },
  {
    icon: <Target className="w-8 h-8 text-primary" />,
    title: "Foco no que Importa",
    description: "Conteúdo atualizado com as questões mais recentes dos exames de habilitação.",
  },
  {
    icon: <TrendingUp className="w-8 h-8 text-primary" />,
    title: "Acompanhe seu Progresso",
    description: "Dashboard completo com estatísticas detalhadas do seu desempenho e evolução.",
  },
  {
    icon: <Clock className="w-8 h-8 text-primary" />,
    title: "Economize Tempo e Dinheiro",
    description: "Estude no seu ritmo, reduza custos com aulas extras e aprove de primeira.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 px-4 bg-background relative overflow-hidden">
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
            Por que escolher o Vrumi?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light">
            Recursos inteligentes desenvolvidos para maximizar sua aprovação.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card border-border/40 hover:border-border/80 group">
                <div className="inline-flex p-4 bg-secondary/30 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
