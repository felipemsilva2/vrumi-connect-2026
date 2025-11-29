import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Check, CreditCard, ShieldCheck, ArrowLeft, Calendar, Lock, Smartphone, QrCode, Copy } from "lucide-react"
import { z } from "zod"
import type { User } from "@supabase/supabase-js"
import { useActivePass } from "@/hooks/useActivePass"

const pixSchema = z.object({
  fullName: z.string().trim().min(3, "Nome completo deve ter ao menos 3 caracteres").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  cpf: z.string().trim().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido (use formato: 000.000.000-00)"),
  phone: z.string().trim().min(10, "Telefone inválido"),
})

type PixForm = z.infer<typeof pixSchema>

const Checkout = () => {
  const [searchParams] = useSearchParams()
  const passType = searchParams.get("pass") as "individual_30_days" | "individual_90_days" | "family_90_days" | null
  const [secondUserEmail, setSecondUserEmail] = useState("")
  const navigate = useNavigate()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "pix" | null>(null)
  const [pixData, setPixData] = useState<{ qrCodeUrl: string, copyPaste: string, pixId: string, expiresAt: string } | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof PixForm, string>>>({})
  const [verifying, setVerifying] = useState(false)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)

  const { activePass, hasActivePass } = useActivePass(user?.id)

  const [formData, setFormData] = useState<PixForm>({
    fullName: "",
    email: "",
    cpf: "",
    phone: "",
  })

  const passDetails = {
    "individual_30_days": {
      name: "Passaporte 30 Dias",
      subtitle: "O Apressado",
      price: 29.90,
      days: 30,
      features: [
        "Simulados oficiais ilimitados",
        "Simulados de prática",
        "Histórico completo",
        "30 dias de acesso total"
      ]
    },
    "individual_90_days": {
      name: "Passaporte 90 Dias",
      subtitle: "O Garantido",
      price: 79.90,
      days: 90,
      features: [
        "Simulados oficiais ilimitados",
        "Simulados de prática",
        "Histórico completo",
        "90 dias de acesso total",
        "Melhor custo-benefício"
      ]
    },
    "family_90_days": {
      name: "Passaporte Família",
      subtitle: "Para 2 Pessoas",
      price: 84.90,
      days: 90,
      features: [
        "2 contas individuais incluídas",
        "90 dias de acesso total por pessoa",
        "Simulados oficiais ilimitados",
        "Flashcards e estatísticas completas",
        "Progresso individual para cada um",
        "Economia de R$ 14,90"
      ]
    }
  }

  const selectedPass = passType && passDetails[passType]

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        setFormData(prev => ({
          ...prev,
          email: session.user.email || "",
          fullName: session.user.user_metadata?.full_name || ""
        }))
      } else {
        const currentPath = window.location.pathname + window.location.search
        navigate(`/entrar?redirect_to=${encodeURIComponent(currentPath)}`)
      }
    }
    checkUser()
  }, [navigate])

  useEffect(() => {
    if (!passType || !selectedPass) {
      navigate("/#preço")
      return
    }

    if (hasActivePass && activePass && passType) {
      const PLAN_LEVELS: Record<string, number> = {
        'individual_30_days': 1,
        'individual_90_days': 2,
        'family_90_days': 3
      }

      const currentLevel = PLAN_LEVELS[activePass.pass_type] || 0
      const selectedLevel = PLAN_LEVELS[passType] || 0

      if (selectedLevel <= currentLevel) {
        toast({
          title: "Assinatura Ativa",
          description: "Opa! Você já possui uma assinatura ativa. Estamos te redirecionando para o dashboard agora.",
          duration: 5000,
        })
        // Small delay to let the user read the toast
        setTimeout(() => {
          navigate("/painel")
        }, 2000)
      }
    }
  }, [passType, selectedPass, navigate, hasActivePass, activePass])

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    }
    return value
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d{4})$/, "$1-$2")
    }
    return value
  }

  const handleInputChange = (field: keyof PixForm, value: string) => {
    let formattedValue = value

    if (field === "cpf") {
      formattedValue = formatCPF(value)
    } else if (field === "phone") {
      formattedValue = formatPhone(value)
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }))

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleCreditCardSubmit = async () => {
    if (!user) {
      const currentPath = window.location.pathname + window.location.search
      navigate(`/entrar?redirect_to=${encodeURIComponent(currentPath)}`)
      return
    }

    if (passType === "family_90_days" && (!secondUserEmail || !secondUserEmail.includes("@"))) {
      toast({
        title: "Email inválido",
        description: "Por favor, informe o email do segundo usuário.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          passType: passType,
          secondUserEmail: passType === 'family_90_days' ? secondUserEmail : null,
        },
      })

      if (error) throw error
      if (!data?.url) throw new Error('URL de checkout não recebida')

      window.location.href = data.url
    } catch (error) {
      console.error('Erro ao criar checkout:', error)
      toast({
        title: "Erro ao processar pagamento",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const handlePixSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      const currentPath = window.location.pathname + window.location.search
      navigate(`/entrar?redirect_to=${encodeURIComponent(currentPath)}`)
      return
    }

    try {
      pixSchema.parse(formData)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof PixForm, string>> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof PixForm] = err.message
          }
        })
        setErrors(newErrors)
      }
      return
    }

    if (passType === "family_90_days" && (!secondUserEmail || !secondUserEmail.includes("@"))) {
      toast({
        title: "Email inválido",
        description: "Por favor, informe o email do segundo usuário.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-abacate-pix', {
        body: {
          passType: passType,
          secondUserEmail: passType === 'family_90_days' ? secondUserEmail : null,
          customer: {
            name: formData.fullName,
            email: formData.email,
            taxId: formData.cpf.replace(/\D/g, ""),
            phone: formData.phone.replace(/\D/g, ""),
          }
        },
      })

      if (error) throw error

      // Set PIX data with all necessary information
      setPixData({
        qrCodeUrl: data.qrCodeUrl,
        copyPaste: data.copyPaste,
        pixId: data.pixId,
        expiresAt: data.expiresAt,
      })

    } catch (error) {
      console.error('Erro ao criar Pix:', error)
      toast({
        title: "Erro ao gerar Pix",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: "Código Pix copiado para a área de transferência.",
    })
  }

  const handleVerifyPayment = async () => {
    if (!pixData) return

    setVerifying(true)
    try {
      const { data, error } = await supabase.functions.invoke('verify-abacate-pix', {
        body: {
          pixId: pixData.pixId,
          passType: passType,
          secondUserEmail: passType === 'family_90_days' ? secondUserEmail : null,
        },
      })

      if (error) throw error

      if (data?.success && data?.status === 'COMPLETED') {
        setPaymentConfirmed(true)
        toast({
          title: "Pagamento confirmado!",
          description: "Seu passaporte foi ativado com sucesso.",
        })
      } else {
        toast({
          title: "Pagamento não confirmado",
          description: "O pagamento ainda não foi processado. Aguarde alguns instantes e tente novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error)
      toast({
        title: "Erro ao verificar pagamento",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setVerifying(false)
    }
  }

  if (!selectedPass) return null

  return (
    <div className="min-h-screen bg-muted py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <Button
          onClick={() => {
            if (pixData) {
              setPixData(null)
            } else if (paymentMethod) {
              setPaymentMethod(null)
            } else {
              navigate("/#preço")
            }
          }}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <h1 className="text-3xl font-bold text-foreground">Finalizar Compra</h1>
                <p className="text-muted-foreground">
                  {pixData ? "Escaneie o QR Code para pagar" : "Escolha como deseja pagar"}
                </p>
              </CardHeader>
              <CardContent>
                {paymentConfirmed ? (
                  <div className="flex flex-col items-center space-y-6 py-12">
                    <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Check className="h-10 w-10 text-green-500" />
                    </div>
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl font-bold text-foreground">Vrumm! 🎉</h2>
                      <p className="text-xl font-semibold text-foreground">Seu acesso está liberado</p>
                      <p className="text-muted-foreground">
                        Agora você pode aproveitar todos os benefícios do seu passaporte.
                      </p>
                    </div>
                    <Button onClick={() => navigate('/painel')} size="lg" className="w-full max-w-md">
                      Ir para o Dashboard
                    </Button>
                  </div>
                ) : pixData ? (
                  <div className="flex flex-col items-center space-y-6 py-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                      <img src={pixData.qrCodeUrl} alt="QR Code Pix" className="w-64 h-64 object-contain" />
                    </div>

                    <div className="w-full max-w-md space-y-2">
                      <Label>Pix Copia e Cola</Label>
                      <div className="flex gap-2">
                        <Input value={pixData.copyPaste} readOnly />
                        <Button onClick={() => copyToClipboard(pixData.copyPaste)} variant="outline">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-center text-sm text-muted-foreground mb-4">
                      <p>Após o pagamento, clique no botão abaixo para verificar.</p>
                    </div>

                    <Button
                      onClick={handleVerifyPayment}
                      className="w-full max-w-md"
                      size="lg"
                      disabled={verifying}
                    >
                      {verifying ? "Verificando..." : "Já efetuei o pagamento"}
                    </Button>
                  </div>
                ) : !paymentMethod ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      onClick={() => setPaymentMethod("credit_card")}
                      className="cursor-pointer border-2 border-transparent hover:border-primary rounded-xl p-6 bg-card shadow-sm transition-all hover:shadow-md flex flex-col items-center text-center gap-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Cartão de Crédito</h3>
                        <p className="text-sm text-muted-foreground">Aprovação imediata</p>
                      </div>
                    </div>

                    <div
                      onClick={() => setPaymentMethod("pix")}
                      className="cursor-pointer border-2 border-transparent hover:border-primary rounded-xl p-6 bg-card shadow-sm transition-all hover:shadow-md flex flex-col items-center text-center gap-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <QrCode className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Pix</h3>
                        <p className="text-sm text-muted-foreground">Aprovação imediata</p>
                      </div>
                    </div>
                  </div>
                ) : paymentMethod === "credit_card" ? (
                  <div className="space-y-6">
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                      <p className="text-sm text-muted-foreground">
                        Você será redirecionado para o ambiente seguro do Stripe para concluir o pagamento com seu cartão de crédito.
                      </p>
                    </div>

                    {passType === "family_90_days" && (
                      <div className="space-y-2">
                        <Label htmlFor="secondUserEmail">Email do Segundo Usuário</Label>
                        <Input
                          id="secondUserEmail"
                          type="email"
                          value={secondUserEmail}
                          onChange={(e) => setSecondUserEmail(e.target.value)}
                          placeholder="email@exemplo.com"
                        />
                        <p className="text-xs text-muted-foreground">
                          Digite o email da pessoa que vai estudar junto com você.
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handleCreditCardSubmit}
                      className="w-full"
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? "Processando..." : "Ir para Pagamento Seguro"}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handlePixSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="fullName">Nome Completo</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange("fullName", e.target.value)}
                          className={errors.fullName ? "border-red-500" : ""}
                          placeholder="Seu nome completo"
                        />
                        {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            className={errors.email ? "border-red-500" : ""}
                            placeholder="seu@email.com"
                          />
                          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                        </div>

                        <div>
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            className={errors.phone ? "border-red-500" : ""}
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                          />
                          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="cpf">CPF</Label>
                        <Input
                          id="cpf"
                          value={formData.cpf}
                          onChange={(e) => handleInputChange("cpf", e.target.value)}
                          className={errors.cpf ? "border-red-500" : ""}
                          placeholder="000.000.000-00"
                          maxLength={14}
                        />
                        {errors.cpf && <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>}
                      </div>

                      {passType === "family_90_days" && (
                        <>
                          <Separator />
                          <div>
                            <Label htmlFor="secondUserEmail">Email do Segundo Usuário</Label>
                            <Input
                              id="secondUserEmail"
                              type="email"
                              value={secondUserEmail}
                              onChange={(e) => setSecondUserEmail(e.target.value)}
                              placeholder="email@exemplo.com"
                              className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Digite o email da pessoa que vai estudar junto com você.
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    <Button type="submit" size="lg" className="w-full" disabled={loading}>
                      {loading ? "Gerando Pix..." : "Gerar QR Code Pix"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="shadow-lg sticky top-6">
              <CardHeader>
                <h3 className="text-xl font-bold">Resumo do Pedido</h3>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-foreground">{selectedPass.name}</h4>
                        <p className="text-sm text-muted-foreground">{selectedPass.subtitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          R$ {selectedPass.price.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3 pt-3 border-t border-primary/10">
                      <Calendar className="h-4 w-4" />
                      <span>{selectedPass.days} dias de acesso total</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-sm text-muted-foreground">O que está incluído:</h4>
                  <ul className="space-y-2">
                    {selectedPass.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">R$ {selectedPass.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Desconto</span>
                    <span className="font-medium text-green-600">R$ 0,00</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-bold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      R$ {selectedPass.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4 text-sm">
                  <p className="text-muted-foreground">
                    <ShieldCheck className="inline-block w-4 h-4 mr-1 mb-0.5" />
                    Pagamento 100% seguro.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
