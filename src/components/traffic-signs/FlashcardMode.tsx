import React, { useState, useEffect } from 'react';
import { ModernCard } from '@/components/ui/modern-card';
import { ModernButton } from '@/components/ui/modern-button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, RotateCcw, BookOpen, X, RotateCw, ArrowLeft } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto p-6 pb-safe">
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
            <ModernButton variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </ModernButton>
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
      <div className="relative h-[60vh] sm:h-96 mb-6">
        <div
          className={`relative w-full h-full transition-transform duration-600 preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''
            } ${isAnimating ? 'pointer-events-none' : ''}`}
          onClick={handleFlip}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.6s',
          }}
        >
          {/* Front of card (Image) */}
          <ModernCard
            className="absolute inset-0 w-full h-full backface-hidden flex flex-col items-center justify-center p-6 text-center border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl rounded-2xl"
            variant="elevated"
            style={{
              backfaceVisibility: 'hidden',
            }}
          >
            <div className="mb-6 relative w-48 h-48 mx-auto">
              {currentSign.image_url ? (
                <img
                  src={currentSign.image_url}
                  alt="Traffic Sign"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <span className="text-4xl font-bold text-gray-400">{currentSign.code}</span>
                </div>
              )}
            </div>

            <h3 className="text-xl font-bold text-foreground mb-2">
              Qual é o significado desta placa?
            </h3>
            <p className="text-sm text-muted-foreground">
              Toque para ver a resposta
            </p>
          </ModernCard>

          {/* Back of card (Information) */}
          <ModernCard
            className="absolute inset-0 w-full h-full backface-hidden flex flex-col items-center justify-center p-6 text-center border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl rounded-2xl rotate-y-180"
            variant="elevated"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="mb-4">
              <Badge className="mb-2">{currentSign.category}</Badge>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                {currentSign.name}
              </h3>
              <p className="text-muted-foreground">
                {currentSign.description}
              </p>
            </div>
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