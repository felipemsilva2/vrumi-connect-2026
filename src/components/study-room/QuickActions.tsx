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
      // Vivid Blue
      className: "bg-blue-600 hover:bg-blue-700 text-white border-blue-800 shadow-blue-900/20",
      iconClassName: "text-white",
      description: "Explicação simples e clara"
    },
    {
      icon: Lightbulb,
      label: "Criar Mnemônico",
      prompt: "Crie uma frase mnemônica ou sigla engraçada para me ajudar a decorar as regras desta página.",
      // Vivid Amber/Orange
      className: "bg-amber-500 hover:bg-amber-600 text-white border-amber-700 shadow-amber-900/20",
      iconClassName: "text-white",
      description: "Técnica de memorização"
    },
    {
      icon: HelpCircle,
      label: "Quiz Rápido",
      prompt: "Gere 3 perguntas de múltipla escolha baseadas APENAS no conteúdo desta página do PDF.",
      // Vivid Green
      className: "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-800 shadow-emerald-900/20",
      iconClassName: "text-white",
      description: "Verifique seu conhecimento"
    },
  ];

  return (
    <div className={cn("p-3 sm:p-4 bg-transparent border-b border-border", className)}>
      {/* Mobile: Horizontal Scroll | Desktop: Flex Wrap */}
      <div className="flex overflow-x-auto pb-2 sm:pb-0 sm:flex-wrap gap-2 sm:gap-3 snap-x snap-mandatory scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
        {actions.map((action, index) => (
          <Button
            key={index}
            onClick={() => onQuickAction(action.prompt)}
            variant="ghost"
            className={cn(
              "snap-center shrink-0 w-[140px] sm:w-auto sm:flex-1 sm:min-w-[140px]", // Mobile fixed width, Desktop flexible
              "flex flex-col items-start justify-between p-3 sm:p-4 h-auto rounded-xl",
              "border-b-4 active:border-b-0 active:translate-y-1", // 3D effect
              "transition-all duration-200 hover:scale-[1.02] shadow-md sm:shadow-lg",
              action.className
            )}
          >
            <div className="flex flex-col items-start gap-2 w-full">
              <div className="p-1.5 sm:p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                <action.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", action.iconClassName)} />
              </div>
              <span className="text-xs sm:text-base font-black tracking-wide drop-shadow-md uppercase truncate w-full text-left" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.3)' }}>
                {action.label}
              </span>
            </div>
            <div className="text-left w-full mt-1 hidden sm:block">
              <span className="text-xs text-white/90 font-medium line-clamp-2">{action.description}</span>
            </div>
          </Button>
        ))}
      </div>
      <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-2 sm:mt-4 font-medium">
        Ações rápidas baseadas na página atual
      </p>
    </div>
  );
}