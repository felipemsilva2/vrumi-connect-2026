import { Quote } from "lucide-react";
import type { QuoteData } from "@/types/materiais";

interface QuoteBlockProps {
  data: QuoteData;
}

export const QuoteBlock = ({ data }: QuoteBlockProps) => {
  return (
    <blockquote className={`my-6 p-6 rounded-lg ${
      data.highlight 
        ? "bg-gradient-to-r from-primary/10 to-primary/5 border-l-4 border-primary" 
        : "bg-muted/50 border-l-4 border-muted-foreground/30"
    }`}>
      <div className="flex gap-4">
        <Quote className={`h-8 w-8 flex-shrink-0 ${
          data.highlight ? "text-primary" : "text-muted-foreground"
        }`} />
        <div className="flex-1">
          <p className={`text-lg italic mb-2 ${
            data.highlight ? "text-foreground font-medium" : "text-muted-foreground"
          }`}>
            "{data.text}"
          </p>
          {data.author && (
            <cite className="text-sm text-muted-foreground not-italic">
              — {data.author}
            </cite>
          )}
        </div>
      </div>
    </blockquote>
  );
};
