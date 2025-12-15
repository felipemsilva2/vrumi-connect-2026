import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Shield, MapPin, Star, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const ConnectHighlightSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 sm:py-32 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="grid gap-8 lg:gap-16 lg:grid-cols-2 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              <span>Segurança e Confiança</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Conectando Alunos e Instrutores{" "}
              <span className="text-primary">com Segurança</span>
            </h2>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Com o fim da obrigatoriedade da autoescola tradicional, o Vrumi Connect surge
              para organizar o mercado. Oferecemos uma plataforma onde alunos encontram
              instrutores qualificados perto de casa, com pagamento seguro e garantia de qualidade.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8 sm:gap-6">
              {[
                { value: "500+", label: "Instrutores" },
                { value: "27", label: "Estados" },
                { value: "4.8★", label: "Avaliação" },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            <Button
              size="lg"
              onClick={() => navigate("/connect")}
              className="group"
            >
              Explorar o Marketplace
              <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          {/* Visual - Map Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border border-border p-8 overflow-hidden">
              {/* Simulated Map Background */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(hsl(var(--border)) 1px, transparent 1px),
                    linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
                  `,
                  backgroundSize: "40px 40px",
                }}
              />

              {/* Floating Instructor Cards */}
              <div className="relative z-10 space-y-4">
                {[
                  { name: "Carlos M.", rating: 4.9, city: "São Paulo, SP", reviews: 127 },
                  { name: "Ana Paula R.", rating: 5.0, city: "Rio de Janeiro, RJ", reviews: 89 },
                  { name: "Roberto S.", rating: 4.8, city: "Belo Horizonte, MG", reviews: 64 },
                ].map((instructor, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-background border border-border shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-primary" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground truncate">
                          {instructor.name}
                        </span>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-medium">{instructor.rating}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {instructor.city}
                        <span className="mx-1">•</span>
                        <span>{instructor.reviews} avaliações</span>
                      </div>
                    </div>

                    {/* Verified Badge */}
                    <div className="flex-shrink-0">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Map Pins */}
              <div className="absolute top-8 right-8 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <MapPin className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="absolute bottom-16 right-16 w-6 h-6 rounded-full bg-primary/60 flex items-center justify-center shadow-md">
                <div className="w-2 h-2 rounded-full bg-primary-foreground" />
              </div>
              <div className="absolute top-1/3 right-1/4 w-6 h-6 rounded-full bg-primary/40 flex items-center justify-center shadow-md">
                <div className="w-2 h-2 rounded-full bg-primary-foreground" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ConnectHighlightSection;
