import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import StudyRoom from "./StudyRoom";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "@/utils/errorMessages";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/Layout/AppLayout";

interface Profile {
  full_name: string | null;
  study_progress: number;
  total_flashcards_studied: number;
  correct_answers: number;
  total_questions_answered: number;
}

const StudyRoomWrapper = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, [navigate]);

  const checkUser = async () => {
    if (!isSupabaseConfigured || !navigator.onLine) {
      setIsLoading(false);
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      await fetchProfile(session.user.id);
    } catch (error) {
      const errorInfo = getErrorMessage(error);
      
      toast({
        title: errorInfo.title,
        description: errorInfo.message,
        variant: "destructive",
        duration: 5000,
      });
      
      console.error("Error checking user:", error);
      navigate("/auth");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    if (!isSupabaseConfigured || !navigator.onLine) return;
    try {
      const query = supabase
        .from("profiles")
        .select("*")
        .eq("id", userId);
      let data: any = null;
      let error: any = null;
      if (typeof (query as any).maybeSingle === 'function') {
        ({ data, error } = await (query as any).maybeSingle());
      } else if (typeof (query as any).single === 'function') {
        try {
          ({ data, error } = await (query as any).single());
        } catch {
          data = null; error = null;
        }
      } else {
        data = null; error = null;
      }

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      const errorInfo = getErrorMessage(error);
      
      toast({
        title: errorInfo.title,
        description: errorInfo.message,
        variant: "destructive",
        duration: 5000,
      });
      
      console.error("Error fetching profile:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <AppLayout 
      user={user} 
      profile={profile}
      title="Sala de Estudos"
      subtitle="Estude com IA e visualize materiais interativos"
      showBreadcrumb={false}
    >
      <StudyRoom user={user} profile={profile} />
    </AppLayout>
  );
};

export default StudyRoomWrapper;