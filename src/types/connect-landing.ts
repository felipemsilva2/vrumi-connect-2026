
import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

export interface FactCheck {
  statement: string;
  verdict: 'Mito' | 'Verdade' | 'Impreciso';
  explanation: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  content: React.ReactNode;
  tags: string[];
}

export interface NavItem {
  label: string;
  path: string;
}

export type ViewState = 'hub' | 'article' | 'contact' | 'terms' | 'help';
