import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Video, ArrowRight } from "lucide-react";
import trafficIcon from "@/assets/traffic-icon.png";
import signIcon from "@/assets/sign-icon.png";

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
    icon: <img src={signIcon} alt="Road sign" className="w-8 h-8" />,
    topics: 68,
    duration: "6h",
    category: "Essencial",
  },
  {
    id: 3,
    title: "Direção Defensiva",
    description: "Técnicas e práticas para uma condução segura e responsável.",
    icon: <img src={trafficIcon} alt="Traffic light" className="w-8 h-8" />,
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

const MaterialsSection = () => {
  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Materiais Teóricos Completos
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Acesso completo a todo conteúdo teórico necessário para sua aprovação. Estude no seu ritmo, quando e onde quiser.
          </p>
        </div>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {materials.map((material, index) => (
            <Card
              key={material.id}
              className="p-6 hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 bg-gradient-card border-border/50 group"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: "fade-in 0.5s ease-out forwards",
              }}
            >
              {/* Category Badge */}
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  {material.icon}
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  material.category === "Essencial" 
                    ? "bg-primary/10 text-primary" 
                    : material.category === "Importante"
                    ? "bg-secondary/10 text-secondary"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {material.category}
                </span>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {material.title}
              </h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {material.description}
              </p>

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
              <Button variant="ghost" className="w-full group/btn">
                <span>Começar a estudar</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <Card className="inline-block p-8 bg-gradient-hero border-0 shadow-elegant">
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
          </Card>
        </div>
      </div>
    </section>
  );
};

export default MaterialsSection;
