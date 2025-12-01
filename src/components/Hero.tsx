import { Button } from "@/components/ui/button";
import { Car, BookOpen, Award, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

const Hero = () => {
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
              <span className="text-sm font-medium">Plataforma #1 de Preparação</span>
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="text-4xl sm:text-5xl md:text-8xl font-bold tracking-tight text-foreground leading-[1.1]"
          >
            Sua CNH, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              Sem Estresse.
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light"
          >
            Domine a teoria e a prática com a metodologia mais moderna do mercado. Flashcards, simulados e suporte em um só lugar.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
          >
            <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full shadow-lg hover:shadow-xl hover:brightness-110 transition-all duration-300 bg-primary text-white border-0">
              Começar Agora
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full backdrop-blur-sm border-2 hover:bg-secondary/50 transition-all duration-300">
              <BookOpen className="w-5 h-5 mr-2" />
              Ver Conteúdo
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
              { value: "10K+", label: "Alunos Aprovados" },
              { value: "95%", label: "Taxa de Aprovação" },
              { value: "500+", label: "Questões" },
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
