import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, BookOpen, Clock, ChevronLeft, CheckCircle2 } from "lucide-react"
import { useMateriaisHierarchy, type ModuleWithChapters, type ChapterWithLessons } from "@/hooks/useMateriaisHierarchy"
import { useLessonContents } from "@/hooks/useLessonContents"
import type { Lesson } from "@/types/materiais"
import { ContentBlock } from "@/components/materiais/ContentBlock"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

type ViewMode = 'modules' | 'chapters' | 'lessons' | 'content';

const MateriaisView = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('modules');
  const [selectedModule, setSelectedModule] = useState<ModuleWithChapters | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<ChapterWithLessons | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const { data: hierarchy, isLoading: isLoadingHierarchy } = useMateriaisHierarchy();
  const { data: lessonContents, isLoading: isLoadingContents } = useLessonContents(selectedLesson?.id || null);
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const handleModuleClick = (module: ModuleWithChapters) => {
    setSelectedModule(module);
    setViewMode('chapters');
  };

  const handleChapterClick = (chapter: ChapterWithLessons) => {
    setSelectedChapter(chapter);
    setViewMode('lessons');
  };

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setViewMode('content');
  };

  const handleCompleteLesson = async () => {
    if (!userId || !selectedLesson) return;

    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          lesson_id: selectedLesson.id,
          completed: true,
          completion_date: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Lição concluída! ✅",
        description: "Seu progresso foi salvo com sucesso."
      });
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: "Erro ao salvar progresso",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };

  const handleBack = () => {
    if (viewMode === 'content') {
      setViewMode('lessons');
      setSelectedLesson(null);
    } else if (viewMode === 'lessons') {
      setViewMode('chapters');
      setSelectedChapter(null);
    } else if (viewMode === 'chapters') {
      setViewMode('modules');
      setSelectedModule(null);
    }
  };

  const getBreadcrumb = () => {
    const parts = ['Materiais'];
    if (selectedModule) parts.push(selectedModule.title);
    if (selectedChapter) parts.push(selectedChapter.title);
    if (selectedLesson) parts.push(selectedLesson.title);
    return parts.join(' > ');
  };

  if (isLoadingHierarchy) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {viewMode !== 'modules' && (
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        )}
        <span>{getBreadcrumb()}</span>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          {viewMode === 'modules' && 'Materiais de Estudo'}
          {viewMode === 'chapters' && selectedModule?.title}
          {viewMode === 'lessons' && selectedChapter?.title}
          {viewMode === 'content' && selectedLesson?.title}
        </h2>
        <p className="text-muted-foreground">
          {viewMode === 'modules' && 'Escolha um módulo para começar seus estudos'}
          {viewMode === 'chapters' && selectedModule?.description}
          {viewMode === 'lessons' && selectedChapter?.description}
          {viewMode === 'content' && `Tempo estimado: ${selectedLesson?.estimated_time || 'N/A'}`}
        </p>
      </div>

      {/* Modules View */}
      {viewMode === 'modules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hierarchy?.map((module) => (
            <Card
              key={module.id}
              className="cursor-pointer hover:shadow-card transition-all border-border hover:border-primary/50"
              onClick={() => handleModuleClick(module)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2 flex items-center gap-2">
                      <span className="text-3xl">{module.icon}</span>
                      {module.title}
                    </CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{module.chapters.length} capítulos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{module.estimated_hours}h</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progresso</span>
                      <span>0%</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Chapters View */}
      {viewMode === 'chapters' && selectedModule && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedModule.chapters.map((chapter) => (
            <Card
              key={chapter.id}
              className="cursor-pointer hover:shadow-card transition-all border-border hover:border-primary/50"
              onClick={() => handleChapterClick(chapter)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{chapter.icon}</span>
                      {chapter.title}
                    </CardTitle>
                    <CardDescription>{chapter.description}</CardDescription>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{chapter.lessons.length} lições</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{chapter.estimated_time}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lessons View */}
      {viewMode === 'lessons' && selectedChapter && (
        <div className="space-y-3">
          {selectedChapter.lessons.map((lesson, index) => (
            <Card
              key={lesson.id}
              className="cursor-pointer hover:shadow-card transition-all border-border hover:border-primary/50"
              onClick={() => handleLessonClick(lesson)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{lesson.title}</h3>
                      {lesson.estimated_time && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {lesson.estimated_time}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Content View */}
      {viewMode === 'content' && selectedLesson && (
        <Card>
          <CardContent className="p-6 md:p-8">
            {isLoadingContents ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : lessonContents && lessonContents.length > 0 ? (
              <div className="prose prose-slate dark:prose-invert max-w-none">
                {lessonContents.map((content) => (
                  <ContentBlock key={content.id} content={content} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Conteúdo em desenvolvimento. Em breve disponível!
                </p>
              </div>
            )}

            {lessonContents && lessonContents.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Voltar às lições
                </Button>
                <Button onClick={handleCompleteLesson}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar como concluída
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default MateriaisView
