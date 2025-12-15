import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "Como funciona o Vrumi?",
      answer:
        "O Vrumi oferece flashcards inteligentes e materiais teóricos completos para você estudar para o exame de CNH. Você pode acessar todo o conteúdo online, no seu ritmo.",
    },
    {
      question: "Quanto tempo preciso estudar para passar?",
      answer:
        "O tempo varia para cada pessoa, mas com dedicação diária de 30-60 minutos usando nossos flashcards, a maioria dos alunos se sente preparada em 2-4 semanas.",
    },
    {
      question: "Os materiais são atualizados?",
      answer:
        "Sim! Todos os nossos materiais seguem as normas atuais do CONTRAN e do DETRAN, sendo constantemente revisados e atualizados pela nossa equipe.",
    },
    {
      question: "Posso acessar pelo celular?",
      answer:
        "Com certeza! Nossa plataforma é 100% responsiva e funciona perfeitamente em celulares, tablets e computadores.",
    },
    {
      question: "Tem garantia de aprovação?",
      answer:
        "Embora não possamos garantir aprovação (que depende do seu esforço), 95% dos nossos alunos que completam o curso são aprovados na primeira tentativa.",
    },
    {
      question: "Como funcionam os flashcards?",
      answer:
        "Nossos flashcards utilizam o sistema de repetição espaçada, mostrando questões que você tem mais dificuldade com maior frequência, otimizando seu aprendizado.",
    },
    // Vrumi Connect FAQs
    {
      question: "O que é o Vrumi Connect?",
      answer:
        "O Vrumi Connect é nosso marketplace que conecta alunos a instrutores de direção independentes e credenciados. Você pode encontrar, avaliar e agendar aulas práticas com profissionais verificados na sua região.",
    },
    {
      question: "Como funciona o agendamento de aulas práticas?",
      answer:
        "É simples! Busque instrutores na sua cidade, veja avaliações e disponibilidade, escolha um horário que funcione para você e faça o pagamento seguro pela plataforma. O instrutor confirma e vocês combinam os detalhes.",
    },
    {
      question: "Os instrutores do Vrumi Connect são verificados?",
      answer:
        "Sim! Todos os instrutores passam por um processo de verificação onde conferimos credenciamento junto ao DETRAN, documentação e histórico profissional antes de serem aprovados na plataforma.",
    },
    {
      question: "O pagamento é seguro?",
      answer:
        "Totalmente! Utilizamos processadores de pagamento confiáveis. O valor só é liberado para o instrutor após a aula ser realizada, garantindo segurança para ambas as partes.",
    },
    {
      question: "Posso cancelar uma aula agendada?",
      answer:
        "Sim, você pode cancelar com até 24 horas de antecedência para reembolso integral. Cancelamentos com menos de 24h podem ter taxa de cancelamento conforme política do instrutor.",
    },
  ];

  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-lg text-muted-foreground">
            Tire suas dúvidas sobre o Vrumi
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
