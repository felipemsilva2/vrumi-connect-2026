import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Zap, Clock, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { analytics } from '@/utils/studyAnalytics';

interface StudyModesPanelProps {
  signsCount: number;
  category?: string;
  onStartLinear: () => void;
  onStartSmart: () => void;
  onStartChallenge: () => void;
  onOpenModal: () => void;
  isInitiallyOpen?: boolean;
}

export default function StudyModesPanel({
  signsCount,
  category = 'Todas as Categorias',
  onStartLinear,
  onStartSmart,
  onStartChallenge,
  onOpenModal,
  isInitiallyOpen = true
}: StudyModesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(isInitiallyOpen);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (signsCount > 0) {
      setIsExpanded(true);
    }
  }, [signsCount]);

  const toggleExpanded = () => {
    setIsAnimating(true);
    setIsExpanded(!isExpanded);
    analytics.trackButtonInteraction('study_modes_panel', isExpanded ? 'collapse' : 'expand');
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const handleStartMode = (mode: string, callback: () => void) => {
    analytics.trackStudyModeSelection(mode, signsCount, category);
    callback();
  };

  const studyModes = [
    {
      id: 'linear',
      title: 'Estudo Linear',
      description: 'Revise todas as placas em ordem sequencial',
      icon: BookOpen,
      color: 'bg-blue-500 hover:bg-blue-600',
      variant: 'outline' as const,
      onClick: () => handleStartMode('linear', onStartLinear)
    },
    {
      id: 'smart',
      title: 'Estudo Inteligente',
      description: 'Aprendizado adaptativo com IA',
      icon: Zap,
      color: 'bg-purple-600 hover:bg-purple-700',
      variant: 'default' as const,
      onClick: () => handleStartMode('smart', onStartSmart)
    },
    {
      id: 'challenge',
      title: 'Desafio 60s',
      description: 'Teste seus conhecimentos contra o tempo',
      icon: Clock,
      color: 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600',
      variant: 'default' as const,
      onClick: () => handleStartMode('challenge', onStartChallenge)
    }
  ];

  if (signsCount === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Card 
        className={`mb-6 transition-all duration-300 ${isAnimating ? 'scale-[0.98]' : 'scale-100'} ${
          isExpanded ? 'shadow-lg' : 'shadow-md'
        } border-l-4 border-l-blue-500`}
        role="region"
        aria-label="Painel de modalidades de estudo"
      >
        <CardContent className="p-4">
          {/* Header with toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Modalidades de Estudo
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {signsCount} placa{signsCount !== 1 ? 's' : ''} disponível{signsCount !== 1 ? 'eis' : ''} • {category}
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpanded}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              aria-label={isExpanded ? "Recolher opções de estudo" : "Expandir opções de estudo"}
              aria-expanded={isExpanded}
              aria-controls="study-modes-content"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              )}
            </Button>
          </div>

          {/* Collapsible content */}
          <div 
            id="study-modes-content"
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
            role="group"
            aria-label="Opções de modalidades de estudo"
          >
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4" role="list">
                {studyModes.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <Tooltip key={mode.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={mode.variant}
                          className={`w-full flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md ${
                            mode.id === 'challenge' ? mode.color : ''
                          } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                          onClick={mode.onClick}
                          role="listitem"
                          aria-label={`Iniciar ${mode.title}`}
                        >
                          <Icon className="w-4 h-4" aria-hidden="true" />
                          <span className="font-medium">{mode.title}</span>
                          {mode.id === 'challenge' && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              60s
                            </Badge>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-medium">{mode.description}</p>
                          <p className="text-xs text-gray-500">
                            {mode.id === 'challenge' 
                              ? '60 segundos para acertar o máximo de placas'
                              : `${signsCount} placa${signsCount !== 1 ? 's' : ''} disponível${signsCount !== 1 ? 'eis' : ''}`
                            }
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

              {/* Additional options */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-sm text-gray-600 dark:text-gray-400 flex-1" role="note">
                  💡 Dica: Use o filtro acima para selecionar categorias específicas antes de iniciar o estudo.
                </div>
                
                <Button
                  onClick={onOpenModal}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 whitespace-nowrap focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  aria-label="Abrir modal com todas as opções de estudo"
                >
                  <Play className="w-4 h-4" aria-hidden="true" />
                  Ver todas as opções
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}