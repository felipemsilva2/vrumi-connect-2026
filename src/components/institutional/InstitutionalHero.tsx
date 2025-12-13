import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const InstitutionalHero = () => {
  const scrollToSolutions = () => {
    const element = document.getElementById("solucoes");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Subtle Grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--border) / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--border) / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "100px 100px",
        }}
      />

      {/* Floating Accent Circle */}
      <motion.div
        className="absolute rounded-full hidden md:block"
        style={{
          top: "20%",
          right: "10%",
          width: "400px",
          height: "400px",
          border: `2px solid hsl(var(--primary) / 0.15)`,
        }}
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Small Accent Dot */}
      <motion.div
        className="absolute rounded-full hidden md:block bg-primary/20"
        style={{
          bottom: "30%",
          right: "15%",
          width: "80px",
          height: "80px",
        }}
        animate={{
          y: [0, -30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 min-h-screen flex items-center px-6 py-20">
        <div className="max-w-7xl mx-auto w-full">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 mb-8 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/30"
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm font-bold uppercase tracking-wider text-foreground">
                O Ecossistema Completo para sua CNH
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight mb-6 text-foreground"
              style={{ letterSpacing: "-0.04em" }}
            >
              A Revolução da Habilitação
              <br />
              <span className="text-primary">Brasileira Começa Aqui.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed"
            >
              O primeiro ecossistema completo que une tecnologia de aprendizado teórico
              e um marketplace seguro de instrutores práticos.{" "}
              <span className="text-foreground font-medium">
                Tudo em conformidade com a Nova Lei de Trânsito.
              </span>
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex justify-center mb-16"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={scrollToSolutions}
                className="px-10 py-4 rounded-full font-bold text-lg bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow"
              >
                Conhecer Soluções
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto"
            >
              {[
                { value: "10K+", label: "Alunos Aprovados" },
                { value: "500+", label: "Instrutores" },
                { value: "27", label: "Estados" },
                { value: "4.9★", label: "Avaliação" },
              ].map((stat, index) => (
                <motion.div key={index} whileHover={{ y: -5 }} className="relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
                  <div className="pt-4">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground mb-1">
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm font-medium uppercase tracking-wide text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <button
          onClick={scrollToSolutions}
          className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-sm font-medium">Explorar</span>
          <ChevronDown className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Decorative Elements */}
      <motion.div
        className="absolute hidden md:block"
        style={{
          bottom: "10%",
          right: "5%",
          width: "200px",
          height: "200px",
          border: `1px solid hsl(var(--primary) / 0.2)`,
          transform: "rotate(45deg)",
        }}
        animate={{ rotate: [45, 135, 45] }}
        transition={{ duration: 15, repeat: Infinity }}
      />
    </section>
  );
};

export default InstitutionalHero;
