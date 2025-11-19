import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Target,
  Award,
  BookOpen,
  Zap,
  BarChart3,
  Calendar,
  CheckCircle,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

interface UserStats {
  totalStudied: number;
  totalSigns: number;
  averageScore: number;
  studyStreak: number;
  weeklyGoal: number;
  weeklyProgress: number;
  categoryProgress: Record<string, number>;
  recentActivity: Array<{
    date: string;
    action: string;
    signCode: string;
  }>;
}

interface EnhancedStatsDashboardProps {
  userStats: UserStats;
  onCategoryClick: (category: string) => void;
  onStudyModeSelect: (mode: string) => void;
}

const categoryColors = {
  'Regulamentação': 'bg-red-100 text-red-800',
  'Advertência': 'bg-yellow-100 text-yellow-800',
  'Serviços Auxiliares': 'bg-blue-100 text-blue-800',
  'Indicação': 'bg-green-100 text-green-800',
  'Obras': 'bg-orange-100 text-orange-800',
};

export const EnhancedStatsDashboard: React.FC<EnhancedStatsDashboardProps> = ({
  userStats,
  onCategoryClick,
  onStudyModeSelect
}) => {
  const overallProgress = (userStats.totalStudied / userStats.totalSigns) * 100;
  const weeklyGoalProgress = (userStats.weeklyProgress / userStats.weeklyGoal) * 100;

  return (
    <div className="space-y-6">
      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <Badge variant="secondary" className="text-xs">
                Total
              </Badge>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {userStats.totalStudied}/{userStats.totalSigns}
            </div>
            <p className="text-sm text-gray-600">Placas estudadas</p>
            <Progress value={overallProgress} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <Badge variant="secondary" className="text-xs">
                Média
              </Badge>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {userStats.averageScore}%
            </div>
            <p className="text-sm text-gray-600">Taxa de acerto</p>
            <div className="flex items-center mt-2">
              {userStats.averageScore >= 80 ? (
                <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500 mr-1" />
              )}
              <span className="text-xs text-gray-600">
                {userStats.averageScore >= 80 ? 'Excelente' : 'Em melhoria'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              <Badge variant="secondary" className="text-xs">
                Sequência
              </Badge>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {userStats.studyStreak}
            </div>
            <p className="text-sm text-gray-600">Dias consecutivos</p>
            <div className="flex items-center mt-2">
              <div className="flex -space-x-1">
                {[...Array(Math.min(userStats.studyStreak, 7))].map((_, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 bg-purple-500 rounded-full border-2 border-white"
                  />
                ))}
              </div>
              {userStats.studyStreak > 7 && (
                <span className="text-xs text-purple-600 ml-2">+{userStats.studyStreak - 7}</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-orange-500" />
              <Badge variant="secondary" className="text-xs">
                Semana
              </Badge>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {userStats.weeklyProgress}/{userStats.weeklyGoal}
            </div>
            <p className="text-sm text-gray-600">Meta semanal</p>
            <Progress value={weeklyGoalProgress} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      {/* Progresso por categoria */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progresso por Categoria</CardTitle>
          <p className="text-sm text-gray-600">
            Clique em uma categoria para estudar placas específicas
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(userStats.categoryProgress).map(([category, progress]) => {
              const colorClass = categoryColors[category as keyof typeof categoryColors];
              return (
                <Button
                  key={category}
                  variant="outline"
                  onClick={() => onCategoryClick(category)}
                  className="p-4 h-auto flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
                >
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
                    {category}
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {progress}%
                  </div>
                  <Progress value={progress} className="w-full h-2" />
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modos de estudo recomendados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Modos de Estudo Recomendados</CardTitle>
          <p className="text-sm text-gray-600">
            Baseado em seu progresso atual
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => onStudyModeSelect('flashcards')}
              className="p-4 h-auto flex flex-col items-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              <BookOpen className="w-6 h-6" />
              <div className="text-left w-full">
                <div className="font-semibold">Flashcards</div>
                <div className="text-sm opacity-90">
                  Revise placas de forma aleatória
                </div>
              </div>
            </Button>

            <Button
              onClick={() => onStudyModeSelect('challenge')}
              className="p-4 h-auto flex flex-col items-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              <Zap className="w-6 h-6" />
              <div className="text-left w-full">
                <div className="font-semibold">Desafio 60s</div>
                <div className="text-sm opacity-90">
                  Teste seus conhecimentos contra o tempo
                </div>
              </div>
            </Button>

            <Button
              onClick={() => onStudyModeSelect('smart')}
              className="p-4 h-auto flex flex-col items-center gap-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
            >
              <BarChart3 className="w-6 h-6" />
              <div className="text-left w-full">
                <div className="font-semibold">Estudo Inteligente</div>
                <div className="text-sm opacity-90">
                  Focado nas placas que você mais erra
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Atividade recente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Atividade Recentemente</CardTitle>
          <p className="text-sm text-gray-600">
            Suas últimas interações com a plataforma
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {userStats.recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {activity.action} placa {activity.signCode}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(activity.date).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            ))}
            
            {userStats.recentActivity.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma atividade recente</p>
                <p className="text-sm">Comece a estudar para ver seu progresso!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Componente de estatísticas rápidas para mobile
export const QuickStatsWidget: React.FC<{ userStats: UserStats }> = ({ userStats }) => {
  const overallProgress = (userStats.totalStudied / userStats.totalSigns) * 100;
  
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {userStats.totalStudied}/{userStats.totalSigns}
              </div>
              <div className="text-sm text-gray-600">Placas estudadas</div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900">
              {Math.round(overallProgress)}%
            </div>
            <Progress value={overallProgress} className="w-20 h-2 mt-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedStatsDashboard;