import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { BookOpen, FileText, Video, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Material {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  topics: number;
  duration: string;
  category: string;
}

const materials: Material[] = [
  {
    id: 1,
    title: "Legislação de Trânsito",
    description: "Código de Trânsito Brasileiro completo, infrações, pontuações e multas.",
    icon: <FileText className="w-8 h-8 text-primary" />,
    topics: 45,
    duration: "8h",
    category: "Essencial",
  },
  {
    id: 2,
    title: "Sinalização Viária",
    description: "Todas as placas, sinais e marcações que você precisa conhecer.",
    icon: <BookOpen className="w-8 h-8 text-primary" />,
    topics: 68,
    duration: "6h",
    category: "Essencial",
  },
  {
    id: 3,
    title: "Direção Defensiva",
    description: "Técnicas e práticas para uma condução segura e responsável.",
    icon: <BookOpen className="w-8 h-8 text-primary" />,
    topics: 32,
    duration: "5h",
    category: "Importante",
  },
  {
    id: 4,
    title: "Mecânica Básica",
    description: "Fundamentos de mecânica automotiva e manutenção preventiva.",
    icon: <BookOpen className="w-8 h-8 text-primary" />,
    topics: 28,
    duration: "4h",
    category: "Complementar",
  },
  {
    id: 5,
    title: "Primeiros Socorros",
    description: "Procedimentos de emergência e atendimento a vítimas de trânsito.",
    icon: <Video className="w-8 h-8 text-primary" />,
    topics: 20,
    duration: "3h",
    category: "Importante",
  },
  {
    id: 6,
    title: "Meio Ambiente e Cidadania",
    description: "Impacto ambiental e responsabilidade social no trânsito.",
    icon: <BookOpen className="w-8 h-8 text-primary" />,
    topics: 15,
    duration: "2h",
    category: "Complementar",
  },
];

interface MousePos {
  readonly x: number;
  readonly y: number;
}

interface Material3DCardProps {
  material: Material;
  index: number;
}

const Material3DCard: React.FC<Material3DCardProps> = ({ material, index }) => {
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

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case "Essencial":
        return "bg-primary/10 text-primary";
      case "Importante":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: -10 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="h-full"
      style={{ transformStyle: "preserve-3d" }}
    >
      <motion.div
        className="relative h-full overflow-hidden rounded-2xl bg-card border border-border/50 transform-gpu transition-all duration-300 hover:shadow-xl cursor-pointer"
        onMouseMove={handleMove}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        animate={{
          rotateX: mousePos.y,
          rotateY: mousePos.x,
          z: hovered ? 15 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
      >
        {/* Glow effect */}
        <motion.div
          className="absolute -inset-0.5 rounded-2xl opacity-0 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.05))",
            filter: "blur(10px)",
            transform: "translateZ(-5px)",
          }}
          animate={{ opacity: hovered ? 0.5 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
          style={{ transform: "translateZ(3px)" }}
        >
          <motion.div
            className="absolute -inset-full"
            animate={{
              background: hovered
                ? `linear-gradient(${mousePos.x + 135}deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)`
                : "transparent",
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>

        <div className="relative z-10 p-6" style={{ transform: "translateZ(10px)" }}>
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <motion.div
              className="p-3 bg-primary/10 rounded-lg"
              animate={{ 
                scale: hovered ? 1.1 : 1,
                backgroundColor: hovered ? "hsl(var(--primary) / 0.2)" : "hsl(var(--primary) / 0.1)",
              }}
              transition={{ duration: 0.3 }}
            >
              {material.icon}
            </motion.div>
            <span className={cn(
              "text-xs font-semibold px-3 py-1 rounded-full",
              getCategoryStyles(material.category)
            )}>
              {material.category}
            </span>
          </div>

          {/* Content */}
          <motion.h3
            className="text-xl font-bold text-foreground mb-2"
            animate={{ color: hovered ? "hsl(var(--primary))" : "hsl(var(--foreground))" }}
            transition={{ duration: 0.3 }}
          >
            {material.title}
          </motion.h3>
          <p className="text-muted-foreground mb-4 leading-relaxed">{material.description}</p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>{material.topics} tópicos</span>
            </div>
            <div className="flex items-center gap-1">
              <Video className="w-4 h-4" />
              <span>{material.duration}</span>
            </div>
          </div>

          {/* CTA */}
          <motion.div
            animate={{ y: hovered ? -2 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Button variant="ghost" className="w-full group/btn">
              <span>Começar a estudar</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>

        {/* Bottom gradient */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0"
          animate={{ opacity: hovered ? 1 : 0, scaleX: hovered ? 1 : 0.5 }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </motion.div>
  );
};

const MaterialsSection = () => {
  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Materiais Teóricos Completos
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Acesso completo a todo conteúdo teórico necessário para sua aprovação. Estude no seu ritmo, quando e onde quiser.
          </p>
        </motion.div>

        {/* Materials Grid */}
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          style={{ perspective: "1500px" }}
        >
          {materials.map((material, index) => (
            <Material3DCard key={material.id} material={material} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <div className="inline-block p-8 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-xl">
            <h3 className="text-2xl font-bold text-primary-foreground mb-3">
              Pronto para começar?
            </h3>
            <p className="text-primary-foreground/90 mb-6 max-w-md">
              Tenha acesso completo a todos os materiais e flashcards agora mesmo.
            </p>
            <Button variant="secondary" size="lg" className="shadow-md">
              Começar Gratuitamente
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MaterialsSection;
