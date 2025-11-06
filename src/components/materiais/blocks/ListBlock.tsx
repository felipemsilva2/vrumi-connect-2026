import { Check, Circle } from "lucide-react";
import type { ListData } from "@/types/materiais";

interface ListBlockProps {
  data: ListData;
}

export const ListBlock = ({ data }: ListBlockProps) => {
  if (data.style === 'bullet') {
    return (
      <ul className="space-y-2 mb-4 ml-4">
        {data.items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <Circle className="h-2 w-2 mt-2 flex-shrink-0 fill-primary text-primary" />
            <span className="text-foreground">{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (data.style === 'numbered') {
    return (
      <ol className="space-y-2 mb-4 ml-4 list-decimal list-inside">
        {data.items.map((item, index) => (
          <li key={index} className="text-foreground">
            {item}
          </li>
        ))}
      </ol>
    );
  }

  // checklist
  return (
    <ul className="space-y-2 mb-4 ml-4">
      {data.items.map((item, index) => (
        <li key={index} className="flex items-start gap-2">
          <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
          <span className="text-foreground">{item}</span>
        </li>
      ))}
    </ul>
  );
};
