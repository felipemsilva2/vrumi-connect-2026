
import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, User, Mail, ChevronRight, Loader2, Database, AlertCircle } from 'lucide-react';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Lead {
  name: string;
  email: string;
  type: string;
  date: string;
}

export const WaitlistModal: React.FC<WaitlistModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'form' | 'success' | 'admin'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', type: 'student' });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clickCount, setClickCount] = useState(0);

  // Carregar leads existentes do localStorage para simulação e backup
  useEffect(() => {
    const savedLeads = localStorage.getItem('vrumi_leads');
    if (savedLeads) setLeads(JSON.parse(savedLeads));
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const newLead: Lead = {
      ...formData,
      date: new Date().toISOString()
    };

    try {
      // ENVIO REAL PARA O FORMSPREE
      const response = await fetch('https://formspree.io/f/meejovdj', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          userType: formData.type === 'student' ? 'Aluno' : 'Instrutor',
          _subject: `Novo Lead Vrumi: ${formData.name} (${formData.type})`
        })
      });

      if (response.ok) {
        // Salva localmente para o painel de admin secreto
        const updatedLeads = [...leads, newLead];
        setLeads(updatedLeads);
        localStorage.setItem('vrumi_leads', JSON.stringify(updatedLeads));
        
        setStep('success');
      } else {
        throw new Error('Falha ao enviar os dados. Por favor, tente novamente.');
      }
    } catch (err) {
      console.error("Erro no envio:", err);
      setError("Ops! Algo deu errado ao salvar seu contato. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleSecretClick = () => {
    setClickCount(prev => prev + 1);
    if (clickCount + 1 >= 5) {
      setStep('admin');
      setClickCount(0);
    }
  };

  const exportLeads = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(leads, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "vrumi_leads.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all z-10"
        >
          <X size={20} />
        </button>

        {step === 'form' && (
          <div className="p-10">
            <div className="mb-8">
              <span className="text-vrumi font-bold text-xs uppercase tracking-widest mb-2 block">Lista de Espera</span>
              <h3 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
                Seja o primeiro a saber do lançamento.
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'student' })}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                    formData.type === 'student' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Sou Aluno
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'instructor' })}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                    formData.type === 'instructor' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Sou Instrutor
                </button>
              </div>

              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  required
                  type="text"
                  name="name"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-100 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-vrumi transition-all outline-none"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  required
                  type="email"
                  name="email"
                  placeholder="Seu melhor e-mail"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-gray-100 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-vrumi transition-all outline-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button
                disabled={loading}
                className="w-full bg-black text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 mt-6"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>Garantir meu acesso <ChevronRight size={18} /></>
                )}
              </button>
            </form>
            
            <p className="text-center text-[10px] text-gray-400 mt-6 uppercase font-bold tracking-widest">
              Dados protegidos via Formspree.
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="p-10 text-center flex flex-col items-center">
            <div 
              onClick={handleSecretClick}
              className="w-20 h-20 bg-emerald-100 text-vrumi rounded-full flex items-center justify-center mb-6 animate-bounce cursor-pointer select-none"
            >
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-4">Você está na lista!</h3>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Obrigado, <strong>{formData.name.split(' ')[0]}</strong>! <br/>
              Recebemos seu interesse. Avisaremos você por e-mail assim que o app for liberado.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-black text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-all"
            >
              Fechar
            </button>
          </div>
        )}

        {step === 'admin' && (
          <div className="p-8 max-h-[80vh] flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <Database className="text-vrumi" />
              <h3 className="text-xl font-bold text-gray-900">Histórico de Sessão ({leads.length})</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto mb-6 space-y-2 pr-2">
              {leads.length === 0 ? (
                <p className="text-gray-400 text-sm italic">Nenhum lead capturado localmente.</p>
              ) : (
                leads.map((l, i) => (
                  <div key={i} className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs">
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>{l.name}</span>
                      <span className="text-[10px] bg-emerald-100 text-vrumi px-1.5 rounded uppercase">{l.type}</span>
                    </div>
                    <div className="text-gray-500 mt-1">{l.email}</div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={exportLeads}
                className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-xl text-sm hover:bg-emerald-600 transition-colors"
              >
                Baixar Backup
              </button>
              <button
                onClick={() => setStep('form')}
                className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl text-sm hover:bg-gray-200 transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
