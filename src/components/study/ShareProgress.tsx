import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Share2, 
  Twitter, 
  Facebook, 
  Link, 
  Download, 
  Trophy, 
  Target, 
  TrendingUp,
  Award,
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareProgressProps {
  stats: {
    totalSignsStudied: number;
    totalSignsMastered: number;
    averageQuizScore: number;
    currentStreak: number;
    longestStreak: number;
    categoryProgress: Array<{
      category: string;
      studied: number;
      total: number;
      mastered: number;
    }>;
  };
  userName?: string;
}

const CATEGORY_COLORS = {
  regulamentacao: 'bg-red-500',
  advertencia: 'bg-yellow-500',
  servicos: 'bg-blue-500',
  indicacao: 'bg-green-500'
};

const CATEGORY_LABELS = {
  regulamentacao: 'Regulamentação',
  advertencia: 'Advertência',
  servicos: 'Serviços',
  indicacao: 'Indicação'
};

export default function ShareProgress({ stats, userName = 'Estudante' }: ShareProgressProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const { toast } = useToast();

  const generateShareText = () => {
    const totalProgress = Math.round((stats.totalSignsStudied / 100) * 100); // Assuming 100 total signs
    const masteryRate = Math.round((stats.totalSignsMastered / Math.max(stats.totalSignsStudied, 1)) * 100);
    
    return `🏆 Conquista no Vrumi!\n\n` +
           `Estudei ${stats.totalSignsStudied} placas de trânsito e dominei ${stats.totalSignsMastered}!\n` +
           `Taxa de acerto: ${stats.averageQuizScore.toFixed(1)}%\n` +
           `Sequência atual: ${stats.currentStreak} dias\n\n` +
           `#Vrumi #CNH #PlacasDeTransito #Estudo #Educacao`;
  };

  const generateShareImage = () => {
    // Create a canvas to generate an image
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1e40af');
    gradient.addColorStop(1, '#3b82f6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 Conquista Vrumi!', canvas.width / 2, 100);

    // User name
    ctx.font = '32px Arial';
    ctx.fillText(userName, canvas.width / 2, 150);

    // Stats
    ctx.font = 'bold 36px Arial';
    ctx.fillText(`${stats.totalSignsStudied} placas estudadas`, canvas.width / 2, 250);
    ctx.fillText(`${stats.totalSignsMastered} placas dominadas`, canvas.width / 2, 300);
    ctx.fillText(`${stats.averageQuizScore.toFixed(1)}% de acerto`, canvas.width / 2, 350);
    ctx.fillText(`${stats.currentStreak} dias de sequência`, canvas.width / 2, 400);

    // Category progress bars
    let yPos = 500;
    stats.categoryProgress.forEach((category, index) => {
      const percentage = Math.round((category.studied / category.total) * 100);
      
      // Category name
      ctx.font = '24px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(CATEGORY_LABELS[category.category as keyof typeof CATEGORY_LABELS], 100, yPos);
      
      // Progress bar background
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(100, yPos + 10, 300, 20);
      
      // Progress bar fill
      ctx.fillStyle = CATEGORY_COLORS[category.category as keyof typeof CATEGORY_COLORS];
      ctx.fillRect(100, yPos + 10, (300 * percentage) / 100, 20);
      
      // Percentage
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.fillText(`${percentage}%`, 410, yPos + 25);
      
      yPos += 60;
    });

    // Vrumi logo/branding
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Vrumi - Sua preparação para a CNH', canvas.width / 2, canvas.height - 50);

    return canvas.toDataURL('image/png');
  };

  const handleShare = async (platform: 'twitter' | 'facebook' | 'copy' | 'download') => {
    setIsSharing(true);
    
    try {
      const shareText = generateShareText();
      
      switch (platform) {
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
          break;
          
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareText)}`, '_blank');
          break;
          
        case 'copy':
          await navigator.clipboard.writeText(shareText);
          toast({
            title: 'Link copiado!',
            description: 'Compartilhe seu progresso com seus amigos.',
            variant: 'success'
          });
          break;
          
        case 'download': {
          const imageData = generateShareImage();
          if (imageData) {
            const link = document.createElement('a');
            link.download = `vrumi-progresso-${Date.now()}.png`;
            link.href = imageData;
            link.click();
          }
          toast({
            title: 'Imagem baixada!',
            description: 'Compartilhe sua conquista nas redes sociais.',
            variant: 'success'
          });
          break;
        }
      }
      
      setShowShareModal(false);
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: 'Erro ao compartilhar',
        description: 'Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSharing(false);
    }
  };

  const getMasteryLevel = () => {
    const masteryRate = (stats.totalSignsMastered / Math.max(stats.totalSignsStudied, 1)) * 100;
    
    if (masteryRate >= 80) return { level: 'Mestre', icon: '🏆', color: 'text-yellow-500' };
    if (masteryRate >= 60) return { level: 'Expert', icon: '🥇', color: 'text-orange-500' };
    if (masteryRate >= 40) return { level: 'Avançado', icon: '🥈', color: 'text-blue-500' };
    if (masteryRate >= 20) return { level: 'Intermediário', icon: '🥉', color: 'text-green-500' };
    return { level: 'Iniciante', icon: '⭐', color: 'text-gray-500' };
  };

  const mastery = getMasteryLevel();

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <CardTitle>Compartilhar Progresso</CardTitle>
            </div>
            <Badge variant="secondary">Novidade</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Achievement Preview */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{mastery.icon}</div>
                <div>
                  <h3 className="font-bold text-lg">{mastery.level} em Placas</h3>
                  <p className="text-sm opacity-90">{userName}</p>
                </div>
              </div>
              <Award className="h-8 w-8 opacity-80" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{stats.totalSignsStudied}</div>
                <div className="text-xs opacity-80">Estudadas</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalSignsMastered}</div>
                <div className="text-xs opacity-80">Dominadas</div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <div className="text-lg font-bold">{stats.averageQuizScore.toFixed(1)}%</div>
              <div className="text-xs opacity-80">Taxa de Acerto</div>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleShare('twitter')}
              variant="outline"
              className="flex items-center gap-2"
              disabled={isSharing}
            >
              <Twitter className="h-4 w-4" />
              Twitter
            </Button>
            
            <Button
              onClick={() => handleShare('facebook')}
              variant="outline"
              className="flex items-center gap-2"
              disabled={isSharing}
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </Button>
            
            <Button
              onClick={() => handleShare('copy')}
              variant="outline"
              className="flex items-center gap-2"
              disabled={isSharing}
            >
              <Link className="h-4 w-4" />
              Copiar
            </Button>
            
            <Button
              onClick={() => handleShare('download')}
              variant="outline"
              className="flex items-center gap-2"
              disabled={isSharing}
            >
              <Download className="h-4 w-4" />
              Baixar
            </Button>
          </div>

          {/* Additional Stats */}
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Detalhes do Progresso
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Sequência atual:</span>
                <span className="font-medium">{stats.currentStreak} dias</span>
              </div>
              <div className="flex justify-between">
                <span>Maior sequência:</span>
                <span className="font-medium">{stats.longestStreak} dias</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa de domínio:</span>
                <span className="font-medium">
                  {Math.round((stats.totalSignsMastered / Math.max(stats.totalSignsStudied, 1)) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}