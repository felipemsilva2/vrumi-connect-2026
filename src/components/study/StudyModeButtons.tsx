import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BookOpen, Zap, Clock, Play } from 'lucide-react';
import { analytics } from '@/utils/studyAnalytics';

interface StudyModeButtonsProps {
  onStartLinear: () => void;
  onStartSmart: () => void;
  onStartChallenge: () => void;
  signsCount: number;
  disabled?: boolean;
  className?: string;
}

export default function StudyModeButtons({
  onStartLinear,
  onStartSmart,
  onStartChallenge,
  signsCount,
  disabled = false,
  className = ''
}: StudyModeButtonsProps) {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const buttons = [
    {
      id: 'linear',
      label: 'Estudo Linear',
      tooltip: 'Revise todas as placas em ordem sequencial',
      icon: BookOpen,
      color: 'bg-blue-500 hover:bg-blue-600',
      variant: 'outline' as const,
      onClick: onStartLinear
    },
    {
      id: 'smart',
      label: 'Estudo Inteligente',
      tooltip: 'Aprendizado adaptativo com IA',
      icon: Zap,
      color: 'bg-purple-600 hover:bg-purple-700',
      variant: 'default' as const,
      onClick: onStartSmart
    },
    {
      id: 'challenge',
      label: 'Desafio 60s',
      tooltip: 'Teste seus conhecimentos contra o tempo',
      icon: Clock,
      color: 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600',
      variant: 'default' as const,
      onClick: onStartChallenge
    }
  ];

  return (
    <TooltipProvider>
      <div className={`flex flex-wrap gap-3 ${className}`}>
        {buttons.map((button) => {
          const Icon = button.icon;
          const isHovered = hoveredButton === button.id;
          const isDisabled = disabled || signsCount === 0;

          return (
            <Tooltip key={button.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Button
                    variant={button.variant}
                    className={`flex items-center gap-2 transition-all duration-200 ${
                      button.id === 'challenge' ? button.color : ''
                    } ${
                      isHovered ? 'scale-105 shadow-lg' : 'hover:scale-105 hover:shadow-lg'
                    } ${
                      isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => {
                      analytics.trackButtonInteraction(button.id, 'click');
                      button.onClick();
                    }}
                    disabled={isDisabled}
                    onMouseEnter={() => {
                      setHoveredButton(button.id);
                      analytics.trackButtonInteraction(button.id, 'hover');
                    }}
                    onMouseLeave={() => setHoveredButton(null)}
                  >
                    <Icon className={`w-4 h-4 ${isHovered ? 'animate-pulse' : ''}`} />
                    <span className="font-medium">{button.label}</span>
                    
                    {/* Indicador visual de ação */}
                    {isHovered && (
                      <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1 animate-bounce">
                        <Play className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </Button>
                  
                  {/* Badge de contador para cada modo */}
                  {!isDisabled && (
                    <div className={`absolute -top-2 -right-2 bg-gray-800 text-white text-xs rounded-full px-2 py-1 ${
                      isHovered ? 'scale-110' : ''
                    } transition-transform duration-200`}>
                      {signsCount}
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">{button.tooltip}</p>
                  <p className="text-xs text-gray-500">
                    {button.id === 'challenge' 
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
    </TooltipProvider>
  );
}