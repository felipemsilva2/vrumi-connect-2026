import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, X, BookOpen, Play, Zap, Clock, Trophy } from 'lucide-react';
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

export default function TrafficSignsLibrary() {
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

  // Scroll to top when study modes are activated
  useEffect(() => {
    if (flashcardMode || timedChallengeMode) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="min-h-screen bg-background pb-safe">
      <div className="max-w-7xl mx-auto">
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
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Buscar por código, nome ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="text-muted-foreground w-4 h-4" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Limpar
                  </Button>
                )}
              </div>

              {/* Results Count */}
              <div className="mt-4 text-sm text-muted-foreground">
                {filteredSigns.length} placa{filteredSigns.length !== 1 ? 's' : ''} encontrada{filteredSigns.length !== 1 ? 's' : ''}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Study Actions Highlight */}
        {!flashcardMode && !timedChallengeMode && filteredSigns.length > 0 && (
          <Card className="mb-6 mx-4 sm:mx-6 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Comece a Estudar
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={startFlashcardMode}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Estudo Linear
                </Button>
                <Button
                  onClick={startSmartFlashcardMode}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <BookOpen className="w-4 h-4" />
                  Estudo Inteligente
                </Button>
                <Button
                  onClick={startTimedChallenge}
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                >
                  <Zap className="w-4 h-4" />
                  Desafio 60s
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12 mx-4 sm:mx-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Traffic Signs Grid */}
        {!loading && (
          <div className="px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedSigns.map((sign) => (
                <Card
                  key={sign.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 transform"
                  onClick={() => setSelectedSign(sign)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className={categoryColors[sign.category as keyof typeof categoryColors]}>
                        {categoryIcons[sign.category as keyof typeof categoryIcons]} {sign.category}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground">
                        {sign.code}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                      {sign.image_url ? (
                        <img
                          src={sign.image_url}
                          alt={sign.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `https://via.placeholder.com/300x300/e5e7eb/6b7280?text=${encodeURIComponent(sign.code)}`;
                          }}
                        />
                      ) : (
                        <div className="text-muted-foreground text-4xl font-bold">
                          {sign.code}
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground text-center">
                      {sign.name}
                    </h3>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-8 mb-4">
                <Button
                  onClick={loadMore}
                  variant="outline"
                  size="lg"
                  className="min-w-[200px]"
                >
                  Carregar Mais ({filteredSigns.length - displayedCount} restantes)
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Flashcard Mode */}
        {flashcardMode && (
          <div className="px-4 sm:px-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                onClick={() => setFlashcardMode(false)}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Voltar à Biblioteca
              </Button>
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
          <div className="px-4 sm:px-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                onClick={() => setTimedChallengeMode(false)}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Voltar à Biblioteca
              </Button>
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

        {/* Empty State */}
        {!loading && !flashcardMode && !timedChallengeMode && filteredSigns.length === 0 && (
          <Card className="mx-4 sm:mx-6">
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground text-6xl mb-4">🚦</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Nenhuma placa encontrada
              </h3>
              <p className="text-muted-foreground">
                Tente ajustar seus filtros de busca ou categoria.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Modal */}
        <Dialog open={!!selectedSign} onOpenChange={() => setSelectedSign(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Badge className={selectedSign ? categoryColors[selectedSign.category as keyof typeof categoryColors] : ''}>
                  {selectedSign && categoryIcons[selectedSign.category as keyof typeof categoryIcons]} {selectedSign?.category}
                </Badge>
                <span className="text-sm font-mono text-gray-500">
                  {selectedSign?.code}
                </span>
              </DialogTitle>
              <DialogDescription>
                {selectedSign?.name}
              </DialogDescription>
            </DialogHeader>
            
            {selectedSign && (
              <div className="space-y-6">
                {/* Image */}
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                  {selectedSign.image_url ? (
                    <img
                      src={selectedSign.image_url}
                      alt={selectedSign.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `https://via.placeholder.com/400x400/e5e7eb/6b7280?text=${encodeURIComponent(selectedSign.code)}`;
                      }}
                    />
                  ) : (
                    <div className="text-gray-400 text-6xl font-bold">
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
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedSign(null)}
                    className="flex-1"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}