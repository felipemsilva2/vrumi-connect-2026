import type { ParagraphData } from "@/types/materiais";

interface ParagraphBlockProps {
  data: ParagraphData;
}

export const ParagraphBlock = ({ data }: ParagraphBlockProps) => {
  return (
    <p className="text-foreground leading-relaxed mb-4">
      {data.text}
    </p>
  );
};
