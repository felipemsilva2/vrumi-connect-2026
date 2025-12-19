import React, { useEffect, useState } from 'react';
import { Article } from './types';
import { ArrowLeft, Share2, Clock, ChevronRight, Bookmark } from 'lucide-react';
import { ARTICLES_CONTENT } from './constants';

interface ArticlePageProps {
  article: Article;
  onBack: () => void;
  onNavigate: (id: string) => void;
}

export const ArticlePage: React.FC<ArticlePageProps> = ({ article, onBack, onNavigate }) => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get related articles (excluding current one)
  const relatedArticles = ARTICLES_CONTENT.filter(a => a.id !== article.id).slice(0, 2);

  return (
    <div className="animate-fade-in-up pb-20 bg-white min-h-screen selection:bg-black selection:text-white">

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-100 z-[60]">
        <div
          className="h-full bg-vrumi transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Sticky Nav Overlay */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-900"
          >
            <ArrowLeft size={16} />
          </button>
          <span className={`font-semibold text-sm transition-opacity duration-300 ${scrollProgress > 5 ? 'opacity-100' : 'opacity-0'}`}>
            {article.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
            <Bookmark size={18} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      <article className="container mx-auto px-6 max-w-3xl mt-12">
        {/* Breadcrumbs (SEO) */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-8 font-medium tracking-wide uppercase">
          <span className="cursor-pointer hover:text-black" onClick={onBack}>Hub</span>
          <ChevronRight size={12} />
          <span className="cursor-pointer hover:text-black">{article.category}</span>
          <ChevronRight size={12} />
          <span className="text-gray-900 truncate max-w-[200px]">{article.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-xs font-bold uppercase tracking-widest text-gray-600 mb-6">
            {article.category}
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-8 leading-[1] tracking-tight">
            {article.title}
          </h1>

          <p className="text-xl md:text-2xl text-gray-500 leading-relaxed font-medium">
            {article.subtitle}
          </p>

          <div className="flex items-center justify-center gap-4 mt-10 pt-10 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full p-[2px]">
                <img
                  src={`https://ui-avatars.com/api/?name=${article.author}&background=ffffff`}
                  alt={article.author}
                  className="w-full h-full rounded-full border-2 border-white"
                />
              </div>
              <div className="text-left">
                <p className="text-base font-bold text-gray-900">{article.author}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500 font-medium uppercase tracking-wide">
                  <span>{article.date}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {article.readTime} de leitura</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Image */}
        <div className="rounded-[2rem] overflow-hidden shadow-2xl mb-16 aspect-[16/9] relative group">
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
          <img
            src={`https://picsum.photos/1200/800?random=${article.id}`}
            alt={article.title}
            className="w-full h-full object-cover transform transition-transform duration-[1.5s] ease-out group-hover:scale-105"
          />
        </div>

        {/* Content */}
        <div className="prose prose-xl prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tight prose-img:rounded-3xl prose-a:text-vrumi prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900">
          {article.content}
        </div>

        {/* Tags */}
        <div className="mt-16 pt-8 border-t border-gray-100">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Tópicos Relacionados</h4>
          <div className="flex flex-wrap gap-2">
            {article.tags.map(tag => (
              <span key={tag} className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200 cursor-pointer transition-colors">
                #{tag}
              </span>
            ))}
          </div>
        </div>

      </article>

      {/* Read Next Section (SEO Internal Linking) */}
      <section className="bg-[#F5F5F7] py-20 mt-20 border-t border-gray-200">
        <div className="container mx-auto px-6 max-w-5xl">
          <h3 className="text-3xl font-bold text-gray-900 mb-10 tracking-tight">Continue Lendo</h3>
          <div className="grid md:grid-cols-2 gap-8">
            {relatedArticles.map(rel => (
              <div
                key={rel.id}
                onClick={() => {
                  window.scrollTo(0, 0);
                  onNavigate(rel.id);
                }}
                className="group cursor-pointer bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row gap-6 items-center"
              >
                <div className="w-full md:w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0">
                  <img src={`https://picsum.photos/300/300?random=${rel.id}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold text-vrumi uppercase tracking-wider mb-2 block">{rel.category}</span>
                  <h4 className="text-xl font-bold text-gray-900 leading-tight mb-2 group-hover:underline decoration-2 underline-offset-2">{rel.title}</h4>
                  <span className="text-xs text-gray-400 font-medium">{rel.readTime} • {rel.author}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};