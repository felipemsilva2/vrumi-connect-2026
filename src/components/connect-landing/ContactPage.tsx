
import React, { useState } from 'react';
import { ArrowLeft, Mail, MessageSquare, Send, CheckCircle2, Loader2 } from 'lucide-react';

interface ContactPageProps {
  onBack: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('https://formspree.io/f/meejovdj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) setStatus('success');
      else setStatus('error');
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="animate-fade-in-up pb-20 bg-[#F5F5F7] min-h-screen">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors mr-4">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-gray-900">Fale Conosco</h1>
      </div>

      <div className="container mx-auto px-6 max-w-4xl mt-12 grid md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-5xl font-black tracking-tight mb-6">Dúvidas? <br/><span className="text-vrumi">Estamos aqui.</span></h2>
          <p className="text-xl text-gray-500 leading-relaxed mb-8">
            Nossa equipe está pronta para ajudar você, seja você um futuro aluno ou um instrutor querendo expandir seus negócios.
          </p>
          
          <div className="space-y-4">
             <div className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-sm">
                <div className="w-12 h-12 bg-emerald-50 text-vrumi rounded-full flex items-center justify-center">
                   <Mail size={24} />
                </div>
                <div>
                   <p className="text-xs font-bold text-gray-400 uppercase">E-mail</p>
                   <p className="font-bold text-gray-900">contato@vrumi.app</p>
                </div>
             </div>
             <div className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-sm">
                <div className="w-12 h-12 bg-emerald-50 text-vrumi rounded-full flex items-center justify-center">
                   <MessageSquare size={24} />
                </div>
                <div>
                   <p className="text-xs font-bold text-gray-400 uppercase">Suporte</p>
                   <p className="font-bold text-gray-900">Chat via App (em breve)</p>
                </div>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 shadow-xl">
          {status === 'success' ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-emerald-100 text-vrumi rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Mensagem Enviada!</h3>
              <p className="text-gray-500 mb-8">Responderemos o mais breve possível no seu e-mail.</p>
              <button onClick={() => setStatus('idle')} className="bg-black text-white px-8 py-3 rounded-xl font-bold">Enviar nova mensagem</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Seu Nome</label>
                <input required name="name" type="text" className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 focus:ring-2 focus:ring-vrumi transition-all outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">E-mail</label>
                <input required name="email" type="email" className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 focus:ring-2 focus:ring-vrumi transition-all outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Sua Mensagem</label>
                <textarea required name="message" rows={4} className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 focus:ring-2 focus:ring-vrumi transition-all outline-none resize-none" />
              </div>
              
              {status === 'error' && <p className="text-red-500 text-xs font-bold text-center">Erro ao enviar. Tente novamente.</p>}

              <button disabled={status === 'loading'} className="w-full bg-black text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-50">
                {status === 'loading' ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Enviar Mensagem</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
