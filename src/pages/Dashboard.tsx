import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Car } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { DashboardWithSidebar } from "@/components/ui/dashboard-with-collapsible-sidebar";
import { DashboardSkeleton } from "@/components/ui/skeleton-loaders";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";

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
      
      // Show onboarding for new users (no study progress)
      if (data && (!data.study_progress || data.study_progress === 0)) {
        setTimeout(() => setShowOnboarding(true), 1000); // Delay to show after page load
      }
    } catch (error) {
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
      />
    </>
  );
};

export default Dashboard;