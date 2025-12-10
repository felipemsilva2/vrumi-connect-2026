import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Bell } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useContextualNavigation } from "@/utils/navigation";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const homeRoute = useContextualNavigation();

  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

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

  // Fetch Notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    };

    fetchNotifications();

    // Realtime subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    if (notifications.find(n => n.id === id)?.read) return;

    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

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
            <img src="/logo-vrumi.png" alt="Vrumi Logo" className="h-16 w-auto object-contain" />
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

        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          {user && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative p-2 rounded-full hover:bg-secondary/50 transition-colors">
                  <Bell className="h-5 w-5 text-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse border-2 border-background" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 mr-4" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                  <h4 className="font-semibold text-sm">Notificações</h4>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-primary hover:underline">
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
                <ScrollArea className="h-[300px]">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Nenhuma notificação por enquanto.
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            "p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer text-left",
                            !notification.read && "bg-muted/20"
                          )}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <span className={cn("text-sm font-medium", !notification.read && "text-primary")}>
                              {notification.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {notification.created_at && formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          )}

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
        </div>
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