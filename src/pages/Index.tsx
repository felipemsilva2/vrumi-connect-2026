import MinimalModernHero from "@/components/ui/minimal";
import { FeaturesSectionWithHoverEffects } from "@/components/ui/feature-section-with-hover-effects";
import FlashcardSection from "@/components/FlashcardSection";
import FAQ from "@/components/FAQ";
import Testimonials from "@/components/Testimonials";
import GovernmentSupport from "@/components/GovernmentSupport";
import Footer from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import PricingSection from "@/components/PricingSection";
import { useNavigate } from "react-router-dom";
const Index = () => {
  const navigate = useNavigate();
  return <main className="min-h-screen pt-20">
      <Navbar />
      <section id="inicio">
        <MinimalModernHero logo={<div className="flex items-center gap-2">
            
            
          </div>} badge="A LEI MUDOU. O CURSO TEÓRICO NÃO É MAIS OBRIGATÓRIO." title="O novo jeito de tirar sua CNH." subtitle="Troque as 45h de sala de aula por um app inteligente e economize 80% do valor da sua habilitação." description="Para que gastar R$1.000+ com o curso teórico se você pode ter o mesmo conteúdo oficial de forma rápida e interativa? O Habilita transforma as apostilas do governo em simulados, flashcards e lições que realmente aprovam." primaryButton={{
        label: "Começar Agora",
        onClick: () => navigate("/auth")
      }} secondaryButton={{
        label: "Já tenho conta",
        onClick: () => navigate("/auth")
      }} stats={[{
        value: "10K+",
        label: "Alunos Aprovados"
      }, {
        value: "95%",
        label: "Taxa de Aprovação"
      }, {
        value: "500+",
        label: "Questões"
      }, {
        value: "4.9★",
        label: "Avaliação"
      }]} accentColor="#10b981" />
      </section>
      <section id="recursos" className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Diga adeus à sala de aula. Estude do seu jeito.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">O Conduzly é a ponte entre o material denso do governo e a sua aprovação.</p>
          </div>
          <FeaturesSectionWithHoverEffects />
        </div>
      </section>
      <PricingSection />
      <FlashcardSection />
      <section id="depoimentos">
        <Testimonials />
      </section>
      <GovernmentSupport />
      <section id="faq">
        <FAQ />
      </section>
      <Footer />
    </main>;
};
export default Index;