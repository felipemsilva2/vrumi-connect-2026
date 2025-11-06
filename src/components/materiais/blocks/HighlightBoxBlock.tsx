import { Info, AlertTriangle, Lightbulb, AlertCircle } from "lucide-react";
import type { HighlightBoxData } from "@/types/materiais";

interface HighlightBoxBlockProps {
  data: HighlightBoxData;
}

export const HighlightBoxBlock = ({ data }: HighlightBoxBlockProps) => {
  const config = {
    info: {
      icon: Info,
      className: "bg-blue-500/10 border-blue-500/50 text-blue-700 dark:text-blue-300",
      iconClassName: "text-blue-500"
    },
    warning: {
      icon: AlertTriangle,
      className: "bg-yellow-500/10 border-yellow-500/50 text-yellow-700 dark:text-yellow-300",
      iconClassName: "text-yellow-500"
    },
    tip: {
      icon: Lightbulb,
      className: "bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-300",
      iconClassName: "text-green-500"
    },
    important: {
      icon: AlertCircle,
      className: "bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-300",
      iconClassName: "text-red-500"
    }
  }[data.type];

  const Icon = config.icon;

  return (
    <div className={`my-6 border-l-4 p-4 rounded-r-lg ${config.className}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.iconClassName}`} />
        <div className="flex-1">
          {data.title && (
            <strong className="block mb-1 font-semibold">{data.title}</strong>
          )}
          <p>{data.text}</p>
        </div>
      </div>
    </div>
  );
};
