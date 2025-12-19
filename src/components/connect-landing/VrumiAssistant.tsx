
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface VrumiAssistantProps {
  onWaitlistClick?: () => void;
}

// Respostas pré-definidas para o assistente
const getAutoResponse = (userMessage: string): string => {
  const lowerMsg = userMessage.toLowerCase();

  if (lowerMsg.includes('baixar') || lowerMsg.includes('app') || lowerMsg.includes('download')) {
    return 'O app ainda não está nas lojas, mas está em fase final de desenvolvimento! Cadastre-se na lista de espera para ser avisado no lançamento e ganhar bônus exclusivos!';
  }
  if (lowerMsg.includes('preço') || lowerMsg.includes('quanto custa') || lowerMsg.includes('valor')) {
    return 'Os preços são definidos pelos próprios instrutores na plataforma. Você poderá comparar e escolher o melhor custo-benefício para você!';
  }
  if (lowerMsg.includes('funciona') || lowerMsg.includes('como')) {
    return 'O Vrumi Connect conecta alunos a instrutores de trânsito credenciados, como um "Uber" das aulas de direção. Você busca, agenda, paga e faz check-in tudo pelo app!';
  }
  if (lowerMsg.includes('lista') || lowerMsg.includes('espera') || lowerMsg.includes('cadastrar')) {
    return 'Ótima escolha! Clique no botão abaixo "Quero entrar na lista de espera" para garantir seu bônus exclusivo de lançamento!';
  }
  if (lowerMsg.includes('instrutor') || lowerMsg.includes('professor')) {
    return 'Você é instrutor? No Vrumi Connect você controla sua agenda, ganha pagamento garantido e constrói sua reputação. Também pode entrar na lista de espera!';
  }

  return 'Estamos em fase de lançamento! Entre na lista de espera para ser avisado e garantir bônus exclusivos. Posso ajudar com mais alguma dúvida?';
};

export const VrumiAssistant: React.FC<VrumiAssistantProps> = ({ onWaitlistClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Olá! Sou o suporte virtual do Vrumi Connect. Estamos em fase de lançamento! Gostaria de entrar para nossa lista de espera exclusiva?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    // Simular delay de resposta
    setTimeout(() => {
      const response = getAutoResponse(userMsg);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
      setIsLoading(false);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-500 ${isOpen ? 'bg-gray-900 rotate-90 scale-90' : 'bg-white text-black hover:scale-110'
          }`}
      >
        {isOpen ? <X size={24} className="text-white" /> : <MessageSquare size={24} fill="currentColor" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-[350px] h-[500px] rounded-3xl shadow-2xl flex flex-col overflow-hidden bg-white/95 backdrop-blur-xl border border-gray-200">

          {/* Header */}
          <div className="bg-white/50 backdrop-blur-md p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-300 flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Suporte Vrumi</h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">Lançamento em Breve</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                    ? 'bg-black text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Special CTA */}
          <div className="px-4 py-2">
            <button
              onClick={onWaitlistClick}
              className="w-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest py-2 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              Quero entrar na lista de espera
            </button>
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-4 py-2 focus-within:bg-white focus-within:shadow-sm transition-all">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua dúvida..."
                className="flex-1 bg-transparent text-sm focus:outline-none text-gray-800 placeholder:text-gray-400"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="text-emerald-500 disabled:text-gray-300 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
