import { motion } from "framer-motion";
import { Star } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Maria Silva",
      role: "Aluna em São Paulo",
      content:
        "Encontrei um instrutor excelente pelo Vrumi! As aulas foram muito melhores do que na autoescola. Recomendo demais!",
      rating: 5,
      avatar: "MS",
    },
    {
      name: "João Santos",
      role: "Aluno no Rio de Janeiro",
      content:
        "Plataforma muito fácil de usar. Agendei minhas aulas em minutos e o pagamento foi super seguro. Aprovado de primeira!",
      rating: 5,
      avatar: "JS",
    },
    {
      name: "Ana Oliveira",
      role: "Aluna em Belo Horizonte",
      content:
        "Meu instrutor foi incrível! Muito paciente e profissional. O sistema de avaliações ajudou muito na escolha.",
      rating: 5,
      avatar: "AO",
    },
    {
      name: "Carlos Mendes",
      role: "Instrutor Parceiro",
      content:
        "Como instrutor, o Vrumi me ajudou a ter mais alunos e organizar minha agenda. A plataforma é muito completa!",
      rating: 5,
      avatar: "CM",
    },
    {
      name: "Juliana Costa",
      role: "Aluna em Curitiba",
      content:
        "Adorei poder escolher o horário que queria e ver as avaliações de outros alunos. Faz toda diferença!",
      rating: 5,
      avatar: "JC",
    },
    {
      name: "Pedro Alves",
      role: "Aluno em Brasília",
      content:
        "O instrutor que encontrei foi muito didático. Consegui passar na prova prática de primeira. Valeu muito a pena!",
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
            O que nossos usuários dizem
          </h2>
          <p className="text-lg text-muted-foreground">
            Alunos e instrutores que já usam o Vrumi Connect
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
