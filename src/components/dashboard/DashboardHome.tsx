import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
    BookOpen,
    Target,
    BarChart3,
    TrendingUp,
    Clock,
    CheckCircle2,
    Trophy,
    Award,
    Calendar,
    Shield,
    TrafficCone,
    PieChart,
    Bell,
    Settings,
    CreditCard,
    Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { useMateriaisHierarchy } from "@/hooks/useMateriaisHierarchy";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { useActivePass } from "@/hooks/useActivePass";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StudentBookings } from "@/components/connect/StudentBookings";

// 3D Metric Card Component
interface Metric3DCardProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string | number;
    subtitle: string;
    bgColor: string;
    iconColor: string;
    textColor: string;
    valueColor: string;
    index: number;
    onClick?: () => void;
}

const Metric3DCard: React.FC<Metric3DCardProps> = ({
    icon: Icon,
    title,
    value,
    subtitle,
    bgColor,
    iconColor,
    textColor,
    valueColor,
    index,
    onClick,
}) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [hovered, setHovered] = useState(false);

    const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePos({
            x: (x / rect.width - 0.5) * 12,
            y: (y / rect.height - 0.5) * -12,
        });
    }, []);

    const handleEnter = useCallback(() => setHovered(true), []);
    const handleLeave = useCallback(() => {
        setHovered(false);
        setMousePos({ x: 0, y: 0 });
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, rotateX: -10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className="h-full"
            style={{ transformStyle: "preserve-3d" }}
        >
            <motion.div
                className={cn(
                    "relative p-6 sm:p-8 h-full rounded-2xl border-none shadow-none transform-gpu transition-all duration-300",
                    bgColor,
                    onClick && "cursor-pointer"
                )}
                onMouseMove={handleMove}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
                onClick={onClick}
                animate={{
                    rotateX: mousePos.y,
                    rotateY: mousePos.x,
                    z: hovered ? 15 : 0,
                    scale: hovered ? 1.02 : 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
                role={onClick ? "button" : undefined}
                tabIndex={onClick ? 0 : undefined}
                onKeyDown={onClick ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onClick();
                    }
                } : undefined}
            >
                {/* Shimmer effect */}
                <motion.div
                    className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
                    style={{ transform: "translateZ(3px)" }}
                >
                    <motion.div
                        className="absolute -inset-full"
                        animate={{
                            background: hovered
                                ? `linear-gradient(${mousePos.x + 135}deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)`
                                : "transparent",
                        }}
                        transition={{ duration: 0.3 }}
                    />
                </motion.div>

                <div className="relative z-10" style={{ transform: "translateZ(10px)" }}>
                    <div className="flex items-center justify-between mb-4">
                        <motion.div
                            className="p-2 bg-white rounded-full"
                            animate={{ scale: hovered ? 1.1 : 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Icon className={cn("h-5 w-5", iconColor)} />
                        </motion.div>
                        <motion.div
                            animate={{ y: hovered ? -2 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <TrendingUp className={cn("h-4 w-4", iconColor)} />
                        </motion.div>
                    </div>
                    <h3 className={cn("font-semibold mb-1 drop-shadow-sm", textColor)}>{title}</h3>
                    <motion.p
                        className={cn("text-2xl font-bold drop-shadow-sm", valueColor)}
                        animate={{ scale: hovered ? 1.05 : 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {value}
                    </motion.p>
                    <p className={cn("text-sm font-medium mt-1", textColor, "opacity-90")}>{subtitle}</p>
                </div>

                {/* Bottom accent line */}
                <motion.div
                    className={cn("absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl", valueColor.replace("text-", "bg-"))}
                    animate={{ opacity: hovered ? 0.5 : 0, scaleX: hovered ? 1 : 0.3 }}
                    transition={{ duration: 0.3 }}
                />
            </motion.div>
        </motion.div>
    );
};

interface DashboardHomeProps {
    user: any;
    profile: any;
    setSelected: (value: string) => void;
}

export const DashboardHome = ({ user, profile, setSelected }: DashboardHomeProps) => {
    const [recentActivities, setRecentActivities] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshKey, setRefreshKey] = useState(0)
    const [aggregates, setAggregates] = useState<any>(profile || {})
    const [pendingReviews, setPendingReviews] = useState<number>(0)
    const [categoryProgress, setCategoryProgress] = useState<any[]>([])
    const [quizStats, setQuizStats] = useState<any>({})
    const [trafficSignsStats, setTrafficSignsStats] = useState<any>({ studied: 0, total: 0, confidence: 0 })
    const successRate = aggregates?.total_questions_answered
        ? Math.round((aggregates.correct_answers / aggregates.total_questions_answered) * 100)
        : 0
    const [flashcardStats, setFlashcardStats] = useState({ studied: 0, total: 0 })

    // Hooks para dados de assinatura e hierarquia
    const { hasActivePass, activePass, daysRemaining } = useActivePass(user?.id)
    const materiaisQuery = useMateriaisHierarchy()
    const { data: materiaisData, isLoading: materiaisLoading } = materiaisQuery

    // Extract modules and chapters from the query data
    const modules = materiaisData || []
    const chapters = materiaisData?.flatMap(module => module.chapters) || []
    const lessons = materiaisData?.flatMap(module => module.chapters.flatMap(chapter => chapter.lessons)) || []

    useEffect(() => {
        fetchRecentActivities()
        fetchPendingReviews()
        fetchCategoryProgress()
        fetchQuizStats()
        fetchTrafficSignsStats()
        fetchFlashcardStats()
    }, [user, refreshKey])

    // Calculate and update global progress whenever stats change
    useEffect(() => {
        if (categoryProgress.length > 0 || trafficSignsStats.total > 0 || flashcardStats.total > 0) {
            calculateAndSaveGlobalProgress()
        }
    }, [categoryProgress, trafficSignsStats, flashcardStats])

    const calculateAndSaveGlobalProgress = async () => {
        if (!user?.id) return

        // 1. Calculate Lessons Progress (Average of all modules)
        // If no modules, assume 0. If modules exist but no progress, it's 0.
        const lessonsProgress = categoryProgress.length > 0
            ? categoryProgress.reduce((acc, curr) => acc + curr.progress, 0) / (modules.length || 1)
            : 0

        // 2. Calculate Traffic Signs Progress
        const signsProgress = trafficSignsStats.total > 0
            ? (trafficSignsStats.studied / trafficSignsStats.total) * 100
            : 0

        // 3. Calculate Flashcards Progress
        const flashcardsProgress = flashcardStats.total > 0
            ? (flashcardStats.studied / flashcardStats.total) * 100
            : 0

        // Global Average (weighted equally for now)
        // We divide by the number of active components (e.g., if no flashcards exist, don't penalize?)
        // For simplicity and consistency, we'll divide by 3, assuming all features are core.
        const globalProgress = Math.round((lessonsProgress + signsProgress + flashcardsProgress) / 3)

        // Only update if different from current to avoid loops/unnecessary writes
        if (aggregates?.study_progress !== globalProgress) {
            // Update local state immediately for UI
            setAggregates((prev: any) => ({ ...prev, study_progress: globalProgress }))

            // Update database
            try {
                const { error } = await supabase
                    .from("profiles")
                    .update({ study_progress: globalProgress, updated_at: new Date().toISOString() })
                    .eq("id", user.id)

                if (error) console.error("Error updating global progress:", error)
            } catch (err) {
                console.error("Error saving global progress:", err)
            }
        }
    }

    const fetchFlashcardStats = async () => {
        if (!user?.id || !isSupabaseConfigured || !navigator.onLine) return

        try {
            // Get total flashcards
            const { count: totalCount, error: totalError } = await supabase
                .from("flashcards")
                .select("*", { count: 'exact', head: true })

            if (totalError) throw totalError

            // Get unique studied flashcards
            const { count: studiedCount, error: studiedError } = await supabase
                .from("user_flashcard_stats")
                .select("*", { count: 'exact', head: true })
                .eq("user_id", user.id)

            if (studiedError) throw studiedError

            setFlashcardStats({
                studied: studiedCount || 0,
                total: totalCount || 0
            })
        } catch (error) {
            console.error("Error fetching flashcard stats:", error)
        }
    }

    const fetchPendingReviews = async () => {
        if (!user?.id || !isSupabaseConfigured || !navigator.onLine) return

        try {
            // Primeiro, verificar se há cartões com SM-2 disponíveis
            const { data: sm2Data, error: sm2Error } = await supabase
                .from("flashcards")
                .select("id")
                .not("due_date", "is", null)
                .lte("due_date", new Date().toISOString())
                .limit(100)

            if (!sm2Error && sm2Data && sm2Data.length > 0) {
                setPendingReviews(sm2Data.length)
                return
            }

            // Fallback: usar user_flashcard_stats
            const { data: statsData, error: statsError } = await supabase
                .from("user_flashcard_stats")
                .select("id")
                .eq("user_id", user.id)
                .not("next_review", "is", null)
                .lte("next_review", new Date().toISOString())
                .limit(100)

            if (!statsError && statsData) {
                setPendingReviews(statsData.length)
            }
        } catch (error) {
            console.error("Error fetching pending reviews:", error)
            setPendingReviews(0)
        }
    }

    const getModuleColor = (moduleName: string) => {
        const colors = {
            'Direção Defensiva': 'bg-blue-500',
            'Primeiros Socorros': 'bg-green-500',
            'Mecânica Básica': 'bg-orange-500',
            'Legislação': 'bg-purple-500',
            'Noções de Mecânica': 'bg-red-500',
            'Direção': 'bg-indigo-500',
            'Mecânica': 'bg-yellow-500'
        }
        return colors[moduleName as keyof typeof colors] || 'bg-gray-500'
    }

    const fetchCategoryProgress = async () => {
        if (!user?.id || !isSupabaseConfigured || !navigator.onLine || !modules.length) return

        try {
            // Buscar progresso do usuário por capítulos
            const { data: userProgress, error: progressError } = await supabase
                .from("user_progress")
                .select("lesson_id, completed")
                .eq("user_id", user.id)

            if (progressError) throw progressError

            // Calcular progresso por módulo
            const moduleProgress = modules.map(module => {
                const moduleChapters = chapters.filter(chapter => chapter.module_id === module.id)
                const completedChapters = moduleChapters.filter(chapter =>
                    userProgress?.some(progress => progress.lesson_id === chapter.id && progress.completed)
                ).length
                const totalChapters = moduleChapters.length
                const progress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0

                return {
                    name: module.title,
                    progress,
                    color: getModuleColor(module.title)
                }
            }).filter(module => module.progress > 0) // Mostrar apenas módulos com progresso

            setCategoryProgress(moduleProgress)
        } catch (error) {
            console.error("Error fetching category progress:", error)
            setCategoryProgress([])
        }
    }

    const fetchQuizStats = async () => {
        if (!user?.id || !isSupabaseConfigured || !navigator.onLine) return

        try {
            // Buscar últimas tentativas de simulados
            const { data: attempts, error: attemptsError } = await supabase
                .from("user_quiz_attempts")
                .select("score_percentage, total_questions, created_at")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(5)

            if (attemptsError) throw attemptsError

            // Buscar tentativas dos últimos 7 dias
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

            const { data: weekAttempts, error: weekError } = await supabase
                .from("user_quiz_attempts")
                .select("score_percentage, total_questions")
                .eq("user_id", user.id)
                .gte("created_at", sevenDaysAgo.toISOString())

            if (weekError) throw weekError

            // Calcular estatísticas
            const lastAttempt = attempts?.[0]
            const weekAverage = weekAttempts && weekAttempts.length > 0
                ? Math.round(weekAttempts.reduce((sum, attempt) =>
                    sum + attempt.score_percentage, 0) / weekAttempts.length)
                : 0

            setQuizStats({
                lastScore: lastAttempt ? Math.round(lastAttempt.score_percentage) : 0,
                weekAverage,
                totalAttempts: attempts?.length || 0
            })
        } catch (error) {
            console.error("Error fetching quiz stats:", error)
            setQuizStats({ lastScore: 0, weekAverage: 0, totalAttempts: 0 })
        }
    }

    const fetchTrafficSignsStats = async () => {
        if (!user?.id || !isSupabaseConfigured || !navigator.onLine) return

        try {
            // Buscar total de placas disponíveis
            const { data: totalSigns, error: totalError } = await supabase
                .from("traffic_signs")
                .select("id")
                .eq("is_active", true)

            if (totalError) throw totalError

            // Buscar progresso do usuário em placas
            const { data: userProgress, error: progressError } = await supabase
                .from("user_sign_progress")
                .select("sign_id, times_reviewed, times_correct, confidence_level")
                .eq("user_id", user.id)

            if (progressError) throw progressError

            const studiedSigns = userProgress?.length || 0
            const totalAvailable = totalSigns?.length || 0
            const averageConfidence = userProgress && userProgress.length > 0
                ? Math.round(userProgress.reduce((sum, sign) => sum + (sign.confidence_level || 0), 0) / userProgress.length)
                : 0

            setTrafficSignsStats({
                studied: studiedSigns,
                total: totalAvailable,
                confidence: averageConfidence
            })
        } catch (error) {
            console.error("Error fetching traffic signs stats:", error)
            setTrafficSignsStats({ studied: 0, total: 0, confidence: 0 })
        }
    }

    const fetchRecentActivities = async () => {
        if (!isSupabaseConfigured || !navigator.onLine || !user?.id) {
            setLoading(false)
            return
        }
        try {
            const { data, error } = await supabase
                .from("user_activities")
                .select("*")
                .eq("user_id", user?.id)
                .order("created_at", { ascending: false })
                .limit(5)

            if (error) throw error
            setRecentActivities(data || [])
        } catch (error) {
            console.error("Error fetching activities:", error)
        } finally {
            setLoading(false)
        }
    }

    // Atualiza agregados do perfil ao montar (garante sincronização visual)
    useEffect(() => {
        const fetchProfileAggregates = async () => {
            try {
                if (!user?.id || !isSupabaseConfigured || !navigator.onLine) return
                const query = supabase
                    .from("profiles")
                    .select("total_flashcards_studied,total_questions_answered,correct_answers,study_progress")
                    .eq("id", user.id)
                let data: any = null
                let error: any = null
                if (typeof (query as any).maybeSingle === 'function') {
                    ({ data, error } = await (query as any).maybeSingle())
                } else if (typeof (query as any).single === 'function') {
                    try {
                        ({ data, error } = await (query as any).single())
                    } catch {
                        data = null; error = null
                    }
                }
                if (!error && data) {
                    setAggregates(data)
                    setRefreshKey((k) => k + 1)
                }
            } catch (e) {
                console.error("Error fetching profile aggregates:", e)
            }
        }
        fetchProfileAggregates()
    }, [user])

    // Assinaturas Realtime para atualizar imediatamente quando houver mudanças
    useEffect(() => {
        if (!user?.id) return

        let activitiesChannel: any = null
        if (typeof (supabase as any).channel === 'function') {
            activitiesChannel = (supabase as any)
                .channel(`user-activities-${user.id}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'user_activities', filter: `user_id=eq.${user.id}` },
                    (payload: any) => {
                        setRecentActivities((prev) => [payload.new as any, ...(prev || [])].slice(0, 5))
                        setLoading(false)
                    }
                )
                .subscribe()
        }

        let profileChannel: any = null
        if (typeof (supabase as any).channel === 'function') {
            profileChannel = (supabase as any)
                .channel(`profile-aggregates-${user.id}`)
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
                    (payload: any) => {
                        setAggregates(payload.new as any)
                    }
                )
                .subscribe()
        }

        return () => {
            if (activitiesChannel) (supabase as any).removeChannel(activitiesChannel)
            if (profileChannel) (supabase as any).removeChannel(profileChannel)
        }
    }, [user?.id])

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "flashcard_studied": return BookOpen
            case "quiz_completed": return CheckCircle2
            case "achievement_unlocked": return Trophy
            case "category_started": return Target
            case "personal_record": return Award
            default: return Calendar
        }
    }

    const getActivityColor = (type: string) => {
        switch (type) {
            case "flashcard_studied": return "blue"
            case "quiz_completed": return "green"
            case "achievement_unlocked": return "purple"
            case "category_started": return "orange"
            case "personal_record": return "green"
            default: return "blue"
        }
    }

    const formatActivityTime = (timestamp: string) => {
        const now = new Date()
        const activityDate = new Date(timestamp)
        const diffMs = now.getTime() - activityDate.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffMins < 1) return "Agora"
        if (diffMins < 60) return `${diffMins} min atrás`
        if (diffHours < 24) return `${diffHours}h atrás`
        if (diffDays === 0) return "Hoje"
        if (diffDays === 1) return "Ontem"
        return `${diffDays} dias atrás`
    }

    return (
        <>
            {/* Cards de Métricas Principais com efeito 3D */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-6 lg:mb-8" data-tutorial="dashboard" style={{ perspective: "1500px" }}>
                <Metric3DCard
                    icon={BookOpen}
                    title="Flashcards Estudados"
                    value={aggregates?.total_flashcards_studied || 0}
                    subtitle="Continue estudando!"
                    bgColor="bg-[#FEF3E2]"
                    iconColor="text-orange-700"
                    textColor="text-orange-800"
                    valueColor="text-orange-700"
                    index={0}
                />

                <Metric3DCard
                    icon={Trophy}
                    title="Taxa de Acerto"
                    value={`${successRate}%`}
                    subtitle="Excelente desempenho!"
                    bgColor="bg-[#D1FAE5]"
                    iconColor="text-emerald-700"
                    textColor="text-emerald-800"
                    valueColor="text-emerald-700"
                    index={1}
                />

                <Metric3DCard
                    icon={Target}
                    title="Questões Respondidas"
                    value={aggregates?.total_questions_answered || 0}
                    subtitle="Meta: 500 questões"
                    bgColor="bg-[#FCE7F3]"
                    iconColor="text-pink-700"
                    textColor="text-pink-800"
                    valueColor="text-pink-700"
                    index={2}
                />

                <Metric3DCard
                    icon={BarChart3}
                    title="Progresso Geral"
                    value={`${aggregates?.study_progress || 0}%`}
                    subtitle="Continue assim!"
                    bgColor="bg-[#DBEAFE]"
                    iconColor="text-blue-700"
                    textColor="text-blue-800"
                    valueColor="text-blue-700"
                    index={3}
                />

                <Metric3DCard
                    icon={TrafficCone}
                    title="Placas Estudadas"
                    value={`${trafficSignsStats.studied} de ${trafficSignsStats.total}`}
                    subtitle={`Confiança: ${trafficSignsStats.confidence}%`}
                    bgColor="bg-[#FEF3C7]"
                    iconColor="text-amber-700"
                    textColor="text-amber-800"
                    valueColor="text-amber-700"
                    index={4}
                    onClick={() => {
                        console.log('Navigating to Biblioteca de Placas...')
                        setSelected("Biblioteca de Placas")
                    }}
                />
            </div>

            {/* Seção de Revisões e Progresso */}
            {/* Seção de Revisões e Progresso */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 lg:mb-8">
                {/* Revisões Pendentes SRS */}
                <Card variant="elevated" className="p-6 sm:p-8 h-full">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Revisões Pendentes</h3>
                        <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="space-y-4">
                        {pendingReviews > 0 ? (
                            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">Revisão Diária</p>
                                        <p className="text-sm text-muted-foreground">{pendingReviews} flashcards pendentes</p>
                                    </div>
                                </div>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                        console.log('Navigating to Flashcards...')
                                        setSelected("Flashcards")
                                    }}
                                >
                                    Revisar
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <div className="text-4xl mb-2">🧠</div>
                                <p className="text-sm text-muted-foreground">Nenhuma revisão pendente!</p>
                                <p className="text-xs text-muted-foreground mt-1">Continue estudando para criar novas revisões</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Progresso por Categoria */}
                <Card variant="elevated" className="p-6 sm:p-8 h-full">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Progresso por Categoria</h3>
                        <Target className="h-5 w-5 text-muted-foreground" />
                    </div>

                    {categoryProgress.length > 0 ? (
                        <div className="space-y-3">
                            {categoryProgress.map((category) => (
                                <div key={category.name} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-foreground">{category.name}</span>
                                        <span className="text-muted-foreground">{category.progress}%</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className={`${category.color} h-2 rounded-full transition-all duration-300`}
                                            style={{ width: `${category.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <div className="text-4xl mb-2">📚</div>
                            <p className="text-sm text-muted-foreground">Comece a estudar para ver seu progresso!</p>
                        </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-border">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                                console.log('Navigating to Estatísticas...')
                                setSelected("Estatísticas")
                            }}
                        >
                            Ver Detalhes
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Cards de Assinatura e Simulados */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 lg:mb-8">
                {/* Status da Assinatura */}
                <Card variant="elevated" className="p-6 sm:p-8 h-full">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Status da Assinatura</h3>
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="space-y-4">
                        {hasActivePass ? (
                            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">
                                        {activePass?.pass_type === 'family_90_days' ? 'Plano Família (90 dias)' :
                                            activePass?.pass_type === '90_days' ? 'Premium 90 Dias' :
                                                activePass?.pass_type === '30_days' ? 'Premium 30 Dias' :
                                                    'Plano Ativo'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Expira hoje'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <div className="text-4xl mb-2">🔒</div>
                                <p className="text-sm text-muted-foreground mb-2">Assinatura não ativa</p>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                        console.log('Navigating to Meu Perfil...')
                                        setSelected("Meu Perfil")
                                    }}
                                >
                                    Ativar Plano
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Resumo de Simulados */}
                <Card variant="elevated" className="p-6 sm:p-8 h-full">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Resumo de Simulados</h3>
                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    </div>

                    {
                        quizStats.totalAttempts > 0 ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Última Pontuação</span>
                                    <span className="font-semibold">{quizStats.lastScore}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Média 7 dias</span>
                                    <span className="font-semibold">{quizStats.weekAverage}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Total de Tentativas</span>
                                    <span className="font-semibold">{quizStats.totalAttempts}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <div className="text-4xl mb-2">📝</div>
                                <p className="text-sm text-muted-foreground">Nenhum simulado realizado</p>
                            </div>
                        )
                    }

                    <div className="mt-4 pt-4 border-t border-border">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => setSelected("Simulados")}
                        >
                            Ver Detalhes
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Atividades Recentes */}
            <Card variant="glass" className="mb-6 lg:mb-8">
                <CardContent className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Atividades Recentes</h3>
                        <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 animate-pulse">
                                    <div className="w-8 h-8 bg-muted rounded-full"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                                        <div className="h-3 bg-muted rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : recentActivities.length > 0 ? (
                        <div className="space-y-3">
                            {recentActivities.map((activity, index) => {
                                const IconComponent = getActivityIcon(activity.type)
                                const colorClass = getActivityColor(activity.type)

                                // Define colors based on activity type
                                const colorStyles = {
                                    blue: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
                                    green: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' },
                                    purple: { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
                                    orange: { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
                                    red: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' }
                                }

                                const style = colorStyles[colorClass as keyof typeof colorStyles] || colorStyles.blue

                                return (
                                    <div key={activity.id || index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${style.bg}`}>
                                            <IconComponent className={`h-4 w-4 ${style.text}`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-foreground">{activity.description}</p>
                                            <p className="text-xs text-muted-foreground">{formatActivityTime(activity.created_at)}</p>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {activity.category && <Badge variant="outline" className="text-xs">{activity.category}</Badge>}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-4">📚</div>
                            <p className="text-muted-foreground">Nenhuma atividade recente. Comece a estudar!</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={() => {
                                    console.log('Navigating to Flashcards...')
                                    setSelected("Flashcards")
                                }}
                            >
                                Ver Flashcards
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Vrumi Connect - Minhas Aulas */}
            {user?.id && (
                <div className="mt-6">
                    <StudentBookings userId={user.id} />
                </div>
            )}
        </>
    )
}
