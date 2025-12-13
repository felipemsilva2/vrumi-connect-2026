import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, MapPin, Car, Star, Filter, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";

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

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const CNH_CATEGORIES = ["A", "B", "AB", "C", "D", "E"];

export default function ConnectHome() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState(searchParams.get("state") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");

  useEffect(() => {
    fetchInstructors();
  }, [state, city, category]);

  const fetchInstructors = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("instructors")
        .select("id, full_name, photo_url, city, state, categories, price_per_lesson, average_rating, total_reviews, is_verified")
        .eq("status", "approved")
        .order("average_rating", { ascending: false });

      if (state) {
        query = query.eq("state", state);
      }
      if (city) {
        query = query.ilike("city", `%${city}%`);
      }
      if (category) {
        query = query.contains("categories", [category]);
      }

      const { data, error } = await query.limit(20);

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
      currency: "BRL",
    }).format(price);
  };

  return (
    <>
      <SEOHead
        title="Vrumi Connect - Encontre Instrutores de Direção"
        description="Conectamos você a instrutores de direção verificados em todo o Brasil. Agende aulas práticas com segurança e contratos digitais."
      />

      <div className="min-h-screen bg-[#F8F9FA]">
        {/* Header */}
        <header className="bg-[#0A2F44] text-white">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/connect" className="flex items-center gap-2">
                <Car className="h-8 w-8" />
                <span className="text-xl font-semibold">Vrumi Connect</span>
              </Link>
              <div className="flex items-center gap-4">
                <Link to="/connect/cadastro-instrutor">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    Seja um Instrutor
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="bg-white text-[#0A2F44] hover:bg-white/90">
                    Entrar
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="bg-[#0A2F44] text-white pb-16 pt-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Conectamos você a instrutores de direção<br />
              verificados em todo o Brasil.
            </h1>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Encontre profissionais qualificados, agende aulas com segurança jurídica 
              e acelere sua aprovação na prova prática.
            </p>

            {/* Search Form */}
            <div className="bg-white rounded-xl p-4 md:p-6 max-w-4xl mx-auto shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger className="h-12 text-[#0A2F44]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Cidade"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-12 text-[#0A2F44]"
                />

                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-12 text-[#0A2F44]">
                    <SelectValue placeholder="Categoria CNH" />
                  </SelectTrigger>
                  <SelectContent>
                    {CNH_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>Categoria {c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button 
                  onClick={handleSearch}
                  className="h-12 bg-[#0A2F44] hover:bg-[#0A2F44]/90"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-[#0A2F44]">
                Instrutores Disponíveis
              </h2>
              <p className="text-gray-600">
                {loading ? "Carregando..." : `${instructors.length} instrutor(es) encontrado(s)`}
              </p>
            </div>
            <Button variant="outline" className="hidden md:flex">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : instructors.length === 0 ? (
            <div className="text-center py-16">
              <Car className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Nenhum instrutor encontrado
              </h3>
              <p className="text-gray-500">
                Tente ajustar os filtros de busca para encontrar mais resultados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {instructors.map((instructor) => (
                <Link key={instructor.id} to={`/connect/instrutor/${instructor.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                    <div className="relative h-48 bg-gray-100">
                      {instructor.photo_url ? (
                        <img
                          src={instructor.photo_url}
                          alt={instructor.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#0A2F44]/10">
                          <span className="text-4xl font-bold text-[#0A2F44]/30">
                            {instructor.full_name.charAt(0)}
                          </span>
                        </div>
                      )}
                      {instructor.is_verified && (
                        <Badge className="absolute top-3 left-3 bg-[#2F7B3A] hover:bg-[#2F7B3A]">
                          Verificado
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-[#0A2F44] text-lg mb-1 group-hover:text-[#0A2F44]/80">
                        {instructor.full_name}
                      </h3>
                      <div className="flex items-center text-gray-500 text-sm mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {instructor.city}, {instructor.state}
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        {instructor.categories.map((cat) => (
                          <Badge key={cat} variant="secondary" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                          <span className="font-medium">{Number(instructor.average_rating).toFixed(1)}</span>
                          <span className="text-gray-500 text-sm ml-1">
                            ({instructor.total_reviews})
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-[#0A2F44]">
                            {formatPrice(Number(instructor.price_per_lesson))}
                          </span>
                          <span className="text-gray-500 text-sm">/aula</span>
                        </div>
                      </div>
                      <Button className="w-full mt-4 bg-[#0A2F44] hover:bg-[#0A2F44]/90 group-hover:bg-[#0A2F44]/90">
                        Ver perfil do instrutor
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Trust Section */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold text-[#0A2F44] text-center mb-12">
              Por que escolher o Vrumi Connect?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#0A2F44]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-[#0A2F44]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-[#0A2F44] mb-2">Segurança Jurídica</h3>
                <p className="text-gray-600 text-sm">
                  Contratos digitais assinados antes de cada aula, protegendo alunos e instrutores.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#0A2F44]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-[#0A2F44]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-[#0A2F44] mb-2">Pagamento Seguro</h3>
                <p className="text-gray-600 text-sm">
                  Pagamentos intermediados pela plataforma via PIX ou cartão de crédito.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#0A2F44]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-[#0A2F44]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-[#0A2F44] mb-2">Instrutores Verificados</h3>
                <p className="text-gray-600 text-sm">
                  Todos os instrutores passam por verificação de documentos e qualificações.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#0A2F44] text-white py-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-white/60 text-sm">
              © {new Date().getFullYear()} Vrumi Connect. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
