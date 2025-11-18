import React, { useState, useEffect } from 'react';
import { Heart, HeartOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface FavoritesManager {
  getFavorites(): Set<string>;
  addFavorite(signId: string): void;
  removeFavorite(signId: string): void;
  isFavorite(signId: string): boolean;
  getFavoritesCount(): number;
}

class LocalStorageFavorites implements FavoritesManager {
  private readonly STORAGE_KEY = 'vrumi_favorites';
  private favorites: Set<string>;

  constructor() {
    this.favorites = this.loadFavorites();
  }

  private loadFavorites(): Set<string> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return new Set(stored ? JSON.parse(stored) : []);
    } catch (error) {
      console.warn('Erro ao carregar favoritos:', error);
      return new Set();
    }
  }

  private saveFavorites(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.favorites)));
    } catch (error) {
      console.warn('Erro ao salvar favoritos:', error);
    }
  }

  getFavorites(): Set<string> {
    return new Set(this.favorites);
  }

  addFavorite(signId: string): void {
    this.favorites.add(signId);
    this.saveFavorites();
  }

  removeFavorite(signId: string): void {
    this.favorites.delete(signId);
    this.saveFavorites();
  }

  isFavorite(signId: string): boolean {
    return this.favorites.has(signId);
  }

  getFavoritesCount(): number {
    return this.favorites.size;
  }
}

const favoritesManager = new LocalStorageFavorites();

interface FavoriteButtonProps {
  signId: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'default';
  showTooltip?: boolean;
  onToggle?: (isFavorite: boolean) => void;
}

export function FavoriteButton({
  signId,
  size = 'md',
  variant = 'ghost',
  showTooltip = true,
  onToggle
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(favoritesManager.isFavorite(signId));

  useEffect(() => {
    setIsFavorite(favoritesManager.isFavorite(signId));
  }, [signId]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    
    if (newFavoriteState) {
      favoritesManager.addFavorite(signId);
      toast.success('Adicionado aos favoritos');
    } else {
      favoritesManager.removeFavorite(signId);
      toast.info('Removido dos favoritos');
    }
    
    if (onToggle) {
      onToggle(newFavoriteState);
    }
  };

  const buttonSizes = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-10 h-10'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const button = (
    <Button
      variant={variant}
      size="icon"
      onClick={handleToggle}
      className={`${buttonSizes[size]} transition-all duration-200 hover:scale-110 ${
        isFavorite ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'
      }`}
    >
      {isFavorite ? (
        <Heart className={`${iconSizes[size]} fill-current`} />
      ) : (
        <HeartOff className={iconSizes[size]} />
      )}
    </Button>
  );

  if (!showTooltip) {
    return button;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent>
          {isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const FavoritesUtils = {
  getFavorites: (): string[] => Array.from(favoritesManager.getFavorites()),
  getFavoritesCount: (): number => favoritesManager.getFavoritesCount(),
  isFavorite: (signId: string): boolean => favoritesManager.isFavorite(signId)
};