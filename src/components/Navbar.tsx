import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Car } from "lucide-react";
import { useNavigate } from "react-router-dom";
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const toggleMenu = () => setIsOpen(!isOpen);
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth"
      });
    }
    setIsOpen(false);
  };
  return <div className="flex justify-center w-full py-6 px-4 fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-3 bg-card rounded-full shadow-card w-full max-w-3xl relative z-10 border border-border">
        <div className="flex items-center">
          <motion.div className="flex items-center gap-2 cursor-pointer" initial={{
          scale: 0.8
        }} animate={{
          scale: 1
        }} whileHover={{
          scale: 1.05
        }} transition={{
          duration: 0.3
        }} onClick={() => navigate("/")}>
            <Car className="w-8 h-8 text-primary" />
            <span className="text-xl font-black text-foreground">Zutobi</span>
          </motion.div>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {[{
          label: "Início",
          id: "inicio"
        }, {
          label: "Preço",
          id: "preço"
        }, {
          label: "Vantagens",
          id: "recursos"
        }].map(item => <motion.div key={item.label} initial={{
          opacity: 0,
          y: -10
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.3
        }} whileHover={{
          scale: 1.05
        }}>
              <button onClick={() => scrollToSection(item.id)} className="text-sm text-foreground hover:text-primary transition-colors font-medium">
                {item.label}
              </button>
            </motion.div>)}
        </nav>

        {/* Desktop CTA Button */}
        <motion.div className="hidden md:block" initial={{
        opacity: 0,
        x: 20
      }} animate={{
        opacity: 1,
        x: 0
      }} transition={{
        duration: 0.3,
        delay: 0.2
      }} whileHover={{
        scale: 1.05
      }}>
          <button onClick={() => navigate("/auth")} className="inline-flex items-center justify-center px-5 py-2 text-sm text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-colors font-medium">
            Entrar
          </button>
        </motion.div>

        {/* Mobile Menu Button */}
        <motion.button className="md:hidden flex items-center" onClick={toggleMenu} whileTap={{
        scale: 0.9
      }}>
          <Menu className="h-6 w-6 text-foreground" />
        </motion.button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && <motion.div className="fixed inset-0 bg-background z-50 pt-24 px-6 md:hidden" initial={{
        opacity: 0,
        x: "100%"
      }} animate={{
        opacity: 1,
        x: 0
      }} exit={{
        opacity: 0,
        x: "100%"
      }} transition={{
        type: "spring",
        damping: 25,
        stiffness: 300
      }}>
            <motion.button className="absolute top-6 right-6 p-2" onClick={toggleMenu} whileTap={{
          scale: 0.9
        }} initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.2
        }}>
              <X className="h-6 w-6 text-foreground" />
            </motion.button>
            <div className="flex flex-col space-y-6">
              {[{
            label: "Início",
            id: "inicio"
          }, {
            label: "Preço",
            id: "preço"
          }, {
            label: "Vantagens",
            id: "recursos"
          }].map((item, i) => <motion.div key={item.label} initial={{
            opacity: 0,
            x: 20
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            delay: i * 0.1 + 0.1
          }} exit={{
            opacity: 0,
            x: 20
          }}>
                  <button onClick={() => scrollToSection(item.id)} className="text-base text-foreground font-medium">
                    {item.label}
                  </button>
                </motion.div>)}

              <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.5
          }} exit={{
            opacity: 0,
            y: 20
          }} className="pt-6">
                <button onClick={() => {
              toggleMenu();
              navigate("/auth");
            }} className="inline-flex items-center justify-center w-full px-5 py-3 text-base text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-colors font-medium">
                  Entrar
                </button>
              </motion.div>
            </div>
          </motion.div>}
      </AnimatePresence>
    </div>;
};
export { Navbar };