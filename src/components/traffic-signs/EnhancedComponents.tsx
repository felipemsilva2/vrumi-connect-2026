import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Bookmark, 
  Eye, 
  Play,
  ChevronRight,
  ArrowUpDown,
  SlidersHorizontal
} from 'lucide-react';

// Sistema de cores acessível por categoria
const categoryStyles = {
  'Regulamentação': {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: '🛑',
    progress: 'bg-red-500'
  },
  'Advertência': {
    bg: 'bg-yellow-50', 
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    icon: '⚠️',
    progress: 'bg-yellow-500'
  },
  'Serviços Auxiliares': {
    bg: 'bg-blue-50',
    text: 'text-blue-700', 
    border: 'border-blue-200',
    icon: '🏪',
    progress: 'bg-blue-500'
  },
  'Indicação': {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200', 
    icon: '✅',
    progress: 'bg-green-500'
  },
  'Obras': {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    icon: '🚧',
    progress: 'bg-orange-500'
  }
};

interface TrafficSign {
  id: string;
  code: string;
  name: string;
  category: string;
  image_url: string;
  description: string;
  studied: boolean;
  progress: number;
  isFavorite: boolean;
}

interface EnhancedTrafficSignsLibraryProps {
  signs: TrafficSign[];
  viewMode: 'grid' | 'list' | 'compact';
  onViewModeChange: (mode: 'grid' | 'list' | 'compact') => void;
  onSignClick: (sign: TrafficSign) => void;
  onFavoriteToggle: (signId: string) => void;
  onQuickStudy: (signId: string) => void;
}

// Card Aprimorado com Proporções Responsivas
const EnhancedTrafficSignCard: React.FC<{
  sign: TrafficSign;
  viewMode: 'grid' | 'list' | 'compact';
  onClick: () => void;
  onFavorite: () => void;
  onStudy: () => void;
}> = ({ sign, viewMode, onClick, onFavorite, onStudy }) => {
  const styles = categoryStyles[sign.category as keyof typeof categoryStyles];
  
  if (viewMode === 'list') {
    return (
      <Card 
        className="hover:shadow-md transition-all duration-200 hover:border-gray-300 cursor-pointer group"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Imagem otimizada */}
            <div className="w-20 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              <img 
                src={sign.image_url} 
                alt={sign.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            
            {/* Informações principais */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={`${styles.bg} ${styles.text} ${styles.border} px-2 py-1 text-xs`}>
                  {styles.icon} {sign.category}
                </Badge>
                <span className="text-xs font-mono text-gray-500">{sign.code}</span>
              </div>
              <h3 className="font-semibold text-gray-900 truncate">{sign.name}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{sign.description}</p>
            </div>
            
            {/* Progresso e ações */}
            <div className="flex items-center gap-3">
              <div className="w-24">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Progresso</span>
                  <span className="text-xs font-medium">{sign.progress}%</span>
                </div>
                <Progress value={sign.progress} className="h-1" />
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onFavorite(); }}
                className={sign.isFavorite ? 'text-yellow-500' : 'text-gray-400'}
              >
                <Bookmark className="w-4 h-4" fill={sign.isFavorite ? 'currentColor' : 'none'} />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onStudy(); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Play className="w-4 h-4 mr-1" />
                Estudar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (viewMode === 'compact') {
    return (
      <Card 
        className="hover:shadow-md transition-all duration-200 cursor-pointer group"
        onClick={onClick}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-9 bg-gray-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
              <img 
                src={sign.image_url} 
                alt={sign.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-500">{sign.code}</span>
                <Badge className={`${styles.bg} ${styles.text} px-1 py-0.5 text-xs`}>
                  {styles.icon}
                </Badge>
              </div>
              <h4 className="font-medium text-sm text-gray-900 truncate">{sign.name}</h4>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${styles.progress}`} />
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onFavorite(); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
              >
                <Bookmark className="w-3 h-3" fill={sign.isFavorite ? 'currentColor' : 'none'} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Grid mode (default)
  return (
    <Card 
      className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer group"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge className={`${styles.bg} ${styles.text} ${styles.border}`}>
            {styles.icon} {sign.category}
          </Badge>
          <span className="text-xs font-mono text-gray-500">{sign.code}</span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Imagem com proporção responsiva */}
        <div className="aspect-[16/10] bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden relative group">
          <img 
            src={sign.image_url} 
            alt={sign.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
          {/* Overlay de ações no hover */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onStudy(); }}
                className="bg-white text-gray-900 hover:bg-gray-100"
              >
                <Play className="w-4 h-4 mr-1" />
                Estudar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onFavorite(); }}
                className="bg-white text-gray-900 hover:bg-gray-100 p-2"
              >
                <Bookmark className="w-4 h-4" fill={sign.isFavorite ? 'currentColor' : 'none'} />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Informações da placa */}
        <h3 className="font-semibold text-gray-900 text-center mb-2">{sign.name}</h3>
        
        {/* Barra de progresso integrada */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Progresso</span>
            <span className="text-xs font-medium">{sign.progress}%</span>
          </div>
          <Progress value={sign.progress} className={`h-1 ${styles.progress}`} />
        </div>
      </CardContent>
    </Card>
  );
};

// Barra de ferramentas aprimorada
const EnhancedToolbar: React.FC<{
  viewMode: 'grid' | 'list' | 'compact';
  onViewModeChange: (mode: 'grid' | 'list' | 'compact') => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}> = ({ 
  viewMode, 
  onViewModeChange, 
  searchValue, 
  onSearchChange,
  selectedCategories,
  onCategoriesChange,
  sortBy,
  onSortChange 
}) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search e filtros principais */}
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar placas por código, nome ou descrição..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="code">Ordenar por Código</option>
              <option value="name">Ordenar por Nome</option>
              <option value="category">Ordenar por Categoria</option>
              <option value="progress">Ordenar por Progresso</option>
            </select>
          </div>
          
          {/* Controles de visualização */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className="h-8 w-8 p-0"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                className="h-8 w-8 p-0"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'compact' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('compact')}
                className="h-8 w-8 p-0"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            </div>
            
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </div>
        
        {/* Categorias rápidas */}
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(categoryStyles).map(([category, styles]) => (
            <Button
              key={category}
              variant={selectedCategories.includes(category) ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => {
                if (selectedCategories.includes(category)) {
                  onCategoriesChange(selectedCategories.filter(c => c !== category));
                } else {
                  onCategoriesChange([...selectedCategories, category]);
                }
              }}
              className={`${selectedCategories.includes(category) ? styles.text : ''}`}
            >
              {styles.icon} {category}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Estado vazio melhorado
const EmptyState: React.FC = () => (
  <Card className="border-dashed">
    <CardContent className="p-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Search className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Nenhuma placa encontrada
      </h3>
      <p className="text-gray-600 mb-4">
        Tente ajustar seus filtros ou termos de busca
      </p>
      <Button variant="outline" size="sm">
        Limpar filtros
      </Button>
    </CardContent>
  </Card>
);

// Skeleton loading aprimorado
const TrafficSignCardSkeleton: React.FC<{ viewMode: 'grid' | 'list' | 'compact' }> = ({ viewMode }) => {
  if (viewMode === 'list') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-16 bg-gray-200 rounded-lg animate-pulse" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (viewMode === 'compact') {
    return (
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-9 bg-gray-200 rounded animate-pulse" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-3 w-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-6 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="aspect-[16/10] bg-gray-200 rounded-lg mb-4 animate-pulse" />
        <div className="h-5 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto" />
      </CardContent>
    </Card>
  );
};

export { 
  EnhancedTrafficSignCard, 
  EnhancedToolbar, 
  EmptyState, 
  TrafficSignCardSkeleton,
  categoryStyles 
};