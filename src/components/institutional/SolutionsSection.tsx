import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Brain, Smartphone, Car, MapPin, Users, Star, Shield, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Vrumi Education */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative group"
          >
            <div className="h-full p-8 sm:p-10 rounded-3xl bg-card border-2 border-border hover:border-primary/50 transition-all duration-500 hover:shadow-2xl">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Brain className="w-8 h-8 text-primary" />
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm font-medium text-muted-foreground mb-4">
                <Smartphone className="w-4 h-4" />
                Teoria
              </div>

              {/* Title */}
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Vrumi Education
              </h3>
              <p className="text-xl text-primary font-semibold mb-4">
                Para quem quer Passar
              </p>

              {/* Description */}
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Plataforma de autoestudo com Inteligência Artificial e Flashcards. 
                Domine a legislação e passe na prova teórica do DETRAN de primeira.
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {[
                  "Simulados ilimitados atualizados",
                  "136 placas com flashcards inteligentes",
                  "Estatísticas detalhadas de desempenho",
                  "Material oficial do DETRAN",
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-foreground">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                size="lg"
                onClick={() => navigate("/entrar")}
                className="w-full sm:w-auto group/btn"
              >
                Acessar Plataforma de Estudos
                <ChevronRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>

          {/* Vrumi Connect */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative group"
          >
            <div className="h-full p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/30 hover:border-primary transition-all duration-500 hover:shadow-2xl relative overflow-hidden">
              {/* "New" Badge */}
              <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider">
                Novo!
              </div>

              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
                <Car className="w-8 h-8 text-primary" />
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-sm font-medium text-primary mb-4">
                <MapPin className="w-4 h-4" />
                Prática
              </div>

              {/* Title */}
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Vrumi Connect
              </h3>
              <p className="text-xl text-primary font-semibold mb-4">
                Para quem quer Dirigir
              </p>

              {/* Description */}
              <p className="text-muted-foreground mb-6 leading-relaxed">
                O maior marketplace de instrutores independentes do Brasil. 
                Encontre, avalie e contrate aulas práticas com segurança jurídica e profissionalismo.
              </p>

              {/* Key Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: Users, label: "Instrutores Credenciados" },
                  { icon: Calendar, label: "Agendamento Online" },
                  { icon: Star, label: "Avaliações Reais" },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background/80 border border-border"
                  >
                    <feature.icon className="w-6 h-6 text-primary" />
                    <span className="text-sm font-medium text-foreground text-center">
                      {feature.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Button
                size="lg"
                onClick={() => navigate("/connect")}
                className="w-full sm:w-auto group/btn bg-primary hover:bg-primary/90"
              >
                Encontrar um Instrutor
                <ChevronRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SolutionsSection;
