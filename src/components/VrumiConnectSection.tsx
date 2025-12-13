import { useNavigate } from "react-router-dom";
import { Users, Star, Shield, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const VrumiConnectSection = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Instrutores Verificados",
      description: "Todos os instrutores passam por verificação de credenciais e são avaliados por alunos reais.",
    },
    {
      icon: Calendar,
      title: "Agende com Flexibilidade",
      description: "Escolha horários que funcionam para você. Sem compromissos longos ou pacotes obrigatórios.",
    },
    {
      icon: Star,
      title: "Avaliações Reais",
      description: "Veja a nota e comentários de outros alunos antes de escolher seu instrutor.",
    },
    {
      icon: Shield,
      title: "Pagamento Seguro",
      description: "Contrato digital automático e pagamento via PIX ou cartão com proteção total.",
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Users className="w-4 h-4" />
            <span>Novo: Vrumi Connect</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Precisa de Aulas Práticas? Encontre seu Instrutor.
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Conectamos você aos melhores instrutores particulares do Brasil. 
            Aulas personalizadas, horários flexíveis e preços justos.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-primary/80 p-8 sm:p-12">
          <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5" />
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-3">
                Comece sua jornada agora
              </h3>
              <p className="text-primary-foreground/90 max-w-xl">
                Seja aluno buscando o instrutor ideal ou instrutor querendo expandir sua clientela, 
                o Vrumi Connect é para você.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate("/connect")}
                className="group px-8 h-12 text-base font-semibold"
              >
                Encontrar Instrutor
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/connect/cadastro-instrutor")}
                className="px-8 h-12 text-base font-semibold bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                Sou Instrutor
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
          <div className="text-center p-4">
            <div className="text-3xl sm:text-4xl font-bold text-foreground">500+</div>
            <p className="text-sm text-muted-foreground mt-1">Instrutores Cadastrados</p>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl sm:text-4xl font-bold text-foreground">27</div>
            <p className="text-sm text-muted-foreground mt-1">Estados Cobertos</p>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl sm:text-4xl font-bold text-foreground">4.8★</div>
            <p className="text-sm text-muted-foreground mt-1">Avaliação Média</p>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl sm:text-4xl font-bold text-foreground">10k+</div>
            <p className="text-sm text-muted-foreground mt-1">Aulas Realizadas</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VrumiConnectSection;
