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
      question: "Como funciona a plataforma CNH Fácil?",
      answer:
        "Nossa plataforma oferece flashcards inteligentes e materiais teóricos completos para você estudar para o exame de CNH. Você pode acessar todo o conteúdo online, no seu ritmo.",
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
            Tire suas dúvidas sobre nossa plataforma
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
