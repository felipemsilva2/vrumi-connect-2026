import { motion } from "framer-motion";
import { Shield, CheckCircle } from "lucide-react";

const GovernmentSupport = () => {
  const certifications = [
    "Conteúdo alinhado com CONTRAN",
    "Aprovado pelo DETRAN",
    "Baseado na legislação vigente",
    "Atualizado regularmente",
  ];

  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <Shield className="w-16 h-16" style={{ color: "#10b981" }} />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Certificado e Reconhecido
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Nosso conteúdo está em total conformidade com as normas do CONTRAN e
            é aprovado pelos padrões do DETRAN
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certifications.map((cert, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex items-center gap-4 bg-card border border-border rounded-xl p-6"
            >
              <CheckCircle className="w-8 h-8 flex-shrink-0" style={{ color: "#10b981" }} />
              <span className="text-lg font-semibold text-foreground">
                {cert}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 bg-card border border-border rounded-2xl p-8 text-center"
        >
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Compromisso com a Qualidade
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Trabalhamos em estreita colaboração com especialistas em legislação
            de trânsito para garantir que todo o nosso material esteja sempre
            atualizado e em conformidade com as últimas mudanças nas normas do
            CONTRAN e requisitos do DETRAN.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default GovernmentSupport;
