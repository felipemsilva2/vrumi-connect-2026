import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Module, Chapter, Lesson } from "@/types/materiais";

export interface ModuleWithChapters extends Module {
  chapters: ChapterWithLessons[];
}

export interface ChapterWithLessons extends Chapter {
  lessons: Lesson[];
}

export const useMateriaisHierarchy = () => {
  return useQuery({
    queryKey: ["materiais-hierarchy"],
    queryFn: async () => {
      // Buscar módulos
      const { data: modules, error: modulesError } = await supabase
        .from("study_modules")
        .select("*")
        .order("order_number");

      if (modulesError) throw modulesError;

      // Buscar capítulos
      const { data: chapters, error: chaptersError } = await supabase
        .from("study_chapters")
        .select("*")
        .order("order_number");

      if (chaptersError) throw chaptersError;

      // Buscar lições
      const { data: lessons, error: lessonsError } = await supabase
        .from("study_lessons")
        .select("*")
        .order("order_number");

      if (lessonsError) throw lessonsError;

      // Organizar hierarquia
      return modules?.map(module => ({
        ...module,
        chapters: chapters?.filter(ch => ch.module_id === module.id).map(chapter => ({
          ...chapter,
          lessons: lessons?.filter(l => l.chapter_id === chapter.id) || []
        })) || []
      })) as ModuleWithChapters[];
    }
  });
};
