import { useEffect, useState } from "react"
import { BookOpen, Clock, CheckCircle2, Play } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

interface Chapter {
  id: string
  title: string
  description: string
  order_number: number
  icon: string
  estimated_time: string
}

interface Lesson {
  id: string
  chapter_id: string
  title: string
  content: string
  order_number: number
  estimated_time: string
}

interface UserProgress {
  lesson_id: string
  completed: boolean
}

export const MateriaisView = () => {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchChapters()
    fetchUserProgress()
  }, [])

  const fetchChapters = async () => {
    try {
      const { data, error } = await supabase
        .from("study_chapters")
        .select("*")
        .order("order_number")

      if (error) throw error
      setChapters(data || [])
    } catch (error) {
      console.error("Error fetching chapters:", error)
      toast({
        title: "Erro ao carregar capítulos",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("user_progress")
        .select("lesson_id, completed")
        .eq("user_id", user.id)

      if (error) throw error
      setUserProgress(data || [])
    } catch (error) {
      console.error("Error fetching progress:", error)
    }
  }

  const fetchLessons = async (chapterId: string) => {
    try {
      const { data, error } = await supabase
        .from("study_lessons")
        .select("*")
        .eq("chapter_id", chapterId)
        .order("order_number")

      if (error) throw error
      setLessons(data || [])
    } catch (error) {
      console.error("Error fetching lessons:", error)
      toast({
        title: "Erro ao carregar lições",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      })
    }
  }

  const handleChapterClick = (chapter: Chapter) => {
    setSelectedChapter(chapter)
    setSelectedLesson(null)
    fetchLessons(chapter.id)
  }

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson)
  }

  const handleBackToChapters = () => {
    setSelectedChapter(null)
    setLessons([])
    setSelectedLesson(null)
  }

  const handleBackToLessons = () => {
    setSelectedLesson(null)
  }

  const markLessonComplete = async () => {
    if (!selectedLesson) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from("user_progress")
        .upsert({
          user_id: user.id,
          lesson_id: selectedLesson.id,
          completed: true,
          completion_date: new Date().toISOString(),
        })

      if (error) throw error

      toast({
        title: "Lição concluída!",
        description: "Seu progresso foi salvo",
      })

      fetchUserProgress()
    } catch (error) {
      console.error("Error marking lesson complete:", error)
      toast({
        title: "Erro ao salvar progresso",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      })
    }
  }

  const getChapterProgress = (chapterId: string) => {
    const chapterLessons = lessons.filter(l => l.chapter_id === chapterId)
    if (chapterLessons.length === 0) return 0
    const completed = chapterLessons.filter(l => 
      userProgress.some(p => p.lesson_id === l.id && p.completed)
    ).length
    return Math.round((completed / chapterLessons.length) * 100)
  }

  const isLessonCompleted = (lessonId: string) => {
    return userProgress.some(p => p.lesson_id === lessonId && p.completed)
  }

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  // View: Lesson Content
  if (selectedLesson) {
    return (
      <div className="space-y-6">
        <button
          onClick={handleBackToLessons}
          className="text-primary hover:underline flex items-center gap-2"
        >
          ← Voltar para lições
        </button>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{selectedLesson.title}</h2>
              <p className="text-muted-foreground flex items-center gap-2 mt-2">
                <Clock className="h-4 w-4" />
                {selectedLesson.estimated_time}
              </p>
            </div>
            {!isLessonCompleted(selectedLesson.id) && (
              <button
                onClick={markLessonComplete}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Marcar como Concluído
              </button>
            )}
            {isLessonCompleted(selectedLesson.id) && (
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Concluído</span>
              </div>
            )}
          </div>

          <div 
            className="prose prose-slate dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: selectedLesson.content.replace(/\n/g, '<br />') }}
          />
        </div>
      </div>
    )
  }

  // View: Lessons List
  if (selectedChapter) {
    const progress = getChapterProgress(selectedChapter.id)
    
    return (
      <div className="space-y-6">
        <button
          onClick={handleBackToChapters}
          className="text-primary hover:underline flex items-center gap-2"
        >
          ← Voltar para capítulos
        </button>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">{selectedChapter.title}</h2>
          <p className="text-muted-foreground mb-4">{selectedChapter.description}</p>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Progresso do Capítulo</span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-3">
            {lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                onClick={() => handleLessonClick(lesson)}
                className="bg-background border border-border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {lesson.title}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3" />
                        {lesson.estimated_time}
                      </p>
                    </div>
                  </div>
                  {isLessonCompleted(lesson.id) ? (
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  ) : (
                    <Play className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // View: Chapters List
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Materiais de Estudo</h2>
          <p className="text-muted-foreground mt-1">
            Conteúdo oficial do Senado Federal para sua habilitação
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            onClick={() => handleChapterClick(chapter)}
            className="bg-card border border-border rounded-xl p-6 hover:shadow-card transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <BookOpen className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-medium px-2 py-1 bg-secondary/10 text-secondary rounded-full">
                  Capítulo {chapter.order_number}
                </span>
              </div>
            </div>

            <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {chapter.title}
            </h3>

            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {chapter.description}
            </p>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {chapter.estimated_time}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Total de Capítulos</h4>
          <p className="text-2xl font-bold text-primary">{chapters.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Lições Concluídas</h4>
          <p className="text-2xl font-bold text-success">{userProgress.filter(p => p.completed).length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Horas de Conteúdo</h4>
          <p className="text-2xl font-bold text-secondary">21h</p>
        </div>
      </div>
    </div>
  )
}
