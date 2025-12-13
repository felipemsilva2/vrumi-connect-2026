import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Award, TrendingUp, Calendar, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const InstructorCTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 sm:py-32 px-4 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl bg-gradient-to-r from-primary to-primary/80 p-8 sm:p-12 lg:p-16 overflow-hidden"
        >
          {/* Background Pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(white 1px, transparent 1px),
                linear-gradient(90deg, white 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
            }}
          />

          <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/20 text-primary-foreground text-sm font-medium mb-6">
                <Award className="w-4 h-4" />
                <span>Para Profissionais</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-foreground mb-6 leading-tight">
                Você é Instrutor Credenciado?
              </h2>

              <p className="text-lg text-primary-foreground/90 mb-8 leading-relaxed">
                Junte-se ao Vrumi Connect e tenha acesso a milhares de alunos na sua região. 
                Gerencie sua agenda e pagamentos em um só lugar.
              </p>

              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate("/connect/cadastro-instrutor")}
                className="group px-8 text-base font-semibold"
              >
                Cadastrar como Instrutor
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Benefits */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: Users,
                  title: "Acesso a Alunos",
                  description: "Milhares de alunos buscando instrutores na sua região.",
                },
                {
                  icon: Calendar,
                  title: "Agenda Digital",
                  description: "Gerencie sua disponibilidade e receba reservas online.",
                },
                {
                  icon: TrendingUp,
                  title: "Aumente sua Renda",
                  description: "Defina seus preços e expanda sua carteira de alunos.",
                },
                {
                  icon: Award,
                  title: "Perfil Verificado",
                  description: "Destaque-se com um selo de instrutor verificado.",
                },
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="p-5 rounded-xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20"
                >
                  <benefit.icon className="w-8 h-8 text-primary-foreground mb-3" />
                  <h3 className="font-semibold text-primary-foreground mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-primary-foreground/80">
                    {benefit.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default InstructorCTASection;
