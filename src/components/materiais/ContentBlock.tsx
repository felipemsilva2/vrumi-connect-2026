import type { LessonContent } from "@/types/materiais";
import { HeadingBlock } from "./blocks/HeadingBlock";
import { ParagraphBlock } from "./blocks/ParagraphBlock";
import { ListBlock } from "./blocks/ListBlock";
import { ImageBlock } from "./blocks/ImageBlock";
import { LawArticleBlock } from "./blocks/LawArticleBlock";
import { HighlightBoxBlock } from "./blocks/HighlightBoxBlock";
import { QuoteBlock } from "./blocks/QuoteBlock";

interface ContentBlockProps {
  content: LessonContent;
}

export const ContentBlock = ({ content }: ContentBlockProps) => {
  switch (content.content_type) {
    case 'heading':
      return <HeadingBlock data={content.content_data as any} />;
    
    case 'paragraph':
      return <ParagraphBlock data={content.content_data as any} />;
    
    case 'list':
      return <ListBlock data={content.content_data as any} />;
    
    case 'image':
      return <ImageBlock data={content.content_data as any} />;
    
    case 'law_article':
      return <LawArticleBlock data={content.content_data as any} />;
    
    case 'highlight_box':
      return <HighlightBoxBlock data={content.content_data as any} />;
    
    case 'quote':
      return <QuoteBlock data={content.content_data as any} />;
    
    default:
      return null;
  }
};
