import { motion } from "framer-motion";
import { Star } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Maria Silva",
      role: "Aprovada em 2024",
      content:
        "Passei de primeira graças aos flashcards! O método de repetição espaçada me ajudou a memorizar todas as placas e sinais.",
      rating: 5,
      avatar: "MS",
    },
    {
      name: "João Santos",
      role: "Aprovado em 2024",
      content:
        "Plataforma excelente! Os materiais são muito completos e organizados. Estudei apenas 3 semanas e consegui passar.",
      rating: 5,
      avatar: "JS",
    },
    {
      name: "Ana Oliveira",
      role: "Aprovada em 2024",
      content:
        "Melhor investimento que fiz! A taxa de 95% de aprovação não é mentira, realmente funciona. Super recomendo!",
      rating: 5,
      avatar: "AO",
    },
    {
      name: "Carlos Mendes",
      role: "Aprovado em 2024",
      content:
        "Tentei outras plataformas antes, mas essa foi a única que realmente me preparou. O suporte também é ótimo!",
      rating: 5,
      avatar: "CM",
    },
    {
      name: "Juliana Costa",
      role: "Aprovada em 2024",
      content:
        "Estudar pelo celular facilitou muito minha rotina. Conseguia revisar nos intervalos do trabalho. Aprovada!",
      rating: 5,
      avatar: "JC",
    },
    {
      name: "Pedro Alves",
      role: "Aprovado em 2024",
      content:
        "Os simulados são idênticos à prova real. Fui tranquilo fazer o exame porque já sabia o que esperar. Top!",
      rating: 5,
      avatar: "PA",
    },
  ];

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            O que nossos alunos dizem
          </h2>
          <p className="text-lg text-muted-foreground">
            Alguns dos feedbacks dos nosso alunos que já estudam com a gente
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                  style={{
                    background: "#10b981",
                    color: "#000000",
                  }}
                >
                  {testimonial.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-foreground">
                    {testimonial.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>

              <div className="flex gap-1 mb-3">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-current"
                    style={{ color: "#10b981" }}
                  />
                ))}
              </div>

              <p className="text-muted-foreground">{testimonial.content}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
