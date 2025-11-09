import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Check, CreditCard, ShieldCheck, ArrowLeft, Calendar, Lock } from "lucide-react"
import { z } from "zod"
import type { User } from "@supabase/supabase-js"

const checkoutSchema = z.object({
  fullName: z.string().trim().min(3, "Nome completo deve ter ao menos 3 caracteres").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  cpf: z.string().trim().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido (use formato: 000.000.000-00)"),
  cardNumber: z.string().trim().regex(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/, "Número do cartão inválido"),
  cardName: z.string().trim().min(3, "Nome no cartão deve ter ao menos 3 caracteres").max(100),
  cardExpiry: z.string().trim().regex(/^\d{2}\/\d{2}$/, "Validade inválida (use MM/AA)"),
  cardCvv: z.string().trim().regex(/^\d{3,4}$/, "CVV inválido"),
})

type CheckoutForm = z.infer<typeof checkoutSchema>

const Checkout = () => {
  const [searchParams] = useSearchParams()
  const passType = searchParams.get("pass") as "30_days" | "90_days" | "family_90_days" | null
  const [secondUserEmail, setSecondUserEmail] = useState("")
  const navigate = useNavigate()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutForm, string>>>({})

  const [formData, setFormData] = useState<CheckoutForm>({
    fullName: "",
    email: "",
    cpf: "",
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvv: "",
  })

  const passDetails = {
    "30_days": {
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
    "90_days": {
      name: "Passaporte 90 Dias",
      subtitle: "O Garantido",
      price: 49.90,
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
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        setFormData(prev => ({
          ...prev,
          email: user.email || "",
          fullName: user.user_metadata?.full_name || ""
        }))
      }
    }
    checkUser()
  }, [])

  useEffect(() => {
    if (!passType || !selectedPass) {
      navigate("/#preço")
    }
  }, [passType, selectedPass, navigate])

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

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers.replace(/(\d{4})(?=\d)/g, "$1 ").trim()
  }

  const formatExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 2) return numbers
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}`
  }

  const handleInputChange = (field: keyof CheckoutForm, value: string) => {
    let formattedValue = value

    if (field === "cpf") {
      formattedValue = formatCPF(value)
    } else if (field === "cardNumber") {
      formattedValue = formatCardNumber(value)
    } else if (field === "cardExpiry") {
      formattedValue = formatExpiry(value)
    } else if (field === "cardCvv") {
      formattedValue = value.replace(/\D/g, "").slice(0, 4)
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    try {
      checkoutSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof CheckoutForm, string>> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof CheckoutForm] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Erro no formulário",
        description: "Por favor, corrija os campos destacados",
        variant: "destructive",
      })
      return
    }

    if (!user) {
      toast({
        title: "Faça login primeiro",
        description: "Você precisa estar logado para finalizar a compra",
        variant: "destructive",
      })
      navigate("/auth")
      return
    }

    if (!selectedPass || !passType) return

    setLoading(true)

    try {
      // Calculate expiry date
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + selectedPass.days)

      // Check if it's a family plan
      if (passType === "family_90_days") {
        // Validate second user email
        if (!secondUserEmail || !secondUserEmail.includes("@")) {
          toast({
            title: "Email inválido",
            description: "Por favor, informe o email do segundo usuário.",
            variant: "destructive",
          })
          return
        }

        // Call edge function to create family pass
        const { data, error } = await supabase.functions.invoke('admin-create-pass', {
          body: {
            user_email: user.email,
            second_user_email: secondUserEmail,
            pass_type: passType,
            expires_at: expiresAt.toISOString(),
            price: selectedPass.price
          }
        })

        if (error) throw error

        toast({
          title: "Pagamento processado!",
          description: `Passaporte Família ativado! 2 contas foram criadas com sucesso.`,
        })
      } else {
        // Regular pass creation
        const { error } = await supabase
          .from("user_passes")
          .insert({
            user_id: user.id,
            pass_type: passType,
            price: selectedPass.price,
            expires_at: expiresAt.toISOString(),
            payment_status: "completed",
          })

        if (error) throw error

        toast({
          title: "Pagamento processado!",
          description: `Seu ${selectedPass.name} foi ativado com sucesso.`,
        })
      }

      navigate("/dashboard")
    } catch (error) {
      console.error("Error processing payment:", error)
      toast({
        title: "Erro ao processar pagamento",
        description: "Tente novamente ou entre em contato com o suporte",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!selectedPass) {
    return null
  }

  return (
    <div className="min-h-screen bg-muted py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <Button
          onClick={() => navigate("/#preço")}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para preços
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <h1 className="text-3xl font-bold text-foreground">Finalizar Compra</h1>
                <p className="text-muted-foreground">Complete seus dados para ativar o passaporte</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</div>
                      Dados Pessoais
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="fullName">Nome Completo</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange("fullName", e.target.value)}
                          className={errors.fullName ? "border-red-500" : ""}
                          placeholder="João da Silva"
                        />
                        {errors.fullName && (
                          <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                        )}
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
                            placeholder="joao@email.com"
                            disabled={!!user}
                          />
                          {errors.email && (
                            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                          )}
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
                          {errors.cpf && (
                            <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {passType === "family_90_days" && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</div>
                          Segundo Usuário
                        </h3>
                        <div>
                          <Label htmlFor="secondUserEmail">Email do Segundo Usuário</Label>
                          <Input
                            id="secondUserEmail"
                            type="email"
                            value={secondUserEmail}
                            onChange={(e) => setSecondUserEmail(e.target.value)}
                            placeholder="email@exemplo.com"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Digite o email da pessoa que vai estudar junto com você. Um passaporte será criado para cada um.
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Payment Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                        {passType === "family_90_days" ? "3" : "2"}
                      </div>
                      Pagamento
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="cardNumber">Número do Cartão</Label>
                        <div className="relative">
                          <Input
                            id="cardNumber"
                            value={formData.cardNumber}
                            onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                            className={errors.cardNumber ? "border-red-500" : ""}
                            placeholder="0000 0000 0000 0000"
                            maxLength={19}
                          />
                          <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        </div>
                        {errors.cardNumber && (
                          <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="cardName">Nome no Cartão</Label>
                        <Input
                          id="cardName"
                          value={formData.cardName}
                          onChange={(e) => handleInputChange("cardName", e.target.value)}
                          className={errors.cardName ? "border-red-500" : ""}
                          placeholder="JOÃO DA SILVA"
                        />
                        {errors.cardName && (
                          <p className="text-red-500 text-sm mt-1">{errors.cardName}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cardExpiry">Validade</Label>
                          <Input
                            id="cardExpiry"
                            value={formData.cardExpiry}
                            onChange={(e) => handleInputChange("cardExpiry", e.target.value)}
                            className={errors.cardExpiry ? "border-red-500" : ""}
                            placeholder="MM/AA"
                            maxLength={5}
                          />
                          {errors.cardExpiry && (
                            <p className="text-red-500 text-sm mt-1">{errors.cardExpiry}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="cardCvv">CVV</Label>
                          <Input
                            id="cardCvv"
                            type="password"
                            value={formData.cardCvv}
                            onChange={(e) => handleInputChange("cardCvv", e.target.value)}
                            className={errors.cardCvv ? "border-red-500" : ""}
                            placeholder="123"
                            maxLength={4}
                          />
                          {errors.cardCvv && (
                            <p className="text-red-500 text-sm mt-1">{errors.cardCvv}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      "Processando..."
                    ) : (
                      <>
                        <ShieldCheck className="mr-2 h-5 w-5" />
                        Finalizar Pagamento - R$ {selectedPass.price.toFixed(2)}
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span>Pagamento 100% seguro e criptografado</span>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
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
                    💡 <strong>Pagamento único.</strong> Sem renovação automática. Você sabe exatamente o que está pagando.
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
