import MinimalModernHero from "@/components/ui/minimal";
import React, { Suspense } from "react";
const LazyFeatures = React.lazy(() => import("@/components/ui/feature-section-with-hover-effects").then(m => ({ default: m.FeaturesSectionWithHoverEffects })));
const LazyFlashcardSection = React.lazy(() => import("@/components/FlashcardSection"));
const LazyFAQ = React.lazy(() => import("@/components/FAQ"));
const LazyTestimonials = React.lazy(() => import("@/components/Testimonials"));
const LazyGovernmentSupport = React.lazy(() => import("@/components/GovernmentSupport"));
const LazyFooter = React.lazy(() => import("@/components/Footer"));
import { Navbar } from "@/components/Navbar";
const LazyPricingSection = React.lazy(() => import("@/components/PricingSection"));
import { useNavigate } from "react-router-dom";
import { Display, Lead, Heading2, BodyLarge } from "@/components/ui/typography";
const Index = () => {
  const navigate = useNavigate();
  return (
    <main className="min-h-screen pt-20">
      <Navbar />

      {/* 1. Hero */}
      <section id="inicio">
        <MinimalModernHero
          logo={<div className="flex items-center gap-2"></div>}
          badge="A LEI MUDOU: O CURSO TEÓRICO NA AUTOESCOLA NÃO É MAIS OBRIGATÓRIO."
          title="O novo jeito de tirar sua CNH."
          subtitle="Troque as 45h de sala de aula por um app inteligente e economize 80% do valor da sua habilitação."
          description="Para que gastar R$1.000+ com o curso teórico se você pode ter o mesmo conteúdo oficial de forma rápida e interativa? O Vrumi transforma as apostilas do governo em simulados, flashcards e lições que realmente aprovam."
          primaryButton={{
            label: "Começar Agora",
            onClick: () => navigate("/auth?mode=register"),
          }}
          secondaryButton={{
            label: "Já tenho conta",
            onClick: () => navigate("/auth?mode=login"),
          }}
          stats={[
            {
              value: "4K+",
              label: "Alunos Aprovados",
            },
            {
              value: "95%",
              label: "Taxa de Aprovação",
            },
            {
              value: "500+",
              label: "Questões",
            },
            {
              value: "4.9★",
              label: "Avaliação",
            },
          ]}
          accentColor="#10b981"
        />
      </section>

      {/* 2. Social Proof - Depoimentos */}
      <section id="depoimentos">
        <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Carregando depoimentos…</div>}>
          <LazyTestimonials />
        </Suspense>
      </section>

      {/* 3. Recursos */}
      <section id="recursos" className="py-16 sm:py-20 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
              Diga adeus à sala de aula. Estude do seu jeito.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              O Vrumi é a ponte entre o material denso do governo e a sua aprovação.
            </p>
          </div>
          <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Carregando recursos…</div>}>
            <LazyFeatures />
          </Suspense>
        </div>
      </section>

      {/* 4. Apoio Governamental */}
      <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Carregando informações oficiais…</div>}>
        <LazyGovernmentSupport />
      </Suspense>

      {/* 4.5 Biblioteca de Placas */}
      <section className="py-16 sm:py-20 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
              136 Placas de Trânsito na Palma da sua Mão
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Biblioteca completa com todas as placas oficiais brasileiras. Estude com flashcards inteligentes e desafios cronometrados.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate("/traffic-signs-library")}
                className="inline-flex items-center justify-center px-8 h-12 text-lg text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-colors font-semibold shadow-lg hover:shadow-xl"
              >
                Explorar Biblioteca de Placas
              </button>
              <button
                onClick={() => navigate("/auth?mode=register")}
                className="inline-flex items-center justify-center px-8 h-12 text-lg text-foreground bg-muted rounded-full hover:bg-muted/80 transition-colors font-semibold"
              >
                Criar Conta Grátis
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center p-6 bg-card rounded-xl border border-border">
              <div className="text-4xl font-bold text-primary mb-2">136</div>
              <p className="text-muted-foreground">Placas Oficiais</p>
            </div>
            <div className="text-center p-6 bg-card rounded-xl border border-border">
              <div className="text-4xl font-bold text-primary mb-2">5</div>
              <p className="text-muted-foreground">Categorias</p>
            </div>
            <div className="text-center p-6 bg-card rounded-xl border border-border">
              <div className="text-4xl font-bold text-primary mb-2">2</div>
              <p className="text-muted-foreground">Modos de Estudo</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Preview - Flashcards */}
      <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Carregando preview…</div>}>
        <LazyFlashcardSection />
      </Suspense>

      {/* 6. Pricing */}
      <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Carregando planos…</div>}>
        <LazyPricingSection />
      </Suspense>

      {/* 7. FAQ */}
      <section id="faq">
        <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Carregando FAQ…</div>}>
          <LazyFAQ />
        </Suspense>
      </section>

      {/* 8. Footer */}
      <Suspense fallback={<div />}> 
        <LazyFooter />
      </Suspense>

    </main>
  );
};
export default Index;
