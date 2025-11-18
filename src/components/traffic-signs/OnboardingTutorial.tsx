import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronRight, 
  Target, 
  Clock, 
  TrendingUp,
  BookOpen,
  Zap,
  Users,
  Award
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: () => void;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'categories',
    title: 'Explore por Categorias',
    description: 'As placas são organizadas em 5 categorias principais para facilitar seu aprendizado',
    icon: <Target className="w-6 h-6" />,
  },
  {
    id: 'search',
    title: 'Busca Inteligente',
    description: 'Encontre placas por código, nome ou descrição com nosso sistema de busca avançado',
    icon: <BookOpen className="w-6 h-6" />,
  },
  {
    id: 'study-modes',
    title: 'Modos de Estudo',
    description: 'Use flashcards, desafios cronometrados ou estudo inteligente baseado em seu progresso',
    icon: <Zap className="w-6 h-6" />,
  },
  {
    id: 'progress',
    title: 'Acompanhe seu Progresso',
    description: 'Monitore seu desempenho e veja estatísticas detalhadas do seu aprendizado',
    icon: <TrendingUp className="w-6 h-6" />,
  },
  {
    id: 'achievements',
    title: 'Conquistas e Rankings',
    description: 'Ganhe conquistas e compete com outros estudantes nos rankings semanais',
    icon: <Award className="w-6 h-6" />,
  }
];

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onStepComplete: (stepId: string) => void;
  completedSteps: string[];
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  isOpen,
  onClose,
  onStepComplete,
  completedSteps
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Bem-vindo à Biblioteca de Placas!
              </h2>
              <p className="text-gray-600">
                Vamos te mostrar como aproveitar ao máximo nossa plataforma de estudo
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Seu progresso</span>
              <span className="text-sm font-medium">
                {completedSteps.length}/{onboardingSteps.length} completos
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedSteps.length / onboardingSteps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-6">
            {onboardingSteps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = !isCompleted && (index === completedSteps.length);
              
              return (
                <div
                  key={step.id}
                  className={`
                    flex items-start gap-4 p-4 rounded-lg border-2 transition-all
                    ${
                      isCompleted 
                        ? 'bg-green-50 border-green-200' 
                        : isCurrent 
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200'
                    }
                  `}
                >
                  <div className={`
                    flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                    ${
                      isCompleted 
                        ? 'bg-green-500 text-white'
                        : isCurrent
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                    }
                  `}>
                    {isCompleted ? '✓' : step.icon}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-1 ${
                      isCompleted ? 'text-green-900' : isCurrent ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {step.title}
                    </h3>
                    <p className={`text-sm ${
                      isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                  
                  {!isCompleted && (
                    <Button
                      variant={isCurrent ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onStepComplete(step.id)}
                      className="flex-shrink-0"
                    >
                      {isCurrent ? (
                        <>
                          Começar
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </>
                      ) : (
                        'Marcar como feito'
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Pular tutorial
            </Button>
            {completedSteps.length === onboardingSteps.length && (
              <Button
                onClick={onClose}
                className="flex-1"
              >
                Começar a estudar!
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Componente de guia contextual para features específicas
interface ContextualGuideProps {
  isOpen: boolean;
  onClose: () => void;
  target: 'search' | 'filters' | 'study-modes' | 'progress';
}

export const ContextualGuide: React.FC<ContextualGuideProps> = ({
  isOpen,
  onClose,
  target
}) => {
  if (!isOpen) return null;

  const guides = {
    search: {
      title: 'Busca Inteligente',
      description: 'Digite o código da placa (ex: R-1), o nome ou palavras-chave da descrição.',
      tips: [
        'Use códigos como "A-1" ou "R-20" para busca direta',
        'Busque por palavras-chave como "pare" ou "pedestre"',
        'Use filtros para refinar os resultados'
      ]
    },
    filters: {
      title: 'Filtros Avançados',
      description: 'Combine múltiplos filtros para encontrar exatamente o que precisa.',
      tips: [
        'Selecione múltiplas categorias ao mesmo tempo',
        'Filtre por placas que já estudou ou ainda não viu',
        'Use ordenação para priorizar seu estudo'
      ]
    },
    'study-modes': {
      title: 'Modos de Estudo',
      description: 'Escolha o modo que melhor se adapta ao seu estilo de aprendizado.',
      tips: [
        'Flashcards: Visualização rápida e memorização',
        'Desafio 60s: Teste seus conhecimentos contra o tempo',
        'Estudo Inteligente: Focado nas placas que você mais precisa rever'
      ]
    },
    progress: {
      title: 'Acompanhamento de Progresso',
      description: 'Monitore seu desempenho e identifique áreas de melhoria.',
      tips: [
        'A barra de progresso mostra seu conhecimento em cada placa',
        'Placas verdes indicam domínio, vermelhas precisam de revisão',
        'Use estatísticas para otimizar seu tempo de estudo'
      ]
    }
  };

  const guide = guides[target];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{guide.title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              ✕
            </Button>
          </div>
          
          <p className="text-gray-600 mb-4">{guide.description}</p>
          
          <div className="space-y-2 mb-4">
            {guide.tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
          
          <Button onClick={onClose} className="w-full">
            Entendi!
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default { OnboardingTutorial, ContextualGuide };