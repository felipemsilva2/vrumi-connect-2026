import { Button } from "@/components/ui/button";
import { Car, Users, Award, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-10">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="w-full h-full"
        >
          <img
            src={heroBg}
            alt="Driving preparation"
            className="w-full h-full object-cover"
            decoding="async"
            fetchPriority="high"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/50 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="inline-flex items-center gap-2 bg-secondary/50 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 text-foreground shadow-sm">
              <Award className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Nova Lei CNH 2025 - Instrutores Independentes</span>
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="text-4xl sm:text-5xl md:text-8xl font-bold tracking-tight text-foreground leading-[1.1]"
          >
            Aulas de Direção <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              Sem Complicação.
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light"
          >
            Encontre instrutores independentes credenciados pelo DETRAN. Com a nova lei, economize até 80% e tire sua CNH com total flexibilidade.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
          >
            <Button
              size="lg"
              onClick={() => navigate("/connect")}
              className="w-full sm:w-auto text-lg h-14 px-8 rounded-full shadow-lg hover:shadow-xl hover:brightness-110 transition-all duration-300 bg-primary text-white border-0"
            >
              Encontrar Instrutor
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/connect/cadastro-instrutor")}
              className="w-full sm:w-auto text-lg h-14 px-8 rounded-full backdrop-blur-sm border-2 hover:bg-secondary/50 transition-all duration-300"
            >
              <Car className="w-5 h-5 mr-2" />
              Sou Instrutor
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-16 max-w-3xl mx-auto border-t border-border/50 mt-16"
          >
            {[
              { value: "50+", label: "Instrutores Credenciados" },
              { value: "100%", label: "Pagamento Seguro" },
              { value: "4.9★", label: "Avaliação Média" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
