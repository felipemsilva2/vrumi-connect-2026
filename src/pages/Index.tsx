import React, { Suspense, lazy } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Navbar } from "@/components/Navbar";
import { useLocation } from "react-router-dom";

// Institutional Components
const InstitutionalHero = lazy(() => import("@/components/institutional/InstitutionalHero"));
const SolutionsSection = lazy(() => import("@/components/institutional/SolutionsSection"));
const ConnectHighlightSection = lazy(() => import("@/components/institutional/ConnectHighlightSection"));
const NewEraSection = lazy(() => import("@/components/institutional/NewEraSection"));
const InstructorCTASection = lazy(() => import("@/components/institutional/InstructorCTASection"));
const InstitutionalFooter = lazy(() => import("@/components/institutional/InstitutionalFooter"));

// Existing Components
const LazyFAQ = lazy(() => import("@/components/FAQ"));
const LazyTestimonials = lazy(() => import("@/components/Testimonials"));
const LazyPricingSection = lazy(() => import("@/components/PricingSection"));
const LazyFeaturesSection = lazy(() => import("@/components/FeaturesSection"));

const Index = () => {
  const location = useLocation();

  React.useLayoutEffect(() => {
    // Force light mode for landing page
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  }, []);

  React.useEffect(() => {
    if (location.state && location.state.scrollTo) {
      const element = document.getElementById(location.state.scrollTo);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [location]);

  return (
    <main className="min-h-screen pt-20">
      <SEOHead
        canonical="/"
        title="Vrumi | O Ecossistema Completo para sua CNH - Teoria e Prática"
        description="O primeiro ecossistema que une tecnologia de aprendizado teórico e marketplace de instrutores práticos. Estude para a prova teórica e encontre instrutores credenciados. Tudo em conformidade com a Nova Lei de Trânsito."
        keywords="CNH, carteira de motorista, tirar CNH sozinho, simulado DETRAN, placas de trânsito, instrutor particular, aulas práticas, autoescola online, habilitação 2025, nova lei trânsito"
      />
      <Navbar />

      {/* 1. Hero Institucional */}
      <section id="inicio">
        <Suspense fallback={<div className="min-h-screen" />}>
          <InstitutionalHero />
        </Suspense>
      </section>

      {/* 2. Nossas Soluções - O que oferecemos */}
      <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Carregando...</div>}>
        <SolutionsSection />
      </Suspense>

      {/* 3. Vantagens/Recursos - Por que escolher */}
      <section id="recursos">
        <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Carregando...</div>}>
          <LazyFeaturesSection />
        </Suspense>
      </section>

      {/* 4. Depoimentos - Prova social */}
      <section id="depoimentos">
        <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Carregando...</div>}>
          <LazyTestimonials />
        </Suspense>
      </section>

      {/* 5. Destaque Vrumi Connect - Produto adicional */}
      <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Carregando...</div>}>
        <ConnectHighlightSection />
      </Suspense>

      {/* 6. A Nova Era - Contexto legal e educacional */}
      <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Carregando...</div>}>
        <NewEraSection />
      </Suspense>

      {/* 7. Preços - Após valor estabelecido */}
      <section id="preço">
        <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Carregando...</div>}>
          <LazyPricingSection />
        </Suspense>
      </section>

      {/* 8. CTA para Instrutores - Audiência secundária */}
      <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Carregando...</div>}>
        <InstructorCTASection />
      </Suspense>

      {/* 9. FAQ - Eliminar objeções */}
      <section id="faq">
        <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Carregando...</div>}>
          <LazyFAQ />
        </Suspense>
      </section>

      {/* 10. Footer Institucional */}
      <Suspense fallback={<div />}>
        <InstitutionalFooter />
      </Suspense>
    </main>
  );
};

export default Index;
