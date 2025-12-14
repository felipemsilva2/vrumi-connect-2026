import { Zap, Target, TrendingUp, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Card3D, Card3DList } from "@/components/ui/animated-3d-card";

const features = [
  {
    id: "aprendizado",
    icon: <Zap className="w-8 h-8 text-primary-foreground" />,
    title: "Aprendizado Inteligente",
    description: "Sistema de repetição espaçada que otimiza sua memorização e foca nas suas áreas de dificuldade.",
    theme: "primary" as const,
  },
  {
    id: "foco",
    icon: <Target className="w-8 h-8 text-primary-foreground" />,
    title: "Foco no que Importa",
    description: "Conteúdo atualizado com as questões mais recentes dos exames de habilitação.",
    theme: "accent" as const,
  },
  {
    id: "progresso",
    icon: <TrendingUp className="w-8 h-8 text-primary-foreground" />,
    title: "Acompanhe seu Progresso",
    description: "Dashboard completo com estatísticas detalhadas do seu desempenho e evolução.",
    theme: "success" as const,
  },
  {
    id: "economia",
    icon: <Clock className="w-8 h-8 text-primary-foreground" />,
    title: "Economize Tempo e Dinheiro",
    description: "Estude no seu ritmo, reduza custos com aulas extras e aprove de primeira.",
    theme: "dark" as const,
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

        {/* Features Grid - 3D Cards */}
        <Card3DList
          cards={features}
          columns={4}
          gap="lg"
          size="md"
          variant="premium"
          animated={true}
        />
      </div>
    </section>
  );
};

export default FeaturesSection;
