import { Button } from "@/components/ui/button";
import { Car, BookOpen, Award } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroBg} 
          alt="Driving preparation" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-accent/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-card/10 backdrop-blur-sm border border-card/20 rounded-full px-6 py-3 text-card-foreground">
            <Award className="w-5 h-5 text-secondary" />
            <span className="text-sm font-medium">Vrumi - Plataforma #1 de Preparação</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground leading-tight">
            Passe na sua CNH
            <span className="block text-secondary mt-2">com Facilidade</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-2xl mx-auto leading-relaxed">
            Todos os recursos que você precisa em uma única plataforma: flashcards inteligentes e materiais teóricos completos.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button variant="hero" size="lg" className="text-lg">
              <Car className="w-5 h-5" />
              Começar Agora
            </Button>
            <Button variant="outline" size="lg" className="text-lg bg-card/10 backdrop-blur-sm border-2 text-primary-foreground hover:bg-card/20">
              <BookOpen className="w-5 h-5" />
              Ver Conteúdo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-12 max-w-3xl mx-auto">
            {[
              { value: "10K+", label: "Alunos Aprovados" },
              { value: "95%", label: "Taxa de Aprovação" },
              { value: "500+", label: "Questões" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-secondary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-primary-foreground/80">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default Hero;
