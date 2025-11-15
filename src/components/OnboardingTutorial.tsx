import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetElement?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao Vrumi! 🚗",
    description: "Vamos te mostrar como aproveitar ao máximo nossa plataforma de estudos para CNH.",
  },
  {
    id: "dashboard",
    title: "Seu Dashboard",
    description: "Aqui você encontra seu progresso, estatísticas e acesso rápido aos materiais de estudo.",
    targetElement: "[data-tutorial='dashboard']",
    position: "bottom",
  },
  {
    id: "flashcards",
    title: "Flashcards Interativos",
    description: "Estude com flashcards dinâmicos que se adaptam ao seu ritmo de aprendizado.",
    targetElement: "[data-tutorial='flashcards']",
    position: "right",
  },
  {
    id: "simulados",
    title: "Simulados Realistas",
    description: "Pratique com simulados que simulam as questões reais do DETRAN.",
    targetElement: "[data-tutorial='simulados']",
    position: "right",
  },
  {
    id: "progresso",
    title: "Acompanhe seu Progresso",
    description: "Monitore seu desempenho e veja suas estatísticas de estudo em tempo real.",
    targetElement: "[data-tutorial='progresso']",
    position: "top",
  },
  {
    id: "complete",
    title: "Você está pronto! 🎉",
    description: "Parabéns! Você conheceu os principais recursos. Comece seus estudos agora!",
  },
];

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  userId?: string;
}

export function OnboardingTutorial({ isOpen, onClose, onComplete, userId }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;
  const isFirstStep = currentStep === 0;

  useEffect(() => {
    if (isOpen && currentStepData.targetElement) {
      const element = document.querySelector(currentStepData.targetElement) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        element.style.position = 'relative';
        element.style.zIndex = '1000';
        element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2)';
        element.style.borderRadius = '8px';
      }
    } else {
      if (highlightedElement) {
        highlightedElement.style.position = '';
        highlightedElement.style.zIndex = '';
        highlightedElement.style.boxShadow = '';
        highlightedElement.style.borderRadius = '';
        setHighlightedElement(null);
      }
    }

    return () => {
      if (highlightedElement) {
        highlightedElement.style.position = '';
        highlightedElement.style.zIndex = '';
        highlightedElement.style.boxShadow = '';
        highlightedElement.style.borderRadius = '';
      }
    };
  }, [isOpen, currentStepData.targetElement, highlightedElement]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Save that user has seen the onboarding
    if (userId) {
      localStorage.setItem(`onboarding_seen_${userId}`, 'true');
    }
    onComplete?.();
    onClose();
    setCurrentStep(0);
  };

  const handleSkip = () => {
    // Save that user has seen the onboarding (even if skipped)
    if (userId) {
      localStorage.setItem(`onboarding_seen_${userId}`, 'true');
    }
    onClose();
    setCurrentStep(0);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-[1001] flex items-center justify-center"
        onClick={handleSkip}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative z-[1002]"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="max-w-md w-full mx-4 bg-background border-border shadow-xl">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-semibold">
                      {currentStep + 1}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {currentStep + 1} de {onboardingSteps.length}
                  </span>
                </div>
                <button
                  onClick={handleSkip}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {currentStepData.title}
                </h3>
                <p className="text-muted-foreground">
                  {currentStepData.description}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  disabled={isFirstStep}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="text-muted-foreground"
                  >
                    Pular
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="gap-2"
                  >
                    {isLastStep ? (
                      <>
                        Finalizar
                        <CheckCircle className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Próximo
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}