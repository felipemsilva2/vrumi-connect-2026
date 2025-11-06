export type ContentType = 
  | 'heading' 
  | 'paragraph' 
  | 'list' 
  | 'image' 
  | 'quote' 
  | 'law_article' 
  | 'table' 
  | 'highlight_box' 
  | 'warning';

export interface HeadingData {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
}

export interface ParagraphData {
  text: string;
}

export interface ListData {
  style: 'bullet' | 'numbered' | 'checklist';
  items: string[];
}

export interface ImageData {
  url: string;
  caption?: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface LawArticleData {
  article: string;
  law: string;
  text: string;
  penalty?: string;
}

export interface HighlightBoxData {
  type: 'info' | 'warning' | 'tip' | 'important';
  title?: string;
  text: string;
}

export interface QuoteData {
  text: string;
  author?: string;
  highlight?: boolean;
}

export type ContentData = 
  | HeadingData 
  | ParagraphData 
  | ListData 
  | ImageData 
  | LawArticleData 
  | HighlightBoxData
  | QuoteData;

export interface LessonContent {
  id: string;
  lesson_id: string;
  content_type: ContentType;
  content_data: ContentData;
  order_position: number;
  metadata?: Record<string, any>;
}

export interface Module {
  id: string;
  code: string;
  title: string;
  description: string | null;
  order_number: number;
  icon: string | null;
  estimated_hours: number | null;
}

export interface Chapter {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  order_number: number;
  estimated_time: string | null;
  icon: string | null;
}

export interface Lesson {
  id: string;
  chapter_id: string;
  title: string;
  order_number: number;
  estimated_time: string | null;
}
