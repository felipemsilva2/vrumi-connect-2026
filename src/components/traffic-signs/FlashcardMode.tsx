import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, RotateCcw, BookOpen, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TrafficSign {
  id: string;
  code: string;
  name: string;
  category: string;
  image_url: string;
  description: string;
}

interface FlashcardModeProps {
  signs: TrafficSign[];
  initialIndex?: number;
  onClose?: () => void;
  category?: string;
}

const categoryColors = {
  'Regulamentação': 'bg-red-100 text-red-800 border-red-200',
  'Advertência': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Serviços Auxiliares': 'bg-blue-100 text-blue-800 border-blue-200',
  'Indicação': 'bg-green-100 text-green-800 border-green-200',
  'Obras': 'bg-orange-100 text-orange-800 border-orange-200',
};

const categoryIcons = {
  'Regulamentação': '🛑',
  'Advertência': '⚠️',
  'Serviços Auxiliares': '🏪',
  'Indicação': '✅',
  'Obras': '🚧',
};

export default function FlashcardMode({ signs, initialIndex = 0, onClose, category }: FlashcardModeProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [categoryProgress, setCategoryProgress] = useState<any>(null);
  const { toast } = useToast();

  const currentSign = signs[currentIndex];

  useEffect(() => {
    fetchCategoryProgress();
  }, [category]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        handleFlip();
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        handlePrevious();
      } else if (event.code === 'ArrowRight') {
        event.preventDefault();
        handleNext();
      } else if (event.code === 'Escape' && onClose) {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, isFlipped, onClose]);

  const fetchCategoryProgress = async () => {
    if (!category) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .rpc('get_category_progress', {
          p_user_id: user.id,
          p_category: category
        });

      if (error) {
        console.error('Erro ao buscar progresso da categoria:', error);
      } else {
        setCategoryProgress(data);
      }
    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
    }
  };

  const handleFlip = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsFlipped(!isFlipped);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handlePrevious = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : signs.length - 1));
      setIsAnimating(false);
    }, 300);
  };

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev < signs.length - 1 ? prev + 1 : 0));
      setIsAnimating(false);
    }, 300);
  };

  const handleReset = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(0);
      setIsAnimating(false);
    }, 300);
  };

  const handleDifficultyResponse = async (response: 'easy' | 'medium' | 'hard') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para salvar progresso",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .rpc('update_user_sign_progress', {
          p_user_id: user.id,
          p_sign_id: currentSign.id,
          p_correct: response === 'easy'
        });

      if (error) {
        console.error('Erro ao atualizar progresso:', error);
        toast({
          title: "Erro",
          description: "Não foi possível salvar seu progresso",
          variant: "destructive",
        });
      } else {
        // Show feedback based on response
        const messages = {
          easy: "Ótimo! Esta placa será mostrada com menos frequência.",
          medium: "Entendido! Vamos revisar esta placa novamente em breve.",
          hard: "Vamos praticar mais! Esta placa aparecerá com mais frequência."
        };
        
        toast({
          title: "Progresso salvo!",
          description: messages[response],
        });

        // Move to next card after response
        handleNext();
      }
    } catch (error) {
      console.error('Erro ao processar resposta:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua resposta",
        variant: "destructive",
      });
    }
  };

  if (!currentSign) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Nenhuma placa disponível para estudo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Badge className={categoryColors[currentSign.category as keyof typeof categoryColors]}>
              {categoryIcons[currentSign.category as keyof typeof categoryIcons]} {currentSign.category}
            </Badge>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentIndex + 1} de {signs.length}
            </span>
          </div>
          
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Category Progress Bar */}
        {categoryProgress && (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Domínio da Categoria
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {categoryProgress.progress_percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${categoryProgress.progress_percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
              <span>{categoryProgress.mastered_signs} dominadas</span>
              <span>{categoryProgress.reviewed_signs} revisadas</span>
              <span>de {categoryProgress.total_signs} total</span>
            </div>
          </div>
        )}
      </div>

      {/* Flashcard Container */}
      <div className="relative h-96 mb-6">
        <div 
          className={`relative w-full h-full transition-transform duration-600 preserve-3d cursor-pointer ${
            isFlipped ? 'rotate-y-180' : ''
          } ${isAnimating ? 'pointer-events-none' : ''}`}
          onClick={handleFlip}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.6s',
          }}
        >
          {/* Front of card (Image) */}
          <div 
            className="absolute inset-0 w-full h-full backface-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
            }}
          >
            <div className="text-center p-8">
              <div className="aspect-square w-64 h-64 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center overflow-hidden mx-auto">
                {currentSign.image_url ? (
                  <img
                    src={currentSign.image_url}
                    alt={currentSign.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://via.placeholder.com/300x300/e5e7eb/6b7280?text=${encodeURIComponent(currentSign.code)}`;
                    }}
                  />
                ) : (
                  <div className="text-gray-400 text-6xl font-bold">
                    {currentSign.code}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Clique para ver as informações
              </p>
            </div>
          </div>

          {/* Back of card (Information) */}
          <div 
            className="absolute inset-0 w-full h-full backface-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg flex flex-col justify-center p-8"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="space-y-6">
              {/* Code */}
              <div className="text-center">
                <span className="text-2xl font-mono font-bold text-gray-900 dark:text-gray-100">
                  {currentSign.code}
                </span>
              </div>

              {/* Name */}
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {currentSign.name}
                </h3>
              </div>

              {/* Description */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed text-center">
                  {currentSign.description}
                </p>
              </div>

              {/* Click hint */}
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Clique para ver a imagem novamente
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="space-y-4">
        {/* Assessment Buttons (only show when card is flipped) */}
        {isFlipped && (
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={() => handleDifficultyResponse('hard')}
              disabled={isAnimating}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              <span className="font-semibold">Errei</span>
              <span className="text-xs ml-1">😅</span>
            </Button>
            
            <Button
              onClick={() => handleDifficultyResponse('medium')}
              disabled={isAnimating}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
              size="lg"
            >
              <span className="font-semibold">Dúvida</span>
              <span className="text-xs ml-1">🤔</span>
            </Button>
            
            <Button
              onClick={() => handleDifficultyResponse('easy')}
              disabled={isAnimating}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <span className="font-semibold">Acertei</span>
              <span className="text-xs ml-1">😊</span>
            </Button>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4">
          <Button
            onClick={handlePrevious}
            disabled={isAnimating}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleFlip}
              disabled={isAnimating}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Virar
            </Button>

            <Button
              onClick={handleReset}
              disabled={isAnimating}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Reiniciar
            </Button>
          </div>

          <Button
            onClick={handleNext}
            disabled={isAnimating}
            variant="outline"
            className="flex items-center gap-2"
          >
            Próximo
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Progresso</span>
          <span>{currentIndex + 1} / {signs.length}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / signs.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
        <p>Atalhos do teclado:</p>
        <p>Espaço: Virar carta | ← → : Navegar | Esc: Fechar</p>
      </div>
    </div>
  );
}