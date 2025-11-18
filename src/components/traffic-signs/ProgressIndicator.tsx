import React from 'react';
import { CheckCircle, Circle, Star, Clock } from 'lucide-react';
import { userProgress } from '@/utils/userProgress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProgressIndicatorProps {
  signId: string;
  className?: string;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ProgressIndicator({ 
  signId, 
  className = '', 
  showTooltip = true,
  size = 'md'
}: ProgressIndicatorProps) {
  const progress = userProgress.getSignProgress(signId);
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const getProgressIcon = () => {
    if (progress.mastered) {
      return <Star className={`${sizeClasses[size]} text-yellow-500 fill-yellow-500`} />;
    }
    if (progress.studied) {
      return <CheckCircle className={`${sizeClasses[size]} text-green-500`} />;
    }
    return <Circle className={`${sizeClasses[size]} text-gray-300`} />;
  };

  const getProgressText = () => {
    if (progress.mastered) {
      return `Dominada! ${progress.accuracy.toFixed(0)}% de acerto (${progress.studyCount} estudos)`;
    }
    if (progress.studied) {
      return `Estudada ${progress.studyCount}x - ${progress.accuracy.toFixed(0)}% de acerto`;
    }
    return 'Não estudada';
  };

  const getProgressBadge = () => {
    if (progress.mastered) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Star className="w-3 h-3 mr-1" />
          Dominada
        </Badge>
      );
    }
    if (progress.studied) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Estudada
        </Badge>
      );
    }
    return null;
  };

  if (!showTooltip) {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        {getProgressIcon()}
        {getProgressBadge()}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1 cursor-help ${className}`}>
            {getProgressIcon()}
            {getProgressBadge()}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">{getProgressText()}</p>
            {progress.lastStudied && (
              <p className="text-sm text-gray-600">
                <Clock className="w-3 h-3 inline mr-1" />
                Último estudo: {new Date(progress.lastStudied).toLocaleDateString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}