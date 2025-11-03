import MinimalModernHero from "@/components/ui/minimal";
import { FeaturesSectionWithHoverEffects } from "@/components/ui/feature-section-with-hover-effects";
import FlashcardSection from "@/components/FlashcardSection";
import FAQ from "@/components/FAQ";
import Testimonials from "@/components/Testimonials";
import GovernmentSupport from "@/components/GovernmentSupport";
import Footer from "@/components/Footer";
import { Car } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen">
      <MinimalModernHero
        logo={
          <div className="flex items-center gap-2">
            <Car className="w-10 h-10" style={{ color: "#10b981" }} />
            <span
              className="text-2xl font-black"
              style={{ color: "#000000", fontFamily: "Inter, sans-serif" }}
            >
              CNH FÁCIL
            </span>
          </div>
        }
        badge="Plataforma #1"
        title="Passe na sua CNH com Facilidade"
        subtitle="Tudo o que você precisa em um só lugar"
        description="Flashcards inteligentes e materiais teóricos completos para garantir sua aprovação no exame de habilitação."
        primaryButton={{
          label: "Começar Agora",
          onClick: () => navigate("/auth"),
        }}
        secondaryButton={{
          label: "Entrar no Dashboard",
          onClick: () => navigate("/auth"),
        }}
        stats={[
          { value: "10K+", label: "Alunos Aprovados" },
          { value: "95%", label: "Taxa de Aprovação" },
          { value: "500+", label: "Questões" },
          { value: "4.9★", label: "Avaliação" },
        ]}
        accentColor="#10b981"
      />
      <section id="recursos" className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Por que escolher nossa plataforma?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Recursos inteligentes desenvolvidos para maximizar sua aprovação
            </p>
          </div>
          <FeaturesSectionWithHoverEffects />
        </div>
      </section>
      <FlashcardSection />
      <section id="depoimentos">
        <Testimonials />
      </section>
      <GovernmentSupport />
      <section id="faq">
        <FAQ />
      </section>
      <Footer />
    </main>
  );
};

export default Index;
