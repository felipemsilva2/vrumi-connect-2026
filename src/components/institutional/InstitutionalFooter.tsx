import { Car, MapPin, Mail, Facebook, Instagram, Youtube, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

const InstitutionalFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background pt-16 pb-8">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-8 mb-12 md:grid-cols-2 md:gap-12 lg:grid-cols-5 lg:mb-16">
          {/* Brand */}
          <div className="col-span-2 space-y-4 lg:col-span-2">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-2 rounded-full">
                <Car className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold tracking-tight">Vrumi</span>
            </div>
            <p className="text-background/70 text-sm leading-relaxed max-w-sm">
              O primeiro ecossistema completo para a nova era da habilitação brasileira.
              Tecnologia, segurança e inovação em um só lugar.
            </p>
            <div className="flex gap-4 pt-2">
              {[
                { icon: Facebook, label: "Facebook", href: "#" },
                { icon: Instagram, label: "Instagram", href: "#" },
                { icon: Youtube, label: "YouTube", href: "#" },
                { icon: Linkedin, label: "LinkedIn", href: "#" },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center text-background hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Institucional */}
          <div>
            <h3 className="font-semibold text-background mb-6">Institucional</h3>
            <ul className="space-y-3">
              {[
                { label: "Sobre o Vrumi", to: "/" },
                { label: "Imprensa", to: "#" },
                { label: "Investidores", to: "#" },
                { label: "Carreiras", to: "#" },
              ].map((link, i) => (
                <li key={i}>
                  <Link
                    to={link.to}
                    className="text-sm text-background/70 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Soluções */}
          <div>
            <h3 className="font-semibold text-background mb-6">Soluções</h3>
            <ul className="space-y-3">
              {[
                { label: "Vrumi Education", to: "/entrar" },
                { label: "Vrumi Connect", to: "/connect" },
                { label: "Biblioteca de Placas", to: "/biblioteca-de-placas" },
                { label: "Simulados", to: "/entrar" },
              ].map((link, i) => (
                <li key={i}>
                  <Link
                    to={link.to}
                    className="text-sm text-background/70 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h3 className="font-semibold text-background mb-6">Suporte</h3>
            <ul className="space-y-3">
              {[
                { label: "Central de Ajuda", to: "/perguntas-frequentes" },
                { label: "Termos de Uso", to: "/termos-de-uso" },
                { label: "Política de Privacidade", to: "/politica-de-privacidade" },
                { label: "Contato", to: "#contato" },
              ].map((link, i) => (
                <li key={i}>
                  <Link
                    to={link.to}
                    className="text-sm text-background/70 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-background/10 pt-8 mb-8">
          <div className="flex flex-wrap gap-6 justify-center text-sm text-background/60">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Brasil</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <a href="mailto:contato@vrumi.com.br" className="hover:text-primary transition-colors">
                contato@vrumi.com.br
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-background/50">
            © {currentYear} Vrumi Tecnologia e Serviços Ltda. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <Link
              to="/politica-de-privacidade"
              className="text-xs text-background/50 hover:text-background transition-colors"
            >
              Privacidade
            </Link>
            <Link
              to="/termos-de-uso"
              className="text-xs text-background/50 hover:text-background transition-colors"
            >
              Termos
            </Link>
            <Link
              to="/perguntas-frequentes"
              className="text-xs text-background/50 hover:text-background transition-colors"
            >
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default InstitutionalFooter;
