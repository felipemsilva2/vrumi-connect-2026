import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModernCard, ModernCardContent, ModernCardHeader } from '@/components/ui/modern-card';
import { ModernButton } from '@/components/ui/modern-button';
import { Search, Filter, X, BookOpen, Play, Zap, Clock, Trophy, RotateCcw, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import FlashcardMode from '@/components/traffic-signs/FlashcardMode';
import TimedChallenge from '@/components/traffic-signs/TimedChallenge';
import StudyModeModal from '@/components/study/StudyModeModal';
import StudyModeButtons from '@/components/study/StudyModeButtons';
import { SubscriptionGate } from '@/components/auth/SubscriptionGate';

interface TrafficSign {
  id: string;
  code: string;
  name: string;
  category: string;
  image_url: string;
  description: string;
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

interface TrafficSignsLibraryProps {
  user: any;
  profile: any;
}

export default function TrafficSignsLibrary({ user, profile }: TrafficSignsLibraryProps) {
  const [signs, setSigns] = useState<TrafficSign[]>([]);
  const [filteredSigns, setFilteredSigns] = useState<TrafficSign[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSign, setSelectedSign] = useState<TrafficSign | null>(null);
  const [flashcardMode, setFlashcardMode] = useState(false);
  const [timedChallengeMode, setTimedChallengeMode] = useState(false);
  const [flashcardSigns, setFlashcardSigns] = useState<TrafficSign[]>([]);
  const [loading, setLoading] = useState(true);
  const [studyModeModalOpen, setStudyModeModalOpen] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(24);

  const categories = ['Todas', 'Regulamentação', 'Advertência', 'Serviços Auxiliares', 'Indicação', 'Obras'];

  useEffect(() => {
    fetchTrafficSigns();
  }, []);

  useEffect(() => {
    filterSigns();
  }, [signs, selectedCategory, searchTerm]);

  // Scroll to study modes section when activated
  useEffect(() => {
    if (flashcardMode || timedChallengeMode) {
      const studyModesElement = document.querySelector('[data-study-modes]');
      if (studyModesElement) {
        studyModesElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [flashcardMode, timedChallengeMode]);

  const fetchTrafficSigns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('traffic_signs')
        .select('*')
        .order('code');

      if (error) {
        console.error('Erro ao buscar placas:', error);
      } else {
        setSigns(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar placas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSigns = () => {
    let filtered = signs;

    if (selectedCategory !== 'Todas') {
      filtered = filtered.filter(sign => sign.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(sign => 
        sign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sign.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sign.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSigns(filtered);
  };

  const clearFilters = () => {
    setSelectedCategory('Todas');
    setSearchTerm('');
  };

  const startFlashcardMode = () => {
    setFlashcardSigns(filteredSigns);
    setFlashcardMode(true);
  };

  const startSmartFlashcardMode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // If not logged in, use regular flashcard mode
        startFlashcardMode();
        return;
      }

      // Get signs for the current category
      let signsToUse = filteredSigns;
      
      if (selectedCategory !== 'Todas') {
        signsToUse = filteredSigns.filter(sign => sign.category === selectedCategory);
      }
      
      setFlashcardSigns(signsToUse);
      setFlashcardMode(true);
    } catch (error) {
      console.error('Erro ao iniciar modo inteligente:', error);
      startFlashcardMode(); // Fallback to regular mode
    }
  };

  const startTimedChallenge = () => {
    setTimedChallengeMode(true);
  };

  const loadMore = () => {
    setDisplayedCount(prev => prev + 24);
  };

  const displayedSigns = filteredSigns.slice(0, displayedCount);
  const hasMore = displayedCount < filteredSigns.length;

  return (
    <SubscriptionGate feature="Biblioteca de Placas">
      <div className="w-full">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-4 sm:p-6 mb-4">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Biblioteca de Placas
          </h1>
          <p className="text-muted-foreground">
            Consulte todas as placas de trânsito brasileiras organizadas por categoria
          </p>
        </div>

          {/* Search and Filters */}
          <ModernCard className="mb-6 shadow-lg" variant="elevated">
            <ModernCardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Buscar por código, nome ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-3 text-base border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all duration-200"
                  />
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-3">
                  <Filter className="text-muted-foreground w-5 h-5" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-3 border-2 border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 min-w-[180px]"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {categoryIcons[category as keyof typeof categoryIcons]} {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                {(selectedCategory !== 'Todas' || searchTerm) && (
                  <ModernButton
                    variant="outline"
                    size="lg"
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Limpar Filtros
                  </ModernButton>
                )}
              </div>

              {/* Results Count and Quick Actions */}
              <div className="mt-6 flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl">
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{filteredSigns.length}</span> placa{filteredSigns.length !== 1 ? 's' : ''} encontrada{filteredSigns.length !== 1 ? 's' : ''}
                </div>
              </div>
            </ModernCardContent>
          </ModernCard>
        </div>

        {/* Study Modes - Always visible at the top */}
        <div className="mb-6 mx-4 sm:mx-6" data-study-modes>
          {/* Flashcard Mode */}
          {flashcardMode && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <ModernButton
                  variant="outline"
                  onClick={() => setFlashcardMode(false)}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Voltar à Biblioteca
                </ModernButton>
                <Badge variant="secondary" className="text-sm">
                  Modo Estudo - {flashcardSigns.length} placas
                </Badge>
              </div>
              <FlashcardMode
                signs={flashcardSigns}
                onClose={() => setFlashcardMode(false)}
                category={selectedCategory === 'Todas' ? undefined : selectedCategory}
              />
            </div>
          )}

          {/* Timed Challenge Mode */}
          {timedChallengeMode && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <ModernButton
                  variant="outline"
                  onClick={() => setTimedChallengeMode(false)}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Voltar à Biblioteca
                </ModernButton>
                <Badge variant="secondary" className="text-sm bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  <Zap className="w-3 h-3 mr-1" />
                  Desafio 60s - {filteredSigns.length} placas
                </Badge>
              </div>
              <TimedChallenge
                signs={filteredSigns}
                category={selectedCategory === 'Todas' ? 'Todas as Categorias' : selectedCategory}
                onClose={() => setTimedChallengeMode(false)}
              />
            </div>
          )}

          {/* Study Actions - Always visible */}
          {filteredSigns.length > 0 && (
            <div className="mt-6">
              <ModernCard className="shadow-lg" variant="gradient">
                <ModernCardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Comece a Estudar
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <ModernButton
                      onClick={startFlashcardMode}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <BookOpen className="w-4 h-4" />
                      Estudo Linear
                    </ModernButton>
                    <ModernButton
                      onClick={startSmartFlashcardMode}
                      variant="premium"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <BookOpen className="w-4 h-4" />
                      Estudo Inteligente
                    </ModernButton>
                    <ModernButton
                      onClick={startTimedChallenge}
                      variant="success"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Desafio 60s
                    </ModernButton>
                  </div>
                </ModernCardContent>
              </ModernCard>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-muted-foreground font-medium">Carregando placas de trânsito...</p>
            </div>
          </div>
        )}

        {/* Traffic Signs Grid */}
        {!loading && !flashcardMode && !timedChallengeMode && (
          <div className="px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedSigns.map((sign) => (
                <ModernCard
                  key={sign.id}
                  variant="elevated"
                  interactive={true}
                  className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 transform hover:border-primary/30"
                  onClick={() => setSelectedSign(sign)}
                >
                  <ModernCardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className={`${categoryColors[sign.category as keyof typeof categoryColors]} text-xs font-medium px-3 py-1 rounded-full`}>
                        {categoryIcons[sign.category as keyof typeof categoryIcons]} {sign.category}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground font-semibold bg-muted px-2 py-1 rounded">
                        {sign.code}
                      </span>
                    </div>
                  </ModernCardHeader>
                  <ModernCardContent>
                    <div className="aspect-square bg-gradient-to-br from-muted/50 to-muted rounded-xl mb-4 flex items-center justify-center overflow-hidden border border-border/50">
                      {sign.image_url ? (
                        <img
                          src={sign.image_url}
                          alt={sign.name}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = `https://via.placeholder.com/300x300/e5e7eb/6b7280?text=${encodeURIComponent(sign.code)}`;
                          }}
                        />
                      ) : (
                        <div className="text-muted-foreground text-4xl font-bold bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-8">
                          {sign.code}
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground text-center text-lg leading-tight">
                      {sign.name}
                    </h3>
                    <div className="flex justify-center mt-3">
                      <ModernButton
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 text-primary hover:text-primary/80"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalhes
                      </ModernButton>
                    </div>
                  </ModernCardContent>
                </ModernCard>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-8 mb-4">
                <ModernButton
                  onClick={loadMore}
                  variant="secondary"
                  size="lg"
                  className="min-w-[200px] shadow-lg hover:shadow-xl"
                >
                  Carregar Mais ({filteredSigns.length - displayedCount} restantes)
                </ModernButton>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredSigns.length === 0 && !flashcardMode && !timedChallengeMode && (
          <ModernCard className="mx-4 sm:mx-6" variant="glass">
            <ModernCardContent className="p-12 text-center">
              <div className="text-6xl mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">🚦</div>
              <h3 className="text-2xl font-bold text-foreground mb-3">
                Nenhuma placa encontrada
              </h3>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                Tente ajustar seus filtros de busca ou explore outras categorias.
              </p>
              <ModernButton
                variant="outline"
                size="lg"
                onClick={clearFilters}
                className="mt-6"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Limpar todos os filtros
              </ModernButton>
            </ModernCardContent>
          </ModernCard>
        )}

        {/* Modal */}
        <Dialog open={!!selectedSign} onOpenChange={() => setSelectedSign(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background to-muted/50">
            <DialogHeader className="border-b border-border/50 pb-4">
              <DialogTitle className="flex items-center gap-4 text-xl">
                <Badge className={`${selectedSign ? categoryColors[selectedSign.category as keyof typeof categoryColors] : ''} text-sm font-medium px-4 py-2 rounded-full`}>
                  {selectedSign && categoryIcons[selectedSign.category as keyof typeof categoryIcons]} {selectedSign?.category}
                </Badge>
                <span className="text-sm font-mono text-muted-foreground bg-muted px-3 py-1 rounded-lg font-semibold">
                  {selectedSign?.code}
                </span>
              </DialogTitle>
              <DialogDescription className="text-lg font-medium text-foreground mt-2">
                {selectedSign?.name}
              </DialogDescription>
            </DialogHeader>
            
            {selectedSign && (
              <div className="space-y-6">
                {/* Image */}
                <div className="aspect-square bg-gradient-to-br from-muted/30 to-muted rounded-2xl flex items-center justify-center overflow-hidden border border-border/50 shadow-lg">
                  {selectedSign.image_url ? (
                    <img
                      src={selectedSign.image_url}
                      alt={selectedSign.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = `https://via.placeholder.com/400x400/e5e7eb/6b7280?text=${encodeURIComponent(selectedSign.code)}`;
                      }}
                    />
                  ) : (
                    <div className="text-muted-foreground text-7xl font-bold bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-12">
                      {selectedSign.code}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">
                      Descrição
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedSign.description}
                    </p>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Código
                      </span>
                      <p className="font-mono text-foreground">
                        {selectedSign.code}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Categoria
                      </span>
                      <p className="text-foreground">
                        {selectedSign.category}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6">
                  <ModernButton
                    variant="secondary"
                    onClick={() => setSelectedSign(null)}
                    className="flex-1"
                    size="lg"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Fechar
                  </ModernButton>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SubscriptionGate>
  );
}