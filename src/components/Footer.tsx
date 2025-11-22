import { Car, Mail, MapPin, Phone, Facebook, Instagram, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border/40 pt-16 pb-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <Car className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">Vrumi</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              A plataforma #1 para conquistar sua CNH com facilidade, tecnologia e confiança.
            </p>
            <div className="flex gap-4 pt-2">
              {[
                { icon: Facebook, label: "Facebook" },
                { icon: Instagram, label: "Instagram" },
                { icon: Youtube, label: "YouTube" }
              ].map((social, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-foreground hover:bg-primary hover:text-white transition-all duration-300 hover:scale-110"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-6">Plataforma</h3>
            <ul className="space-y-3">
              {[
                { label: "Início", to: "/" },
                { label: "Entrar", to: "/auth" },
                { label: "Recursos", href: "#recursos" },
                { label: "Depoimentos", href: "#depoimentos" }
              ].map((link, i) => (
                <li key={i}>
                  {link.to ? (
                    <Link to={link.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-6">Suporte</h3>
            <ul className="space-y-3">
              {[
                "FAQ",
                "Termos de Uso",
                "Política de Privacidade",
                "Contato"
              ].map((item, i) => (
                <li key={i}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-6">Contato</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-muted-foreground group">
                <Mail className="w-4 h-4 mt-0.5 text-primary group-hover:scale-110 transition-transform" />
                <span className="group-hover:text-foreground transition-colors">contato@vrumi.com.br</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground group">
                <Phone className="w-4 h-4 mt-0.5 text-primary group-hover:scale-110 transition-transform" />
                <span className="group-hover:text-foreground transition-colors">(11) 9999-9999</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground group">
                <MapPin className="w-4 h-4 mt-0.5 text-primary group-hover:scale-110 transition-transform" />
                <span className="group-hover:text-foreground transition-colors">Brasília, DF - Brasil</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {currentYear} Vrumi. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacidade</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Termos</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;