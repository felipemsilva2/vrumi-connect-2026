import { cn } from "@/lib/utils";
import {
  IconBrain,
  IconBook,
  IconChartBar,
  IconClock,
  IconTarget,
  IconTrendingUp,
  IconAward,
  IconSparkles,
  IconRoad,
} from "@tabler/icons-react";

export function FeaturesSectionWithHoverEffects() {
  const features = [
    {
      title: "Aprendizado Inteligente",
      description:
        "Sistema de repetição espaçada que otimiza sua memorização e foca nas suas áreas de dificuldade.",
      icon: <IconBrain />,
    },
    {
      title: "Economize R$ 1.000, não apenas tempo",
      description:
        "A maior vantagem da nova lei é financeira. Pule o custo do CFC e pague apenas pelo método de estudo mais eficiente do mercado.",
      icon: <IconClock />,
    },
    {
      title: "Acompanhe seu Progresso",
      description:
        "Dashboard completo com estatísticas detalhadas do seu desempenho e evolução.",
      icon: <IconChartBar />,
    },
    {
      title: "100% Oficial, 0% Chatice",
      description:
        "Nós lemos o CTB e as apostilas oficiais do Contran para você. Transformamos tudo em lições fáceis e um banco de 500+ questões.",
      icon: <IconBook />,
    },
    {
      title: "Simulados Fiéis ao DETRAN",
      description:
        "Responda provas idênticas à oficial. Mesmo número de questões, mesmo tempo e mesmas matérias. Sem surpresas no dia.",
      icon: <IconTarget />,
    },
    {
      title: "136 Placas de Trânsito",
      description:
        "Biblioteca completa com todas as placas brasileiras. Estude com flashcards inteligentes e desafios cronometrados para dominar 100% da sinalização.",
      icon: <IconRoad />,
    },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative z-10 py-10 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature border-border/50",
        (index === 0 || index === 3) && "lg:border-l border-border/50",
        index < 3 && "lg:border-b border-border/50"
      )}
    >
      {index < 3 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-muted/50 to-transparent pointer-events-none" />
      )}
      {index >= 3 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-muted/50 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-primary">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-muted group-hover/feature:bg-primary transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-foreground">
          {title}
        </span>
      </div>
      <p className="text-sm text-muted-foreground max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};
