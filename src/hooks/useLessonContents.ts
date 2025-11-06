import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LessonContent } from "@/types/materiais";

export const useLessonContents = (lessonId: string | null) => {
  return useQuery({
    queryKey: ["lesson-contents", lessonId],
    queryFn: async () => {
      if (!lessonId) return null;

      const { data, error } = await supabase
        .from("lesson_contents")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("order_position");
      
      if (error) throw error;
      
      return data as unknown as LessonContent[];
    },
    enabled: !!lessonId
  });
};
