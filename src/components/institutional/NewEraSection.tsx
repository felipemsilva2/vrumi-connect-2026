import { motion } from "framer-motion";
import { Scale, BookOpen, Car, Shield } from "lucide-react";

const NewEraSection = () => {
  return (
    <section className="py-20 sm:py-32 px-4 bg-background">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Scale className="w-4 h-4" />
            <span>Contexto Legal</span>
          </div>

          {/* Title */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
            Liberdade com Responsabilidade
          </h2>

          {/* Description */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Apoiamos a modernização do processo de habilitação. Seja estudando teoria em casa
            ou praticando com um instrutor independente, o Vrumi oferece a infraestrutura
            tecnológica para que você exerça sua cidadania no trânsito.
          </p>

          {/* Features */}
          <div className="grid gap-4 sm:grid-cols-3 sm:gap-8">
            {[
              {
                icon: BookOpen,
                title: "Estude em Casa",
                description: "A nova lei permite estudar teoria por conta própria. O Vrumi oferece todo o material necessário.",
              },
              {
                icon: Car,
                title: "Pratique com Liberdade",
                description: "Escolha seu instrutor, defina seus horários e aprenda no seu ritmo.",
              },
              {
                icon: Shield,
                title: "Segurança Jurídica",
                description: "Contratos digitais, pagamentos protegidos e instrutores credenciados.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default NewEraSection;
