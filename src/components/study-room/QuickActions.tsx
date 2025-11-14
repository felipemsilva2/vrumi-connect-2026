import { Button } from "@/components/ui/button";
import { Brain, Lightbulb, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  onQuickAction: (prompt: string) => void;
  className?: string;
}

export function QuickActions({ onQuickAction, className }: QuickActionsProps) {
  const actions = [
    {
      icon: Brain,
      label: "Simplificar",
      prompt: "Explique o conteúdo da página atual do PDF como se eu tivesse 10 anos.",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30",
      description: "Explicação simples e clara"
    },
    {
      icon: Lightbulb,
      label: "Criar Mnemônico",
      prompt: "Crie uma frase mnemônica ou sigla engraçada para me ajudar a decorar as regras desta página.",
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30",
      description: "Técnica de memorização"
    },
    {
      icon: HelpCircle,
      label: "Quiz Rápido",
      prompt: "Gere 3 perguntas de múltipla escolha baseadas APENAS no conteúdo desta página do PDF.",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30",
      description: "Teste seus conhecimentos"
    }
  ];

  return (
    <div className={cn("p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border-b border-border", className)}>
      <div className="flex gap-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            onClick={() => onQuickAction(action.prompt)}
            variant="ghost"
            className={cn(
              "flex-1 flex flex-col items-center gap-2 p-4 h-auto rounded-xl",
              "border border-gray-200 dark:border-gray-700",
              "transition-all duration-200 hover:scale-105 hover:shadow-md",
              action.bgColor,
              "text-gray-700 dark:text-gray-300"
            )}
          >
            <div className={cn("p-2 rounded-lg", action.color.replace('text-', 'bg-').replace('600', '100').replace('400', '900/20'))}>
              <action.icon className={cn("h-6 w-6", action.color)} />
            </div>
            <div className="text-center">
              <span className="text-sm font-semibold block">{action.label}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{action.description}</span>
            </div>
          </Button>
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
        Ações rápidas baseadas na página atual do PDF
      </p>
    </div>
  );
}