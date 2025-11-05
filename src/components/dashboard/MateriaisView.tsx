import { useEffect, useState } from "react"
import { BookOpen, Clock, CheckCircle2, Play, ArrowLeft, List } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ImageWithFallback } from "@/components/ImageWithFallback"
import { motion } from "framer-motion"

interface Chapter {
  id: string
  title: string
  description: string
  order_number: number
  icon: string
  estimated_time: string
}

interface LessonImage {
  url: string
  caption: string
  section: string
  position: number
}

interface Lesson {
  id: string
  chapter_id: string
  title: string
  content: string
  order_number: number
  estimated_time: string
  images?: LessonImage[]
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
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchChapters()
    fetchUserProgress()
  }, [])

  // Listener para zoom de imagens inline
  useEffect(() => {
    const handleImageZoom = (e: any) => {
      setZoomedImage(e.detail);
    };
    document.addEventListener('image-zoom', handleImageZoom);
    return () => document.removeEventListener('image-zoom', handleImageZoom);
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
      
      // Transform the data to match our Lesson interface
      const transformedLessons: Lesson[] = (data || []).map(lesson => ({
        ...lesson,
        images: lesson.images ? (lesson.images as unknown as LessonImage[]) : undefined
      }))
      
      setLessons(transformedLessons)
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
    // Processa o conteúdo markdown para HTML estruturado
    const processContent = (content: string) => {
      const sections: { title: string; content: string; images: LessonImage[] }[] = []
      const lines = content.split('\n')
      let currentSection: { title: string; content: string; images: LessonImage[] } | null = null

      lines.forEach(line => {
        if (line.startsWith('# ')) {
          // Título principal - ignorar, já está no header
          return
        } else if (line.startsWith('## ')) {
          // Nova seção
          if (currentSection) {
            sections.push(currentSection)
          }
          const sectionTitle = line.replace('## ', '').trim()
          currentSection = {
            title: sectionTitle,
            content: '',
            images: selectedLesson.images?.filter(img => 
              img.section.toLowerCase().includes(sectionTitle.toLowerCase()) ||
              sectionTitle.toLowerCase().includes(img.section.toLowerCase())
            ) || []
          }
        } else if (currentSection) {
          // Adiciona conteúdo à seção atual
          currentSection.content += line + '\n'
        }
      })

      if (currentSection) {
        sections.push(currentSection)
      }

      return sections
    }

    const sections = processContent(selectedLesson.content)

    return (
      <div className="min-h-screen bg-background flex flex-col items-center py-6 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl mb-6"
        >
          <Button
            variant="ghost"
            onClick={handleBackToLessons}
            className="mb-4 hover:bg-accent"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para lições
          </Button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <BookOpen className="text-primary h-7 w-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {selectedLesson.title}
                </h1>
                <div className="flex items-center text-sm text-muted-foreground mt-2">
                  <Clock size={16} className="mr-1" /> 
                  {selectedLesson.estimated_time}
                </div>
              </div>
            </div>

            {!isLessonCompleted(selectedLesson.id) ? (
              <Button
                onClick={markLessonComplete}
                className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2 shadow-md"
              >
                <CheckCircle2 size={18} /> 
                Marcar como Concluído
              </Button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-600 dark:text-green-400">Concluído</span>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-4xl space-y-6"
        >
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card className="shadow-lg rounded-2xl border-2 border-border/50 hover:shadow-xl transition-shadow">
                <CardHeader className="pb-4">
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <List size={20} className="text-primary" /> 
                    {section.title}
                  </h2>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-slate dark:prose-invert max-w-none
                      prose-headings:text-foreground prose-headings:font-semibold
                      prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
                      prose-h4:text-base prose-h4:mt-4 prose-h4:mb-2
                      prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
                      prose-strong:text-foreground prose-strong:font-semibold
                      prose-ul:my-4 prose-ul:space-y-2
                      prose-li:text-muted-foreground prose-li:leading-relaxed
                      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                      prose-img:rounded-lg prose-img:shadow-md prose-img:max-w-xs prose-img:mx-auto prose-img:my-4 prose-img:cursor-pointer prose-img:hover:shadow-xl prose-img:transition-shadow"
                    dangerouslySetInnerHTML={{ 
                      __html: section.content
                        .replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
                          return `<img src="${src}" alt="${alt}" onclick="document.dispatchEvent(new CustomEvent('image-zoom', {detail: '${src}'}))" class="inline-image" />`
                        })
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/### (.*?)(\n|$)/g, '<h3>$1</h3>')
                        .replace(/#### (.*?)(\n|$)/g, '<h4>$1</h4>')
                        .replace(/\n- /g, '\n<li>')
                        .replace(/<li>/g, '<ul><li>')
                        .replace(/(<li>.*?)(\n\n|$)/gs, '$1</li></ul>')
                        .replace(/<\/ul>\n<ul>/g, '')
                        .replace(/\n\n/g, '</p><p>')
                        .replace(/^(.)/g, '<p>$1')
                        .replace(/(.)\n$/g, '$1</p>')
                    }}
                  />
                  
                  {section.images && section.images.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      {section.images.sort((a, b) => a.position - b.position).map((image, imgIdx) => (
                        <div key={imgIdx} className="flex flex-col items-center space-y-2">
                          <ImageWithFallback
                            src={image.url}
                            alt={image.caption}
                            className="max-w-full h-auto rounded-lg shadow-md cursor-pointer hover:shadow-xl transition-shadow border-2 border-border/50"
                            fallbackClassName="h-64 w-full"
                            onClick={() => setZoomedImage(image.url)}
                          />
                          <p className="text-sm text-muted-foreground text-center italic">
                            {image.caption}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Modal de Zoom para Imagens */}
        <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Visualização Ampliada</DialogTitle>
            </DialogHeader>
            <img 
              src={zoomedImage || ''} 
              alt="Imagem ampliada" 
              className="w-full h-auto rounded-lg"
            />
            <DialogDescription className="text-center text-sm text-muted-foreground mt-2">
              Clique fora da imagem ou pressione ESC para fechar
            </DialogDescription>
          </DialogContent>
        </Dialog>
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
