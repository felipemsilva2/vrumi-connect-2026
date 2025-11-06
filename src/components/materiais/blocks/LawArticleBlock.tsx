import { Scale } from "lucide-react";
import type { LawArticleData } from "@/types/materiais";

interface LawArticleBlockProps {
  data: LawArticleData;
}

export const LawArticleBlock = ({ data }: LawArticleBlockProps) => {
  return (
    <blockquote className="my-6 border-l-4 border-primary bg-muted/50 p-4 rounded-r-lg">
      <div className="flex items-start gap-3">
        <Scale className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <strong className="text-primary font-semibold">{data.article}</strong>
            <span className="text-sm text-muted-foreground">({data.law})</span>
          </div>
          <p className="text-foreground mb-2">{data.text}</p>
          {data.penalty && (
            <div className="text-sm text-destructive font-medium">
              ⚠️ {data.penalty}
            </div>
          )}
        </div>
      </div>
    </blockquote>
  );
};
