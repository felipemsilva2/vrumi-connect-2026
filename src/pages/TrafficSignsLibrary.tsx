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

  const categories = ['Todas', 'Regulamentação', 'Advertência', 'Serviços Auxiliares', 'Indicação', 'Obras'];

  useEffect(() => {
    fetchTrafficSigns();
  }, []);

  useEffect(() => {
    filterSigns();
  }, [signs, selectedCategory, searchTerm]);

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

      // Get signs prioritized by difficulty for the current category
      const { data, error } = await supabase
        .rpc('get_signs_for_study', {
          p_user_id: user.id,
          p_category: selectedCategory === 'Todas' ? null : selectedCategory,
          p_limit: 50
        });

      if (error) {
        console.error('Erro ao buscar placas prioritárias:', error);
        startFlashcardMode(); // Fallback to regular mode
      } else {
        setFlashcardSigns(data || filteredSigns);
        setFlashcardMode(true);
      }
    } catch (error) {
      console.error('Erro ao iniciar modo inteligente:', error);
      startFlashcardMode(); // Fallback to regular mode
    }
  };

  const startTimedChallenge = () => {
    setTimedChallengeMode(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Biblioteca de Placas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Consulte todas as placas de trânsito brasileiras organizadas por categoria
          </p>
        </div>

        {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
              <Filter className="text-gray-400 w-4 h-4" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            {/* Flashcard Mode Buttons */}
            {filteredSigns.length > 0 && (
              <div className="flex gap-2">
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
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
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
            )}
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            {filteredSigns.length} placa{filteredSigns.length !== 1 ? 's' : ''} encontrada{filteredSigns.length !== 1 ? 's' : ''}
            {filteredSigns.length > 0 && (
              <span className="ml-2">
                • <button
                  onClick={startSmartFlashcardMode}
                  className="text-purple-600 dark:text-purple-400 hover:underline font-medium"
                >
                  Estudo inteligente com {filteredSigns.length} placa{filteredSigns.length !== 1 ? 's' : ''}
                </button>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Traffic Signs Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSigns.map((sign) => (
              <Card
                key={sign.id}
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:scale-105 transform"
                onClick={() => setSelectedSign(sign)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={categoryColors[sign.category as keyof typeof categoryColors]}>
                      {categoryIcons[sign.category as keyof typeof categoryIcons]} {sign.category}
                    </Badge>
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                      {sign.code}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
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
                      <div className="text-gray-400 text-4xl font-bold">
                        {sign.code}
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-center">
                    {sign.name}
                  </h3>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Flashcard Mode */}
      {flashcardMode && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={() => setFlashcardMode(false)}
              className="flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
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
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={() => setTimedChallengeMode(false)}
              className="flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
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

      {/* Grid View (only show when not in flashcard mode) */}
      {!flashcardMode && <>
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Traffic Signs Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSigns.map((sign) => (
              <Card
                key={sign.id}
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:scale-105 transform"
                onClick={() => setSelectedSign(sign)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={categoryColors[sign.category as keyof typeof categoryColors]}>
                      {categoryIcons[sign.category as keyof typeof categoryIcons]} {sign.category}
                    </Badge>
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                      {sign.code}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
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
                      <div className="text-gray-400 text-4xl font-bold">
                        {sign.code}
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-center">
                    {sign.name}
                  </h3>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredSigns.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">🚦</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Nenhuma placa encontrada
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tente ajustar seus filtros de busca ou categoria.
              </p>
            </CardContent>
          </Card>
        )}
      </>}

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
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Descrição
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {selectedSign.description}
                    </p>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Código
                      </span>
                      <p className="font-mono text-gray-900 dark:text-gray-100">
                        {selectedSign.code}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Categoria
                      </span>
                      <p className="text-gray-900 dark:text-gray-100">
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