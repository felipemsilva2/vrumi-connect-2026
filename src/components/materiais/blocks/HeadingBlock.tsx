import { createElement } from "react";
import type { HeadingData } from "@/types/materiais";

interface HeadingBlockProps {
  data: HeadingData;
}

export const HeadingBlock = ({ data }: HeadingBlockProps) => {
  const headingTag = `h${data.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  
  const className = {
    1: "text-3xl md:text-4xl font-bold text-foreground mt-8 mb-4",
    2: "text-2xl md:text-3xl font-bold text-foreground mt-6 mb-3",
    3: "text-xl md:text-2xl font-semibold text-foreground mt-5 mb-2",
    4: "text-lg md:text-xl font-semibold text-foreground mt-4 mb-2",
    5: "text-base md:text-lg font-medium text-foreground mt-3 mb-2",
    6: "text-sm md:text-base font-medium text-foreground mt-2 mb-1"
  }[data.level];

  return createElement(headingTag, { className }, data.text);
};
