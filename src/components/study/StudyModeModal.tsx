import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Zap, Clock, X, Play } from 'lucide-react';
import { analytics } from '@/utils/studyAnalytics';

interface StudyModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartLinear: () => void;
  onStartSmart: () => void;
  onStartChallenge: () => void;
  signsCount: number;
  category?: string;
}

export default function StudyModeModal({
  isOpen,
  onClose,
  onStartLinear,
  onStartSmart,
  onStartChallenge,
  signsCount,
  category = 'Todas as Categorias'
}: StudyModeModalProps) {
  const studyModes = [
    {
      id: 'linear',
      title: 'Estudo Linear',
      description: 'Revise todas as placas em ordem sequencial. Ideal para conhecer todas as placas de uma categoria.',
      icon: BookOpen,
      color: 'bg-blue-500 hover:bg-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      onClick: onStartLinear
    },
    {
      id: 'smart',
      title: 'Estudo Inteligente',
      description: 'Aprendizado adaptativo baseado em IA que prioriza suas dificuldades e otimiza seu tempo de estudo.',
      icon: Zap,
      color: 'bg-purple-600 hover:bg-purple-700',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      onClick: onStartSmart
    },
    {
      id: 'challenge',
      title: 'Desafio 60s',
      description: 'Teste seus conhecimentos contra o tempo! Você tem 60 segundos para acertar o máximo de placas possível.',
      icon: Clock,
      color: 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      onClick: onStartChallenge
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                Escolha seu Modo de Estudo
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                <span className="inline-flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    {category}
                  </Badge>
                  <span className="text-gray-600">
                    • {signsCount} placa{signsCount !== 1 ? 's' : ''} disponível{signsCount !== 1 ? 'eis' : ''}
                  </span>
                </span>
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                analytics.trackModalInteraction('closed', 'study_mode_selection');
                onClose();
              }}
              className="p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-6">
          {studyModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <div
                key={mode.id}
                className={`p-6 rounded-lg border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200 cursor-pointer group ${mode.bgColor}`}
                onClick={() => {
                  analytics.trackStudyModeSelection(mode.id, signsCount, category);
                  mode.onClick();
                }}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${mode.color} text-white group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold ${mode.textColor} mb-2`}>
                      {mode.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                      {mode.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{signsCount} placas</span>
                        {mode.id === 'challenge' && (
                          <Badge variant="outline" className="text-xs">
                            60 segundos
                          </Badge>
                        )}
                      </div>
                      
                      <Button
                        className={`${mode.color} text-white flex items-center gap-2 group-hover:scale-105 transition-transform duration-200`}
                        onClick={(e) => {
                          e.stopPropagation();
                          analytics.trackStudyModeSelection(mode.id, signsCount, category);
                          mode.onClick();
                        }}
                      >
                        <Play className="w-4 h-4" />
                        Iniciar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={() => {
              analytics.trackModalInteraction('closed', 'study_mode_selection');
              onClose();
            }}
            className="px-6"
          >
            Voltar à Biblioteca
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}