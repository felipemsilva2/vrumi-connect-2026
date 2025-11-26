import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { Car } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { DashboardWithSidebar } from "@/components/ui/dashboard-with-collapsible-sidebar";
import { DashboardSkeleton } from "@/components/ui/skeleton-loaders";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/utils/errorMessages";
// import { notificationScheduler } from "@/services/NotificationSchedulerService";
import { AppLayout } from '@/components/Layout/AppLayout';

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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();

    // Iniciar o agendador de notificações
    // notificationScheduler.start();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          navigate("/entrar");
          // Parar o agendador ao fazer logout
          // notificationScheduler.stop();
        } else {
          setUser(session.user);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      // Parar o agendador ao desmontar o componente
      // notificationScheduler.stop();
    };
  }, [navigate]);

  const checkUser = async () => {
    if (!isSupabaseConfigured || !navigator.onLine) {
      setIsLoading(false);
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/entrar");
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
      navigate("/entrar");
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

      // Check if user has already seen onboarding
      const hasSeenOnboarding = localStorage.getItem(`onboarding_seen_${userId}`);

      // Show onboarding for new users (no study progress) who haven't seen it yet
      if (data && (!data.study_progress || data.study_progress === 0) && !hasSeenOnboarding) {
        setTimeout(() => setShowOnboarding(true), 1000); // Delay to show after page load
      }
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
    return <DashboardSkeleton />;
  }

  return (
    <>
      <DashboardWithSidebar user={user} profile={profile} />
      <OnboardingTutorial
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => console.log("Onboarding completed")}
        userId={user?.id}
      />
    </>
  );
};

export default Dashboard;