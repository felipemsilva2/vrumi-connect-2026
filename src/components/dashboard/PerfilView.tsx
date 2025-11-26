import { useState, useEffect } from "react"
import { Mail, Calendar, Trophy, BookOpen, Target, Loader2, Save, User } from "lucide-react"
import { useActivePass } from "@/hooks/useActivePass"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AvatarUpload } from "./AvatarUpload"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PerfilViewProps {
  user: any
  profile: any
}

export const PerfilView = ({ user, profile }: PerfilViewProps) => {
  const { hasActivePass, activePass } = useActivePass(user?.id)
  const { toast } = useToast()

  const [fullName, setFullName] = useState(profile?.full_name || "")
  const [loading, setLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null)

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name)
    }
    if (profile?.avatar_url) {
      setAvatarUrl(profile.avatar_url)
    }
  }, [profile])

  const handleSaveProfile = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl
        })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar suas alterações.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (url: string) => {
    setAvatarUrl(url)
    // Optionally save immediately
    if (user?.id) {
      await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', user.id)
    }
  }

  const successRate = profile?.total_questions_answered
    ? Math.round((profile.correct_answers / profile.total_questions_answered) * 100)
    : 0

  const getPlanDisplay = () => {
    if (hasActivePass && activePass) {
      const daysRemaining = Math.ceil((new Date(activePass.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      const planType = activePass.pass_type === 'family_90_days' ? 'Plano Família (90 dias)' :
        activePass.pass_type === '90_days' ? 'Premium 90 Dias' :
          activePass.pass_type === '30_days' ? 'Premium 30 Dias' :
            'Plano Ativo'
      return `${planType} (${daysRemaining}d restantes)`
    }
    return 'Plano Gratuito'
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    : 'Nov 2024'

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Meu Perfil</h2>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e acompanhe sua jornada
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column - Profile Card */}
        <div className="md:col-span-4 space-y-6">
          <Card className="overflow-hidden border-border/50 shadow-md">
            <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20"></div>
            <div className="px-6 pb-6 -mt-16 flex flex-col items-center">
              <AvatarUpload
                userId={user?.id}
                url={avatarUrl}
                onUpload={handleAvatarUpload}
                fullName={fullName}
              />

              <div className="mt-4 text-center w-full">
                <h3 className="text-xl font-bold text-foreground truncate">
                  {fullName || "Estudante"}
                </h3>
                <p className="text-sm text-muted-foreground mb-3 truncate">
                  {user?.email}
                </p>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {getPlanDisplay()}
                </div>
              </div>

              <div className="w-full mt-6 pt-6 border-t border-border space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Membro desde
                  </span>
                  <span className="font-medium text-foreground">{memberSince}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Stats & Edit Form */}
        <div className="md:col-span-8 space-y-6">
          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <div className="p-3 bg-primary/10 rounded-full mb-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {profile?.total_flashcards_studied || 0}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-1">
                  Flashcards
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <div className="p-3 bg-green-500/10 rounded-full mb-3">
                  <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {profile?.total_questions_answered || 0}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-1">
                  Questões
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <div className="p-3 bg-orange-500/10 rounded-full mb-3">
                  <Trophy className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="text-2xl font-bold text-foreground">{successRate}%</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-1">
                  Taxa de Acerto
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Edit Profile Form */}
          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Como você gostaria de ser chamado?"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="h-11 bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    O email não pode ser alterado.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="min-w-[140px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
