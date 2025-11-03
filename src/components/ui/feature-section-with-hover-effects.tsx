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
      title: "Materiais Completos",
      description:
        "Todo conteúdo teórico necessário para sua aprovação, organizado e de fácil acesso.",
      icon: <IconBook />,
    },
    {
      title: "Acompanhe seu Progresso",
      description:
        "Dashboard completo com estatísticas detalhadas do seu desempenho e evolução.",
      icon: <IconChartBar />,
    },
    {
      title: "Economize Tempo",
      description:
        "Estude no seu ritmo, reduza custos com aulas extras e aprove de primeira.",
      icon: <IconClock />,
    },
    {
      title: "Foco no que Importa",
      description:
        "Conteúdo atualizado com as questões mais recentes dos exames de habilitação.",
      icon: <IconTarget />,
    },
    {
      title: "Resultados Comprovados",
      description:
        "95% de taxa de aprovação entre nossos alunos na primeira tentativa.",
      icon: <IconTrendingUp />,
    },
    {
      title: "Certificado de Conclusão",
      description:
        "Receba certificado ao completar todos os módulos do curso teórico.",
      icon: <IconAward />,
    },
    {
      title: "Atualizações Constantes",
      description:
        "Conteúdo sempre atualizado com as últimas mudanças na legislação de trânsito.",
      icon: <IconSparkles />,
    },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-10 max-w-7xl mx-auto">
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
        (index === 0 || index === 4) && "lg:border-l border-border/50",
        index < 4 && "lg:border-b border-border/50"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-muted/50 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
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
