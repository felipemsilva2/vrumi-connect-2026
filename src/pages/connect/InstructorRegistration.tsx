import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Car, Upload, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";

const BRAZILIAN_STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

const CNH_CATEGORIES = [
  { value: "A", label: "Categoria A (Motos)" },
  { value: "B", label: "Categoria B (Carros)" },
  { value: "AB", label: "Categoria AB (Motos e Carros)" },
  { value: "C", label: "Categoria C (Caminhões)" },
  { value: "D", label: "Categoria D (Ônibus)" },
  { value: "E", label: "Categoria E (Carretas)" },
];

const formSchema = z.object({
  full_name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  phone: z.string().min(10, "Telefone inválido").max(15),
  cpf: z.string().length(11, "CPF deve ter 11 dígitos"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().length(2, "Selecione um estado"),
  categories: z.array(z.string()).min(1, "Selecione pelo menos uma categoria"),
  price_per_lesson: z.string().min(1, "Informe o valor da aula"),
  bio: z.string().max(500, "Biografia deve ter no máximo 500 caracteres").optional(),
  terms: z.boolean().refine((val) => val === true, {
    message: "Você deve aceitar os termos de uso",
  }),
});

type FormData = z.infer<typeof formSchema>;

export default function InstructorRegistration() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      phone: "",
      cpf: "",
      city: "",
      state: "",
      categories: [],
      price_per_lesson: "",
      bio: "",
      terms: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/connect/instrutor/dashboard`,
          data: {
            full_name: data.full_name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário");

      // 2. Create instructor profile
      const { error: instructorError } = await supabase.from("instructors").insert({
        user_id: authData.user.id,
        full_name: data.full_name,
        phone: data.phone,
        cpf: data.cpf,
        city: data.city,
        state: data.state,
        categories: data.categories as ("A" | "B" | "AB" | "C" | "D" | "E")[],
        price_per_lesson: parseFloat(data.price_per_lesson.replace(",", ".")),
        bio: data.bio || null,
      });

      if (instructorError) throw instructorError;

      setSuccess(true);
      toast({
        title: "Cadastro realizado!",
        description: "Seu perfil será analisado e você receberá um e-mail de confirmação.",
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro ao realizar o cadastro.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const current = form.getValues("categories");
    if (checked) {
      form.setValue("categories", [...current, category]);
    } else {
      form.setValue("categories", current.filter((c) => c !== category));
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-[#2F7B3A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-[#2F7B3A]" />
            </div>
            <h2 className="text-2xl font-bold text-[#0A2F44] mb-2">
              Cadastro enviado!
            </h2>
            <p className="text-gray-600 mb-6">
              Seu perfil está em análise. Você receberá um e-mail quando for aprovado 
              e poderá começar a receber agendamentos.
            </p>
            <Link to="/connect">
              <Button className="bg-[#0A2F44] hover:bg-[#0A2F44]/90">
                Voltar para o início
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Seja um Instrutor | Vrumi Connect"
        description="Cadastre-se como instrutor de direção no Vrumi Connect e alcance mais alunos em todo o Brasil."
      />

      <div className="min-h-screen bg-[#F8F9FA]">
        {/* Header */}
        <header className="bg-[#0A2F44] text-white">
          <div className="container mx-auto px-4 py-4">
            <Link to="/connect" className="flex items-center gap-2">
              <Car className="h-8 w-8" />
              <span className="text-xl font-semibold">Vrumi Connect</span>
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-[#0A2F44]">
                Cadastro de Instrutor
              </CardTitle>
              <CardDescription>
                Preencha seus dados para se cadastrar como instrutor na plataforma.
                Seu perfil passará por uma análise antes de ser publicado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Personal Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-[#0A2F44]">Dados Pessoais</h3>
                    
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="seu@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="(00) 00000-0000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cpf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CPF</FormLabel>
                            <FormControl>
                              <Input placeholder="Apenas números" maxLength={11} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-[#0A2F44]">Localização</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {BRAZILIAN_STATES.map((state) => (
                                  <SelectItem key={state.value} value={state.value}>
                                    {state.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                              <Input placeholder="Sua cidade" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Professional Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-[#0A2F44]">Informações Profissionais</h3>
                    
                    <FormField
                      control={form.control}
                      name="categories"
                      render={() => (
                        <FormItem>
                          <FormLabel>Categorias de CNH que atende</FormLabel>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {CNH_CATEGORIES.map((cat) => (
                              <div key={cat.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={cat.value}
                                  checked={form.watch("categories").includes(cat.value)}
                                  onCheckedChange={(checked) =>
                                    handleCategoryChange(cat.value, checked as boolean)
                                  }
                                />
                                <Label htmlFor={cat.value} className="text-sm">
                                  {cat.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price_per_lesson"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor por aula (R$)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 80,00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sobre você (opcional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva sua experiência, metodologia de ensino, etc."
                              className="resize-none"
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Terms */}
                  <FormField
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Li e aceito os{" "}
                            <Link to="/termos-de-uso" className="text-[#0A2F44] underline">
                              Termos de Uso
                            </Link>{" "}
                            e a{" "}
                            <Link to="/politica-de-privacidade" className="text-[#0A2F44] underline">
                              Política de Privacidade
                            </Link>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-12 bg-[#0A2F44] hover:bg-[#0A2F44]/90"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Cadastrar como instrutor"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
