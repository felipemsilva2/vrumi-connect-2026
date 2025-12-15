import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, MapPin, Car, Star, Filter, ChevronRight, User, Calendar, LayoutDashboard, Shield, CreditCard, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
interface Instructor {
  id: string;
  full_name: string;
  photo_url: string | null;
  city: string;
  state: string;
  categories: string[];
  price_per_lesson: number;
  average_rating: number;
  total_reviews: number;
  is_verified: boolean;
}
const BRAZILIAN_STATES = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
const CNH_CATEGORIES = ["A", "B", "AB", "C", "D", "E"];

// Premium 3D Instructor Card Component
const InstructorCard3D = ({
  instructor,
  formatPrice,
  index
}: {
  instructor: Instructor;
  formatPrice: (p: number) => string;
  index: number;
}) => {
  const [mousePos, setMousePos] = useState({
    x: 0,
    y: 0
  });
  const [hovered, setHovered] = useState(false);
  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({
      x: (x / rect.width - 0.5) * 20,
      y: (y / rect.height - 0.5) * -20
    });
  }, []);
  return <Link to={`/connect/instrutor/${instructor.id}`}>
    <motion.div className="group relative overflow-hidden rounded-2xl bg-white border border-connect/10 cursor-pointer transform-gpu shadow-lg hover:shadow-2xl transition-shadow duration-500" initial={{
      opacity: 0,
      y: 50,
      rotateX: -15,
      scale: 0.95
    }} whileInView={{
      opacity: 1,
      y: 0,
      rotateX: 0,
      scale: 1
    }} viewport={{
      once: true,
      margin: "-50px"
    }} transition={{
      duration: 0.6,
      delay: index * 0.08,
      type: "spring",
      stiffness: 80,
      damping: 15
    }} onMouseMove={handleMove} onMouseEnter={() => setHovered(true)} onMouseLeave={() => {
      setHovered(false);
      setMousePos({
        x: 0,
        y: 0
      });
    }} animate={{
      rotateX: mousePos.y,
      rotateY: mousePos.x,
      z: hovered ? 30 : 0
    }} style={{
      transformStyle: "preserve-3d",
      perspective: "1200px"
    }}>
      {/* Gradient overlay on hover */}
      <motion.div className="absolute inset-0 bg-gradient-to-br from-connect/5 via-transparent to-connect-accent/5 opacity-0 z-10 pointer-events-none" animate={{
        opacity: hovered ? 1 : 0
      }} transition={{
        duration: 0.3
      }} />

      {/* Image section */}
      <div className="relative h-52 bg-connect-surface overflow-hidden">
        {instructor.photo_url ? <motion.img src={instructor.photo_url} alt={instructor.full_name} className="w-full h-full object-cover" animate={{
          scale: hovered ? 1.08 : 1
        }} transition={{
          duration: 0.5
        }} /> : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-connect to-connect-light">
          <span className="text-5xl font-bold text-white/80">{instructor.full_name.charAt(0)}</span>
        </div>}

        {/* Verified badge */}
        {instructor.is_verified && <motion.div className="absolute top-3 left-3" initial={{
          scale: 0
        }} animate={{
          scale: 1
        }} transition={{
          delay: 0.3,
          type: "spring"
        }}>
          <Badge className="bg-connect-accent text-connect-dark hover:bg-connect-accent font-semibold shadow-lg">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verificado
          </Badge>
        </motion.div>}

        {/* Rating overlay */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg flex items-center gap-1">
          <Star className="h-4 w-4 text-connect-accent fill-connect-accent" />
          <span className="font-bold text-connect">{Number(instructor.average_rating).toFixed(1)}</span>
          <span className="text-connect/60 text-sm">({instructor.total_reviews})</span>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-5 relative" style={{
        transform: "translateZ(20px)"
      }}>
        <h3 className="font-bold text-connect text-lg mb-2 group-hover:text-connect-light transition-colors">
          {instructor.full_name}
        </h3>

        <div className="flex items-center text-muted-foreground text-sm mb-3">
          <MapPin className="h-4 w-4 mr-1 text-connect/50" />
          {instructor.city}, {instructor.state}
        </div>

        <div className="flex items-center gap-2 mb-4">
          {instructor.categories.map(cat => <Badge key={cat} variant="secondary" className="bg-connect/10 text-connect hover:bg-connect/20 font-medium">
            {cat}
          </Badge>)}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-connect/10">
          <div>
            <span className="text-2xl font-bold text-connect">{formatPrice(Number(instructor.price_per_lesson))}</span>
            <span className="text-muted-foreground text-sm">/aula</span>
          </div>
          <motion.div className="flex items-center text-connect-accent font-semibold text-sm" animate={{
            x: hovered ? 5 : 0
          }} transition={{
            duration: 0.2
          }}>
            Ver perfil
            <ArrowRight className="h-4 w-4 ml-1" />
          </motion.div>
        </div>
      </CardContent>

      {/* Shine effect */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{
        transform: "translateZ(30px)"
      }}>
        <motion.div className="absolute -inset-full" animate={{
          background: hovered ? `linear-gradient(${mousePos.x + 135}deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)` : "transparent"
        }} transition={{
          duration: 0.3
        }} />
      </motion.div>
    </motion.div>
  </Link>;
};

// Trust Feature Card 3D
const TrustCard3D = ({
  icon: Icon,
  title,
  description,
  index
}: {
  icon: any;
  title: string;
  description: string;
  index: number;
}) => {
  const [hovered, setHovered] = useState(false);
  const [mousePos, setMousePos] = useState({
    x: 0,
    y: 0
  });
  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({
      x: (x / rect.width - 0.5) * 15,
      y: (y / rect.height - 0.5) * -15
    });
  }, []);
  return <motion.div className="relative text-center p-8 rounded-2xl bg-white border border-connect/10 shadow-lg transform-gpu cursor-default" initial={{
    opacity: 0,
    y: 40,
    rotateX: -10
  }} whileInView={{
    opacity: 1,
    y: 0,
    rotateX: 0
  }} viewport={{
    once: true
  }} transition={{
    duration: 0.5,
    delay: index * 0.1,
    type: "spring",
    stiffness: 100
  }} onMouseMove={handleMove} onMouseEnter={() => setHovered(true)} onMouseLeave={() => {
    setHovered(false);
    setMousePos({
      x: 0,
      y: 0
    });
  }} animate={{
    rotateX: mousePos.y,
    rotateY: mousePos.x,
    boxShadow: hovered ? "0 25px 50px -12px rgba(15, 42, 68, 0.25)" : "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
  }} style={{
    transformStyle: "preserve-3d",
    perspective: "1000px"
  }}>
    <motion.div className="w-16 h-16 bg-gradient-to-br from-connect to-connect-light rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg" animate={{
      scale: hovered ? 1.1 : 1,
      rotateZ: hovered ? 5 : 0
    }} transition={{
      duration: 0.3
    }} style={{
      transform: "translateZ(30px)"
    }}>
      <Icon className="h-8 w-8 text-white" />
    </motion.div>
    <h3 className="font-bold text-connect text-lg mb-3" style={{
      transform: "translateZ(20px)"
    }}>
      {title}
    </h3>
    <p className="text-muted-foreground text-sm leading-relaxed" style={{
      transform: "translateZ(10px)"
    }}>
      {description}
    </p>
  </motion.div>;
};
export default function ConnectHome() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState(searchParams.get("state") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [user, setUser] = useState<any>(null);
  const [isInstructor, setIsInstructor] = useState(false);
  useEffect(() => {
    checkUserAndInstructor();
    fetchInstructors();
  }, [state, city, category]);
  const checkUserAndInstructor = async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const {
        data: instructor
      } = await supabase.from("instructors").select("id").eq("user_id", user.id).single();
      setIsInstructor(!!instructor);
    }
  };
  const fetchInstructors = async () => {
    setLoading(true);
    try {
      let query = supabase.from("instructors").select("id, full_name, photo_url, city, state, categories, price_per_lesson, average_rating, total_reviews, is_verified").eq("status", "approved").order("average_rating", {
        ascending: false
      });
      if (state) query = query.eq("state", state);
      if (city) query = query.ilike("city", `%${city}%`);
      if (category) query = query.contains("categories", [category]);
      const {
        data,
        error
      } = await query.limit(20);
      if (error) throw error;
      setInstructors(data || []);
    } catch (error) {
      console.error("Error fetching instructors:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (state) params.set("state", state);
    if (city) params.set("city", city);
    if (category) params.set("category", category);
    setSearchParams(params);
  };
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(price);
  };
  const trustFeatures = useMemo(() => [{
    icon: Shield,
    title: "Segurança Jurídica",
    description: "Contratos digitais assinados antes de cada aula, protegendo alunos e instrutores com validade legal."
  }, {
    icon: CreditCard,
    title: "Pagamento Seguro",
    description: "Pagamentos intermediados pela plataforma via PIX ou cartão de crédito com total transparência."
  }, {
    icon: CheckCircle,
    title: "Instrutores Verificados",
    description: "Todos os profissionais passam por verificação de documentos e credenciais para garantir qualidade."
  }], []);
  return <>
    <SEOHead title="Vrumi Connect - Encontre Instrutores de Direção" description="Conectamos você a instrutores de direção verificados em todo o Brasil. Agende aulas práticas com segurança e contratos digitais." />

    <div className="min-h-screen bg-connect-surface">
      {/* Header */}
      <header className="bg-connect text-white sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/connect" className="flex items-center gap-3 group">
              <img src="/logo-vrumi.png" alt="Vrumi Connect" className="h-[68px] w-auto" />

            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              {!user ? <>
                <Link to="/connect/cadastro-instrutor" className="hidden md:block">
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent">
                    Seja um Instrutor
                  </Button>
                </Link>
                <Link to="/entrar?redirect=/connect">
                  <Button className="bg-connect-accent text-connect-dark hover:bg-connect-accent-light font-semibold shadow-lg">
                    Entrar
                  </Button>
                </Link>
              </> : <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-white text-connect hover:bg-white/90 font-semibold">
                    <User className="h-4 w-4 mr-2" />
                    Minha Conta
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <Link to="/connect/minhas-aulas">
                    <DropdownMenuItem className="cursor-pointer">
                      <Calendar className="h-4 w-4 mr-2" />
                      Minhas Aulas
                    </DropdownMenuItem>
                  </Link>
                  {isInstructor && <Link to="/connect/painel-instrutor">
                    <DropdownMenuItem className="cursor-pointer">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Painel do Instrutor
                    </DropdownMenuItem>
                  </Link>}
                  {!isInstructor && <Link to="/connect/cadastro-instrutor">
                    <DropdownMenuItem className="cursor-pointer">
                      <Car className="h-4 w-4 mr-2" />
                      Seja um Instrutor
                    </DropdownMenuItem>
                  </Link>}
                  <DropdownMenuSeparator />
                  <Link to="/">
                    <DropdownMenuItem className="cursor-pointer">
                      Voltar ao Vrumi
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-connect via-connect to-connect-dark text-white overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div className="absolute top-20 right-20 w-96 h-96 rounded-full bg-connect-accent/10 blur-3xl" animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }} transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }} />
          <motion.div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2]
          }} transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }} />

          {/* Grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
        </div>

        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <motion.div initial={{
            opacity: 0,
            y: 30
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8,
            ease: "easeOut"
          }} className="text-center max-w-4xl mx-auto">
            <motion.div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6" initial={{
              opacity: 0,
              scale: 0.9
            }} animate={{
              opacity: 1,
              scale: 1
            }} transition={{
              delay: 0.2
            }}>
              <Sparkles className="h-4 w-4 text-connect-accent" />
              <span className="text-sm font-medium text-white/90">Nova forma de aprender a dirigir</span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight">
              Encontre o instrutor
              <span className="block text-connect-accent">perfeito para você</span>
            </h1>

            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Conectamos você a profissionais verificados em todo o Brasil.
              Agende aulas com segurança jurídica e acelere sua aprovação.
            </p>

            {/* Search Form */}
            <motion.div className="bg-white rounded-2xl p-4 md:p-6 max-w-4xl mx-auto shadow-2xl" initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.4,
              duration: 0.6
            }}>
              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-4">
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger className="h-14 text-connect border-connect/20 focus:ring-connect">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Input placeholder="Cidade" value={city} onChange={e => setCity(e.target.value)} className="h-14 text-connect border-connect/20 focus:ring-connect" />

                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-14 text-connect border-connect/20 focus:ring-connect">
                    <SelectValue placeholder="Categoria CNH" />
                  </SelectTrigger>
                  <SelectContent>
                    {CNH_CATEGORIES.map(c => <SelectItem key={c} value={c}>Categoria {c}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Button onClick={handleSearch} className="h-14 bg-connect hover:bg-connect-light text-white font-semibold shadow-lg hover:shadow-xl transition-all">
                  <Search className="h-5 w-5 mr-2" />
                  Buscar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4" initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }}>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-connect">
              Instrutores Disponíveis
            </h2>
            <p className="text-muted-foreground mt-1">
              {loading ? "Carregando..." : `${instructors.length} profissional(is) encontrado(s)`}
            </p>
          </div>
          <Button variant="outline" className="hidden md:flex border-connect/20 text-connect hover:bg-connect/5">
            <Filter className="h-4 w-4 mr-2" />
            Mais Filtros
          </Button>
        </motion.div>

        {loading ? <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => <div key={i} className="rounded-2xl overflow-hidden border border-connect/10 bg-white">
            <Skeleton className="h-52 w-full" />
            <div className="p-5">
              <Skeleton className="h-6 w-3/4 mb-3" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>)}
        </div> : instructors.length === 0 ? <motion.div className="text-center py-20" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }}>
          <div className="w-20 h-20 bg-connect/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Car className="h-10 w-10 text-connect/50" />
          </div>
          <h3 className="text-xl font-bold text-connect mb-3">
            Nenhum instrutor encontrado
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Tente ajustar os filtros de busca para encontrar instrutores na sua região.
          </p>
        </motion.div> : <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{
          perspective: "1500px"
        }}>
          {instructors.map((instructor, index) => <InstructorCard3D key={instructor.id} instructor={instructor} formatPrice={formatPrice} index={index} />)}
        </div>}
      </section>

      {/* Trust Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-14" initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }}>
            <h2 className="text-3xl md:text-4xl font-bold text-connect mb-4">
              Por que escolher o Vrumi Connect?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Segurança, transparência e qualidade em cada etapa do seu aprendizado.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3 max-w-5xl mx-auto" style={{
            perspective: "1000px"
          }}>
            {trustFeatures.map((feature, index) => <TrustCard3D key={feature.title} icon={feature.icon} title={feature.title} description={feature.description} index={index} />)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-connect to-connect-light py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6
          }}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              É instrutor de direção?
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
              Cadastre-se gratuitamente e alcance milhares de alunos em todo o Brasil.
              Gerencie sua agenda, receba pagamentos seguros e expanda sua carreira.
            </p>
            <Link to="/connect/cadastro-instrutor">
              <Button size="lg" className="bg-connect-accent text-connect-dark hover:bg-connect-accent-light font-bold px-8 py-6 text-lg shadow-2xl hover:shadow-xl transition-all">
                Cadastrar como Instrutor
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-connect-dark text-white/80 py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <Car className="h-6 w-6 text-connect-accent" />
              <span className="font-bold text-white">Vrumi Connect</span>
            </div>
            <p className="text-sm text-center md:text-right">
              © {new Date().getFullYear()} Vrumi Tecnologia e Serviços Ltda. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  </>;
}