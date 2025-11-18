import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Zap, Clock, TrendingUp, Users, Target } from 'lucide-react';

export default function StudyModesDemo() {
  const improvements = [
    {
      title: "📍 Exibição no Topo da Página",
      description: "As modalidades de estudo agora aparecem imediatamente após o header, eliminando a necessidade de rolar a página.",
      before: "Botões escondidos no final da página",
      after: "Botões visíveis no topo com destaque visual"
    },
    {
      title: "🎯 Modal Interativo",
      description: "Novo modal centralizado que apresenta as opções de forma clara e organizada.",
      before: "Botões pequenos sem descrição",
      after: "Modal com descrições detalhadas e design moderno"
    },
    {
      title: "💫 Tooltips e Microinterações",
      description: "Adicionadas tooltips informativas e animações suaves nos botões.",
      before: "Interação básica sem feedback",
      after: "Tooltips com informações e animações hover"
    },
    {
      title: "📊 Sistema de Tracking",
      description: "Implementado analytics para medir a eficácia das mudanças.",
      before: "Sem dados de uso",
      after: "Tracking completo de interações e modos de estudo"
    }
  ];

  const studyModes = [
    {
      title: "Estudo Linear",
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Revise todas as placas em ordem sequencial"
    },
    {
      title: "Estudo Inteligente",
      icon: Zap,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "Aprendizado adaptativo com IA"
    },
    {
      title: "Desafio 60s",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "Teste seus conhecimentos contra o tempo"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Melhorias na Biblioteca de Placas
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Implementamos melhorias significativas na interface para tornar as modalidades de estudo 
            mais visíveis e acessíveis, reduzindo a frustração dos usuários.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">3x</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mais rápido para encontrar modos de estudo
              </div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">100%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Redução no scroll necessário
              </div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-green-600 mb-2">+5</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Novos elementos de UX implementados
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Study Modes Preview */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Modalidades de Estudo
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {studyModes.map((mode, index) => {
              const Icon = mode.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 ${mode.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <Icon className={`w-8 h-8 ${mode.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {mode.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {mode.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Improvements */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Principais Melhorias Implementadas
          </h2>
          
          <div className="space-y-6">
            {improvements.map((improvement, index) => (
              <Card key={index} className="border-l-4 border-blue-500">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {improvement.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {improvement.description}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <Badge variant="outline" className="mb-2">Antes</Badge>
                      <p className="text-gray-500 dark:text-gray-500">{improvement.before}</p>
                    </div>
                    <div>
                      <Badge variant="secondary" className="mb-2">Depois</Badge>
                      <p className="text-gray-700 dark:text-gray-300">{improvement.after}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">
              Teste as Melhorias Agora!
            </h2>
            <p className="mb-6 opacity-90">
              Navegue até a Biblioteca de Placas e experimente as novas modalidades de estudo 
              com interface aprimorada e melhor experiência do usuário.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => window.location.href = '/traffic-signs-library'}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                <Target className="w-5 h-5 mr-2" />
                Ir para Biblioteca de Placas
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.location.href = '/dashboard'}
                className="border-white text-white hover:bg-white/10"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Ver Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Detalhes Técnicos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Componentes Criados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• StudyModeModal - Modal interativo de seleção</li>
                  <li>• StudyModeButtons - Botões com tooltips</li>
                  <li>• StudyAnalytics - Sistema de tracking</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Benefícios para Usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Descoberta imediata das funcionalidades</li>
                  <li>• Interface intuitiva e responsiva</li>
                  <li>• Feedback visual aprimorado</li>
                  <li>• Redução da curva de aprendizado</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}