import React, { useState, useEffect } from 'react';
import { HubPage } from './HubPage';
import { VrumiAssistant } from './VrumiAssistant';
import { WaitlistModal } from './WaitlistModal';
import { ArticlePage } from './ArticlePage';
import { ContactPage } from './ContactPage';
import { LegalPage } from './LegalPage';
import { Menu, X, ArrowRight } from 'lucide-react';
import { ViewState, Article } from './types';
import { ARTICLES_CONTENT } from './constants';
import './connect-landing.css';


export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [viewState, setViewState] = useState<ViewState>('hub');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigateTo = (state: ViewState, articleId?: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (state === 'article' && articleId) {
      const art = ARTICLES_CONTENT.find(a => a.id === articleId);
      if (art) setSelectedArticle(art);
    }
    setViewState(state);
    setIsMenuOpen(false);
  };

  const scrollToSection = (id: string) => {
    if (viewState !== 'hub') {
      navigateTo('hub');
      // Pequeno delay para esperar a renderização do hub antes do scroll
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }

    setIsMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const renderContent = () => {
    switch (viewState) {
      case 'article':
        return selectedArticle ? (
          <ArticlePage
            article={selectedArticle}
            onBack={() => setViewState('hub')}
            onNavigate={(id) => {
              const art = ARTICLES_CONTENT.find(a => a.id === id);
              if (art) setSelectedArticle(art);
              window.scrollTo(0, 0);
            }}
          />
        ) : <HubPage onJoinWaitlist={() => setIsWaitlistOpen(true)} />;
      case 'contact':
        return <ContactPage onBack={() => setViewState('hub')} />;
      case 'terms':
        return <LegalPage type="terms" onBack={() => setViewState('hub')} />;
      case 'help':
        return <LegalPage type="help" onBack={() => setViewState('hub')} />;
      default:
        return <HubPage onJoinWaitlist={() => setIsWaitlistOpen(true)} />;
    }
  };

  return (
    <div className="connect-landing-page min-h-screen bg-background font-sans text-primary flex flex-col selection:bg-black selection:text-white">
      {/* Floating Dynamic Navbar */}
      <header className="fixed top-0 left-0 right-0 z-[60] flex justify-center pt-6 pointer-events-none">
        <div className={`
          pointer-events-auto
          transition-all duration-500 ease-in-out
          ${scrolled || viewState !== 'hub' ? 'w-[90%] md:w-[600px] bg-white/80 backdrop-blur-xl border border-white/20 shadow-apple' : 'w-[95%] bg-transparent border-transparent'}
          rounded-full px-6 py-3 flex items-center justify-between
        `}>
          {/* Logo */}
          <div
            className="cursor-pointer block group"
            onClick={() => navigateTo('hub')}
          >
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-gray-900 group-hover:text-vrumi transition-colors">VRUMI</span>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Connect</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <button onClick={() => scrollToSection('students')} className="hover:text-black transition-colors">Alunos</button>
            <button onClick={() => scrollToSection('instructors')} className="hover:text-black transition-colors">Instrutores</button>
            <button onClick={() => scrollToSection('safety')} className="hover:text-black transition-colors">Segurança</button>
          </nav>

          {/* Action / Menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsWaitlistOpen(true)}
              className="hidden md:flex bg-black text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-gray-800 transition-all shadow-sm hover:shadow-md items-center gap-1"
            >
              Lista de Espera <ArrowRight size={12} />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden text-gray-700 p-1"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-24 inset-x-0 mx-auto w-[90%] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 pointer-events-auto animate-fade-in border border-gray-100">
            <nav className="flex flex-col gap-4 text-center">
              <button onClick={() => scrollToSection('students')} className="text-lg font-medium text-gray-500">Alunos</button>
              <button onClick={() => scrollToSection('instructors')} className="text-lg font-medium text-gray-500">Instrutores</button>
              <button onClick={() => scrollToSection('safety')} className="text-lg font-medium text-gray-500">Segurança</button>
              <hr className="border-gray-200" />
              <button
                onClick={() => { setIsWaitlistOpen(true); setIsMenuOpen(false); }}
                className="bg-black text-white py-3 rounded-xl font-bold w-full flex items-center justify-center gap-2"
              >
                Entrar na Lista de Espera
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {renderContent()}
      </main>

      {/* Modern Footer */}
      <footer className="bg-white text-gray-500 py-20 border-t border-gray-200">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2 md:col-span-1">
              <span className="text-black font-bold text-xl block mb-4">Vrumi Connect</span>
              <p className="text-xs leading-relaxed max-w-xs">
                O Marketplace que conecta alunos e instrutores de trânsito. Segurança, tecnologia e liberdade para dirigir.
              </p>
              <button
                onClick={() => setIsWaitlistOpen(true)}
                className="mt-6 text-vrumi font-bold text-sm hover:underline flex items-center gap-1"
              >
                Garantir meu acesso antecipado <ArrowRight size={14} />
              </button>
            </div>
            <div>
              <h4 className="text-black font-semibold text-sm mb-4">Produto</h4>
              <ul className="space-y-3 text-xs">
                <li><button onClick={() => scrollToSection('students')} className="hover:underline">Para Alunos</button></li>
                <li><button onClick={() => scrollToSection('instructors')} className="hover:underline">Para Instrutores</button></li>
                <li><button onClick={() => scrollToSection('safety')} className="hover:underline">Segurança</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-black font-semibold text-sm mb-4">Suporte</h4>
              <ul className="space-y-3 text-xs">
                <li><button onClick={() => navigateTo('help')} className="hover:underline">Central de Ajuda</button></li>
                <li><button onClick={() => navigateTo('contact')} className="hover:underline">Fale Conosco</button></li>
                <li><button onClick={() => navigateTo('terms')} className="hover:underline">Termos de Uso</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-black font-semibold text-sm mb-4">Social</h4>
              <ul className="space-y-3 text-xs">
                <li><a href="https://www.instagram.com/vrumi.app/" target="_blank" rel="noopener noreferrer" className="hover:underline">Instagram</a></li>
                <li><a href="#" className="hover:underline">LinkedIn</a></li>
                <li><a href="#" className="hover:underline">TikTok</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-xs flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              © 2025 Vrumi Tecnologia Ltda. Todos os direitos reservados.
            </div>
            <div className="flex items-center gap-4 opacity-30 grayscale">
              <span className="font-bold">Em breve no:</span>
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/31/Apple_logo_white.svg" className="w-4 h-4 invert" alt="Apple" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/d/d7/Android_robot.svg" className="w-4 h-4" alt="Android" />
            </div>
          </div>
        </div>
      </footer>

      {/* UI Elements */}
      <VrumiAssistant onWaitlistClick={() => setIsWaitlistOpen(true)} />
      <WaitlistModal isOpen={isWaitlistOpen} onClose={() => setIsWaitlistOpen(false)} />
    </div>
  );
}
