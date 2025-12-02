import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useContextualNavigation } from "@/utils/navigation";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const homeRoute = useContextualNavigation();

  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
      const el = menuRef.current;
      if (el) {
        const focusable = el.querySelector<HTMLElement>('button, a');
        focusable?.focus();
      }
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [isOpen]);

  const scrollToSection = (id: string) => {
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: id } });
      setIsOpen(false);
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth"
      });
    }
    setIsOpen(false);
  };

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-300",
      scrolled
        ? "pb-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] md:pt-4"
        : "pb-6 pt-[calc(env(safe-area-inset-top)+2.5rem)] md:pt-6"
    )}>
      <motion.div
        className={cn(
          "flex items-center justify-between px-6 py-3 w-full max-w-5xl relative z-10 transition-all duration-300",
          scrolled
            ? "bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg rounded-full mx-4"
            : "bg-transparent border-transparent"
        )}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="flex items-center">
          <motion.div
            className="flex items-center gap-2 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/")}
          >
            <img src="/logo-vrumi.jpg" alt="Vrumi Logo" className="w-16 h-16 object-contain" />


            <span className="text-lg font-bold tracking-tight text-foreground">Vrumi</span>
          </motion.div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {[
            { label: "Início", id: "inicio" },
            { label: "Preço", id: "preço" },
            { label: "Vantagens", id: "recursos" }
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => scrollToSection(item.id)}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium rounded-full hover:bg-secondary/50"
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => navigate("/cnh-social")}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium rounded-full hover:bg-secondary/50"
          >
            CNH Social
          </button>
        </nav>

        {/* Desktop CTA Button */}
        <div className="hidden md:block">
          <button
            onClick={() => navigate(user ? "/painel" : "/entrar")}
            className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium text-white bg-primary rounded-full hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
          >
            {user ? "Dashboard" : "Entrar"}
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden flex items-center justify-center h-11 w-11 rounded-full hover:bg-secondary/50 transition-colors"
          onClick={toggleMenu}
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>
      </motion.div >

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {
          isOpen && (
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              tabIndex={-1}
              className="fixed inset-0 bg-background/95 backdrop-blur-xl z-[60] pt-[calc(env(safe-area-inset-top)+6rem)] px-6 md:hidden"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <button
                className="absolute top-[calc(env(safe-area-inset-top)+2.5rem)] right-6 p-2 z-[70] rounded-full bg-secondary/50"
                onClick={toggleMenu}
              >
                <X className="h-5 w-5 text-foreground" />
              </button>

              <div ref={menuRef} className="flex flex-col space-y-4 relative z-[65]">
                {[
                  { label: "Início", id: "inicio" },
                  { label: "Preço", id: "preço" },
                  { label: "Vantagens", id: "recursos" }
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <button
                      onClick={() => scrollToSection(item.id)}
                      className="text-2xl font-semibold text-foreground w-full text-left py-4 border-b border-border/50"
                    >
                      {item.label}
                    </button>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <button
                    onClick={() => {
                      toggleMenu();
                      navigate("/cnh-social");
                    }}
                    className="text-2xl font-semibold text-foreground w-full text-left py-4 border-b border-border/50"
                  >
                    CNH Social
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="pt-8"
                >
                  <button
                    onClick={() => {
                      toggleMenu();
                      navigate(user ? "/painel" : "/entrar");
                    }}
                    className="w-full px-5 py-4 text-lg text-white bg-primary rounded-2xl font-semibold shadow-lg active:scale-95 transition-all"
                  >
                    {user ? "Dashboard" : "Entrar"}
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )
        }
      </AnimatePresence >
    </div >
  );
};

export { Navbar };