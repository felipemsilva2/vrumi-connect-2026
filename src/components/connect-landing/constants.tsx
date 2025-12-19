
import React from 'react';
import { FactCheck, Article } from './types';

// Vrumi Theme Colors
export const COLORS = {
  primary: '#10B981', // Emerald 500
  primaryDark: '#047857', // Emerald 700
  secondary: '#064E3B', // Emerald 900
  background: '#F5F5F7', // Apple Light Gray
  white: '#FFFFFF',
};

export const FACTS: FactCheck[] = [
  {
    statement: "Posso escolher qualquer instrutor?",
    verdict: "Verdade",
    explanation: "No Vrumi Connect, você vê o perfil completo, avaliações, modelo do carro e preço. A escolha é 100% sua."
  },
  {
    statement: "O pagamento é feito direto ao instrutor?",
    verdict: "Mito",
    explanation: "Para sua segurança, o pagamento é feito via App (Cartão de Crédito - PIX em breve) e o valor só é liberado ao instrutor após o Check-in da aula."
  },
  {
    statement: "Ainda sou obrigado a fazer todas as aulas na Autoescola?",
    verdict: "Mito",
    explanation: "Com a nova flexibilização da lei, a obrigatoriedade de pacotes fechados em CFCs diminuiu. O foco agora é o cumprimento das taxas e exames oficiais do DETRAN."
  }
];

export const COMPARISON_DATA = [
  { feature: 'Agendamento', presencial: 'Horário fixo e rígido', online: 'Flexível (App)', winner: 'online' },
  { feature: 'Instrutor', presencial: 'Definido pela escola', online: 'Você escolhe pelo perfil', winner: 'online' },
  { feature: 'Veículo', presencial: 'Padrão da Autoescola', online: 'Opção de carro próprio', winner: 'online' },
  { feature: 'Pagamento', presencial: 'Burocrático / Boleto', online: 'Cartão (Pix em breve)', winner: 'online' },
  { feature: 'Segurança', presencial: 'Padrão', online: 'Rastreio e Check-in QR', winner: 'online' },
];

export const ARTICLES_CONTENT: Article[] = [
  {
    id: '1',
    slug: 'mitos-verdades',
    title: 'Mitos e Verdades sobre a Autoescola',
    subtitle: 'Desvendando o que é real e o que é lenda no processo de habilitação.',
    author: 'Equipe Vrumi',
    date: '12 Out 2023',
    readTime: '5 min',
    category: 'Educação',
    content: (
      <>
        <p>
          Tirar a carteira de motorista é um rito de passagem, mas também é cercado de muitas dúvidas e informações desencontradas. 
          Vamos esclarecer os principais pontos.
        </p>
        <h2 className="text-2xl font-bold mt-8 mb-4">1. É obrigatório fazer todas as aulas no carro da autoescola?</h2>
        <p>
          Com as mudanças recentes na legislação, o modelo de aprendizado tornou-se mais flexível. Embora os exames do DETRAN permaneçam obrigatórios, a forma como você se prepara para eles está mudando, permitindo instrutores independentes e maior foco na prática real.
        </p>
        <h2 className="text-2xl font-bold mt-8 mb-4">2. Reprovar na prova prática é o fim do mundo?</h2>
        <p>
          Absolutamente não. O nervosismo é o maior inimigo. Nossos dados mostram que 40% dos alunos reprovam na primeira tentativa por ansiedade, não por falta de técnica. Com o Vrumi, você pode treinar especificamente seus pontos fracos com o instrutor que te deixar mais calmo.
        </p>
      </>
    ),
    tags: ['CNH', 'Dicas', 'Legislação'],
  },
  {
    id: '2',
    slug: 'economia-cnh',
    title: 'Como economizar ao tirar a CNH',
    subtitle: 'Dicas práticas para não gastar mais do que o necessário.',
    author: 'Roberto Silva',
    date: '15 Out 2023',
    readTime: '4 min',
    category: 'Economia',
    content: (
        <>
            <p>O processo de habilitação pode ser custoso, mas existem formas de otimizar seu investimento.</p>
            <h2 className="text-2xl font-bold mt-8 mb-4">Planeje suas aulas</h2>
            <p>Faltas não justificadas geram custos extras. Mantenha sua agenda organizada.</p>
            <h2 className="text-2xl font-bold mt-8 mb-4">Use a tecnologia a seu favor</h2>
            <p>Com o fim da obrigatoriedade de exclusividade de algumas aulas em autoescolas, você pode contratar instrutores credenciados via Vrumi por preços muito mais competitivos, pagando apenas pelo que usar.</p>
        </>
    ),
    tags: ['Finanças', 'Planejamento'],
  },
  {
    id: '3',
    slug: 'futuro-mobilidade',
    title: 'O futuro da mobilidade urbana',
    subtitle: 'Como os apps de transporte e ensino estão mudando as cidades.',
    author: 'Ana Costa',
    date: '20 Out 2023',
    readTime: '6 min',
    category: 'Tecnologia',
    content: (
        <>
            <p>A forma como nos locomovemos e aprendemos a dirigir está passando por uma revolução digital.</p>
            <h2 className="text-2xl font-bold mt-8 mb-4">A era dos apps</h2>
            <p>Do Uber ao Vrumi, a conexão direta entre prestador e usuário elimina intermediários e reduz custos.</p>
        </>
    ),
    tags: ['Inovação', 'Smart Cities'],
  }
];
