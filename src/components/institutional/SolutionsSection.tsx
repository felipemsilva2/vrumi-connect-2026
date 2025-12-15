import React, { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Brain, Smartphone, Car, MapPin, Users, Star, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MousePos {
  readonly x: number;
  readonly y: number;
}

interface Solution3DCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  badge: { icon: React.ReactNode; label: string };
  features: (string | { icon: React.ComponentType<any>; label: string })[];
  ctaLabel: string;
  onCta: () => void;
  isNew?: boolean;
  variant?: "default" | "highlight";
}

const Solution3DCard: React.FC<Solution3DCardProps> = ({
  title,
  subtitle,
  description,
  icon,
  badge,
  features,
  ctaLabel,
  onCta,
  isNew = false,
  variant = "default",
}) => {
  const [mousePos, setMousePos] = useState<MousePos>({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({
      x: (x / rect.width - 0.5) * 12,
      y: (y / rect.height - 0.5) * -12,
    });
  }, []);

  const handleEnter = useCallback(() => setHovered(true), []);
  const handleLeave = useCallback(() => {
    setHovered(false);
    setMousePos({ x: 0, y: 0 });
  }, []);

  const isHighlight = variant === "highlight";

  return (
    <motion.div
      className={cn(
        "relative h-full overflow-hidden rounded-3xl transform-gpu transition-all duration-500",
        isHighlight
          ? "bg-gradient-to-br from-primary/5 via-primary/10 to-primary/15 border-2 border-primary/30 hover:border-primary"
          : "bg-card border-2 border-border hover:border-primary/50",
        "hover:shadow-2xl"
      )}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      animate={{
        rotateX: mousePos.y,
        rotateY: mousePos.x,
        z: hovered ? 20 : 0,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{ transformStyle: "preserve-3d", perspective: "1200px" }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute -inset-1 rounded-3xl opacity-0 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--primary) / 0.1))",
          filter: "blur(20px)",
          transform: "translateZ(-10px)",
        }}
        animate={{ opacity: hovered ? 0.4 : 0 }}
        transition={{ duration: 0.4 }}
      />

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none"
        style={{ transform: "translateZ(5px)" }}
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

      <div className="relative z-10 p-8 sm:p-10 h-full flex flex-col" style={{ transform: "translateZ(15px)" }}>
        {/* New Badge */}
        {isNew && (
          <motion.div
            className="absolute top-6 right-6 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider"
            animate={{ scale: hovered ? 1.05 : 1 }}
            transition={{ duration: 0.3 }}
          >
            Novo!
          </motion.div>
        )}

        {/* Icon */}
        <motion.div
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center mb-6",
            isHighlight ? "bg-primary/20" : "bg-primary/10"
          )}
          animate={{
            scale: hovered ? 1.1 : 1,
            rotateZ: hovered ? 5 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {icon}
        </motion.div>

        {/* Badge */}
        <div className={cn(
          "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4 w-fit",
          isHighlight ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}>
          {badge.icon}
          {badge.label}
        </div>

        {/* Title */}
        <motion.h3
          className="text-2xl sm:text-3xl font-bold text-foreground mb-2"
          animate={{ x: hovered ? 3 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {title}
        </motion.h3>
        <p className="text-xl text-primary font-semibold mb-4">{subtitle}</p>

        {/* Description */}
        <p className="text-muted-foreground mb-6 leading-relaxed">{description}</p>

        {/* Features */}
        <div className="flex-grow">
          {Array.isArray(features) && typeof features[0] === "string" ? (
            <ul className="space-y-3 mb-8">
              {(features as string[]).map((feature, index) => (
                <motion.li
                  key={index}
                  className="flex items-center gap-3 text-foreground"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  {feature}
                </motion.li>
              ))}
            </ul>
          ) : (
            <div className="grid grid-cols-1 gap-3 mb-8 sm:grid-cols-3 sm:gap-4">
              {(features as { icon: React.ComponentType<any>; label: string }[]).map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background/80 border border-border"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <feature.icon className="w-6 h-6 text-primary" />
                  <span className="text-sm font-medium text-foreground text-center">{feature.label}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <motion.div
          animate={{ y: hovered ? -3 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            size="lg"
            onClick={onCta}
            className={cn(
              "w-full sm:w-auto group/btn",
              isHighlight && "bg-primary hover:bg-primary/90"
            )}
          >
            {ctaLabel}
            <ChevronRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

const SolutionsSection = () => {
  const navigate = useNavigate();

  return (
    <section id="solucoes" className="py-20 sm:py-32 px-4 bg-background">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Nossas Soluções
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Duas plataformas integradas para cada etapa da sua jornada de habilitação.
          </p>
        </motion.div>

        {/* Solution Cards */}
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-2" style={{ perspective: "1500px" }}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Solution3DCard
              title="Vrumi Education"
              subtitle="Para quem quer Passar"
              description="Plataforma de autoestudo com Inteligência Artificial e Flashcards. Domine a legislação e passe na prova teórica do DETRAN de primeira."
              icon={<Brain className="w-8 h-8 text-primary" />}
              badge={{ icon: <Smartphone className="w-4 h-4" />, label: "Teoria" }}
              features={[
                "Simulados ilimitados atualizados",
                "136 placas com flashcards inteligentes",
                "Estatísticas detalhadas de desempenho",
                "Material oficial do DETRAN",
              ]}
              ctaLabel="Acessar Plataforma de Estudos"
              onCta={() => navigate("/entrar")}
              variant="default"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Solution3DCard
              title="Vrumi Connect"
              subtitle="Para quem quer Dirigir"
              description="O maior marketplace de instrutores independentes do Brasil. Encontre, avalie e contrate aulas práticas com segurança jurídica e profissionalismo."
              icon={<Car className="w-8 h-8 text-primary" />}
              badge={{ icon: <MapPin className="w-4 h-4" />, label: "Prática" }}
              features={[
                { icon: Users, label: "Instrutores Credenciados" },
                { icon: Calendar, label: "Agendamento Online" },
                { icon: Star, label: "Avaliações Reais" },
              ]}
              ctaLabel="Encontrar um Instrutor"
              onCta={() => navigate("/connect")}
              isNew={true}
              variant="highlight"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SolutionsSection;
