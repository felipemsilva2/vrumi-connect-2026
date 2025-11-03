import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Car, 
  LogOut, 
  BookOpen, 
  TrendingUp, 
  Trophy,
  Target,
  User
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Profile {
  full_name: string | null;
  study_progress: number;
  total_flashcards_studied: number;
  correct_answers: number;
  total_questions_answered: number;
}

const Dashboard = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          navigate("/auth");
        } else {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      await fetchProfile(session.user.id);
    } catch (error) {
      console.error("Error checking user:", error);
      navigate("/auth");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Erro ao fazer logout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Car className="w-12 h-12 animate-pulse mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const successRate = profile?.total_questions_answered 
    ? Math.round((profile.correct_answers / profile.total_questions_answered) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-black">CNH FÁCIL</h1>
          </div>
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Olá, {profile?.full_name || user?.email?.split('@')[0]}! 👋
          </h2>
          <p className="text-muted-foreground">
            Continue seus estudos para conquistar sua CNH
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 hover:shadow-elegant transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Flashcards Estudados</p>
                <p className="text-2xl font-bold">{profile?.total_flashcards_studied || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-elegant transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <Trophy className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Acerto</p>
                <p className="text-2xl font-bold">{successRate}%</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-elegant transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent/10 rounded-lg">
                <Target className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Questões Respondidas</p>
                <p className="text-2xl font-bold">{profile?.total_questions_answered || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-elegant transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progresso</p>
                <p className="text-2xl font-bold">{profile?.study_progress || 0}%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-8 hover:shadow-elegant transition-all">
            <BookOpen className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">Estudar Flashcards</h3>
            <p className="text-muted-foreground mb-4">
              Continue revisando os conceitos importantes
            </p>
            <Button variant="hero" className="w-full" disabled>
              Em breve
            </Button>
          </Card>

          <Card className="p-8 hover:shadow-elegant transition-all">
            <Target className="w-12 h-12 text-success mb-4" />
            <h3 className="text-xl font-bold mb-2">Fazer Simulado</h3>
            <p className="text-muted-foreground mb-4">
              Teste seus conhecimentos com questões reais
            </p>
            <Button variant="hero" className="w-full" disabled>
              Em breve
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
