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
    <div className={cn("w-full bg-transparent border-b border-border", className)}>
      {/* Mobile: Horizontal Scroll | Desktop: Flex Wrap */}
      <div className="w-full overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
        <div className="flex sm:flex-wrap gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={() => onQuickAction(action.prompt)}
              variant="ghost"
              className={cn(
                "shrink-0 w-[100px] sm:w-auto sm:flex-1 sm:min-w-[140px]", // Mobile fixed width (smaller), Desktop flexible
                "flex flex-col items-start justify-between p-2 sm:p-4 h-auto rounded-xl",
                "border-b-4 active:border-b-0 active:translate-y-1", // 3D effect
                "transition-all duration-200 hover:scale-[1.02] shadow-md sm:shadow-lg",
                action.className
              )}
            >
              <div className="flex flex-col items-start gap-1.5 w-full">
                <div className="p-1 sm:p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <action.icon className={cn("h-3.5 w-3.5 sm:h-5 sm:w-5", action.iconClassName)} />
                </div>
                <span className="text-[10px] sm:text-base font-black tracking-wide drop-shadow-md uppercase w-full text-left whitespace-normal leading-3 sm:leading-none" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.3)' }}>
                  {action.label}
                </span>
              </div>
              <div className="text-left w-full mt-1 hidden sm:block">
                <span className="text-xs text-white/90 font-medium line-clamp-2">{action.description}</span>
              </div>
            </Button>
          ))}
        </div>
      </div>
      <p className="text-[10px] sm:text-xs text-muted-foreground text-center pb-2 sm:pb-4 sm:mt-0 font-medium px-4">
        Ações rápidas baseadas na página atual
      </p>
    </div>
  );
}