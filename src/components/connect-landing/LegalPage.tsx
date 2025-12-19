
import React from 'react';
import { ArrowLeft, Shield, HelpCircle } from 'lucide-react';

interface LegalPageProps {
  type: 'terms' | 'help';
  onBack: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ type, onBack }) => {
  const isTerms = type === 'terms';

  return (
    <div className="animate-fade-in-up pb-20 bg-white min-h-screen">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors mr-4">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-gray-900">{isTerms ? 'Termos de Uso' : 'Central de Ajuda'}</h1>
      </div>

      <div className="container mx-auto px-6 max-w-3xl mt-12">
        {isTerms ? (
          <div className="prose prose-slate max-w-none text-gray-600">
            <Shield className="text-vrumi mb-6" size={48} />
            <h2 className="text-4xl font-black tracking-tight text-gray-900 mb-8">Termos e Condições</h2>
            <p className="mb-6">Última atualização: Outubro de 2023</p>
            
            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Aceitação dos Termos</h3>
            <p>Ao acessar o Vrumi Connect, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis. Se você não concordar com algum destes termos, está proibido de usar ou acessar este site/app.</p>
            
            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Licença de Uso</h3>
            <p>É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no Vrumi Connect, apenas para visualização pessoal e não comercial transitória.</p>
            
            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Natureza do Serviço</h3>
            <p>O Vrumi Connect é uma plataforma de marketplace que conecta Alunos e Instrutores. Atuamos como facilitadores tecnológicos para o ensino de direção, em conformidade com as novas diretrizes de desburocratização do processo de habilitação.</p>
          </div>
        ) : (
          <div>
            <HelpCircle className="text-vrumi mb-6" size={48} />
            <h2 className="text-4xl font-black tracking-tight text-gray-900 mb-8">Como podemos ajudar?</h2>
            
            <div className="space-y-4">
              {[
                { 
                  q: "O Vrumi substitui a Autoescola?", 
                  a: "Com as recentes mudanças na lei, o aluno não é mais estritamente obrigado a realizar todo o curso prático e teórico dentro de uma autoescola física para se preparar. As únicas etapas obrigatórias agora são o processo administrativo do DETRAN, exames médicos/psicotécnicos e as provas oficiais. O Vrumi oferece a liberdade de você escolher instrutores independentes e credenciados para sua preparação técnica, economizando tempo e dinheiro." 
                },
                { 
                  q: "Como funcionam os pagamentos?", 
                  a: "Atualmente, você pode realizar seus agendamentos utilizando Cartão de Crédito diretamente pelo App. Estamos trabalhando intensamente na implementação do PIX, que será liberado em breve como uma nova opção de pagamento instantâneo." 
                },
                { 
                  q: "Posso cancelar uma aula?", 
                  a: "Sim. Cancelamentos feitos com até 24h de antecedência possuem reembolso integral. Após esse prazo, uma taxa de conveniência pode ser aplicada para cobrir o deslocamento e a hora reservada do instrutor." 
                },
                { 
                  q: "Os instrutores são credenciados?", 
                  a: "Sim. A segurança é nossa prioridade. Todos os instrutores parceiros passam por uma verificação rigorosa de CNH (com observação EAR), Certificado de Instrutor de Trânsito válido e verificação de antecedentes criminais." 
                }
              ].map((faq, i) => (
                <div key={i} className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100">
                  <h4 className="text-lg font-bold text-gray-900 mb-3">{faq.q}</h4>
                  <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
