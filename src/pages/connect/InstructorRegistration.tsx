import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Car, Loader2, CheckCircle, ArrowRight, ArrowLeft,
  User, MapPin, Briefcase, Camera, Check, Upload, FileText, X
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  { value: "A", label: "Categoria A", description: "Motos" },
  { value: "B", label: "Categoria B", description: "Carros" },
  { value: "AB", label: "Categoria AB", description: "Motos e Carros" },
  { value: "C", label: "Categoria C", description: "Caminhões" },
  { value: "D", label: "Categoria D", description: "Ônibus" },
  { value: "E", label: "Categoria E", description: "Carretas" },
];

// Mask functions
const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

const unmaskValue = (value: string) => value.replace(/\D/g, '');

// Step 1: Account - only for new users
const step1Schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

// Step 2: Personal Info - validation uses unmasked values
const step2Schema = z.object({
  full_name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100),
  phone: z.string().min(14, "Telefone inválido").max(15), // (##) #####-#### = 15 chars
  cpf: z.string().min(14, "CPF inválido").max(14), // ###.###.###-## = 14 chars
});

// Step 3: Location
const step3Schema = z.object({
  state: z.string().length(2, "Selecione um estado"),
  city: z.string().min(2, "Cidade é obrigatória"),
});

// Step 4: Professional Info
const step4Schema = z.object({
  categories: z.array(z.string()).min(1, "Selecione pelo menos uma categoria"),
  price_per_lesson: z.string().min(1, "Informe o valor da aula"),
  bio: z.string().max(500, "Biografia deve ter no máximo 500 caracteres").optional(),
  terms: z.boolean().refine((val) => val === true, {
    message: "Você deve aceitar os termos de uso",
  }),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;

const STEPS = [
  { id: 1, title: "Conta", icon: User, description: "Crie sua conta" },
  { id: 2, title: "Dados", icon: User, description: "Informações pessoais" },
  { id: 3, title: "Local", icon: MapPin, description: "Onde você atua" },
  { id: 4, title: "Serviço", icon: Briefcase, description: "Suas aulas" },
];

export default function InstructorRegistration() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existingUser, setExistingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    cpf: "",
    state: "",
    city: "",
    categories: [] as string[],
    price_per_lesson: "",
    bio: "",
    terms: false,
  });
  const [credentialFile, setCredentialFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    checkExistingUser();
  }, []);

  const checkExistingUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      // Check if already an instructor
      const { data: instructor } = await supabase
        .from("instructors")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (instructor) {
        toast({
          title: "Você já é um instrutor!",
          description: "Redirecionando para seu painel...",
        });
        navigate("/connect/painel-instrutor");
        return;
      }

      // User exists but is not instructor - skip to step 2
      setExistingUser(session.user);
      setFormData(prev => ({
        ...prev,
        email: session.user.email || "",
        full_name: session.user.user_metadata?.full_name || "",
      }));
      setCurrentStep(2);
    }
  };

  // Step 1 Form
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { email: formData.email, password: formData.password },
  });

  // Step 2 Form
  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      full_name: formData.full_name,
      phone: formData.phone,
      cpf: formData.cpf
    },
  });

  // Step 3 Form
  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: { state: formData.state, city: formData.city },
  });

  // Step 4 Form
  const step4Form = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      categories: formData.categories,
      price_per_lesson: formData.price_per_lesson,
      bio: formData.bio,
      terms: formData.terms,
    },
  });

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/connect/cadastro-instrutor`,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao conectar com Google",
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  const handleStep1Submit = async (data: Step1Data) => {
    setLoading(true);
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/connect/painel-instrutor`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário");

      setExistingUser(authData.user);
      setFormData(prev => ({ ...prev, ...data }));
      setCurrentStep(2);
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro ao criar sua conta.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = (data: Step2Data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(3);
  };

  const handleStep3Submit = (data: Step3Data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(4);
  };

  const handleStep4Submit = async (data: Step4Data) => {
    if (!existingUser) {
      toast({
        title: "Erro",
        description: "Sessão expirada. Por favor, recomece o cadastro.",
        variant: "destructive",
      });
      setCurrentStep(1);
      return;
    }

    setLoading(true);
    try {
      const finalData = { ...formData, ...data };
      let credentialDocUrl = null;

      // Upload credential document if exists (to Supabase storage or just keep the file reference)
      if (credentialFile) {
        setUploadingFile(true);
        const fileExt = credentialFile.name.split('.').pop();
        const fileName = `${existingUser.id}/credential_${Date.now()}.${fileExt}`;

        try {
          const { error: uploadError } = await supabase.storage
            .from('instructor-documents')
            .upload(fileName, credentialFile);

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('instructor-documents')
              .getPublicUrl(fileName);
            credentialDocUrl = urlData.publicUrl;
          } else {
            console.log('Storage bucket may not exist yet, continuing without document upload');
          }
        } catch (e) {
          console.log('Storage not configured, continuing without document upload');
        }
        setUploadingFile(false);
      }

      // Update user metadata with full_name and credential doc URL (as backup)
      await supabase.auth.updateUser({
        data: {
          full_name: finalData.full_name,
          credential_document_url: credentialDocUrl
        }
      });

      // Create instructor profile - unmask phone and CPF before saving
      // Try with credential_document_url first, fallback without if column doesn't exist
      const baseInstructorData = {
        user_id: existingUser.id,
        full_name: finalData.full_name,
        phone: unmaskValue(finalData.phone),
        cpf: unmaskValue(finalData.cpf),
        city: finalData.city,
        state: finalData.state,
        categories: finalData.categories as ("A" | "B" | "AB" | "C" | "D" | "E")[],
        price_per_lesson: parseFloat(finalData.price_per_lesson.replace(",", ".")),
        bio: finalData.bio || null,
      };

      // Try to insert with credential_document_url column
      let instructorError;
      if (credentialDocUrl) {
        const result = await supabase.from("instructors").insert({
          ...baseInstructorData,
          credential_document_url: credentialDocUrl,
        });

        // If column doesn't exist, try without it
        if (result.error?.message?.includes('credential_document_url')) {
          const fallbackResult = await supabase.from("instructors").insert(baseInstructorData);
          instructorError = fallbackResult.error;
          if (!instructorError) {
            toast({
              title: "Documento recebido!",
              description: "Seu documento de credenciamento foi salvo e será analisado.",
            });
          }
        } else {
          instructorError = result.error;
        }
      } else {
        const result = await supabase.from("instructors").insert(baseInstructorData);
        instructorError = result.error;
      }

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
    const current = step4Form.getValues("categories");
    if (checked) {
      step4Form.setValue("categories", [...current, category]);
    } else {
      step4Form.setValue("categories", current.filter((c) => c !== category));
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      // Don't go back to step 1 if user came from Google auth
      if (currentStep === 2 && existingUser && !formData.password) {
        return;
      }
      setCurrentStep(currentStep - 1);
    }
  };

  // Success Screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A2F44] to-[#1a4a6e] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md w-full shadow-2xl">
            <CardContent className="pt-8 pb-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <CheckCircle className="h-10 w-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-[#0A2F44] mb-3">
                🎉 Cadastro enviado!
              </h2>
              <p className="text-gray-600 mb-8">
                Seu perfil está em análise. Você receberá um e-mail quando for aprovado
                e poderá começar a receber agendamentos.
              </p>
              <div className="flex flex-col gap-3">
                <Link to="/connect/painel-instrutor">
                  <Button className="w-full bg-[#0A2F44] hover:bg-[#0A2F44]/90">
                    Ir para meu painel
                  </Button>
                </Link>
                <Link to="/connect">
                  <Button variant="outline" className="w-full">
                    Voltar para o início
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Seja um Instrutor | Vrumi Connect"
        description="Cadastre-se como instrutor de direção no Vrumi Connect e alcance mais alunos em todo o Brasil."
      />

      <div className="min-h-screen bg-gradient-to-br from-[#0A2F44] to-[#1a4a6e]">
        {/* Header */}
        <header className="bg-transparent">
          <div className="container mx-auto px-4 py-4">
            <Link to="/connect" className="inline-flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
              <Car className="h-8 w-8" />
              <span className="text-xl font-semibold">Vrumi Connect</span>
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6 max-w-xl">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/20" />
              <div
                className="absolute top-5 left-0 h-0.5 bg-green-400 transition-all duration-500"
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              />

              {STEPS.map((step, index) => {
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                const isDisabled = currentStep < step.id;

                // Skip step 1 if user came from Google
                if (step.id === 1 && existingUser && !formData.password) {
                  return null;
                }

                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isCurrent ? 1.1 : 1,
                        backgroundColor: isCompleted ? "#22c55e" : isCurrent ? "#fff" : "rgba(255,255,255,0.2)",
                      }}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        isCompleted && "text-white",
                        isCurrent && "text-[#0A2F44] shadow-lg",
                        isDisabled && "text-white/50"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </motion.div>
                    <span className={cn(
                      "mt-2 text-xs font-medium hidden sm:block",
                      isCurrent ? "text-white" : "text-white/60"
                    )}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-2xl">
                {/* Step 1: Account Creation */}
                {currentStep === 1 && (
                  <>
                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-2xl text-[#0A2F44]">
                        Crie sua conta
                      </CardTitle>
                      <CardDescription className="text-base">
                        Comece sua jornada como instrutor
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Google Sign Up */}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 text-base font-medium border-2 hover:bg-gray-50"
                        onClick={handleGoogleSignUp}
                        disabled={googleLoading}
                      >
                        {googleLoading ? (
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        ) : (
                          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                        )}
                        Continuar com Google
                      </Button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-muted-foreground">
                            ou com email
                          </span>
                        </div>
                      </div>

                      {/* Email Form */}
                      <Form {...step1Form}>
                        <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4">
                          <FormField
                            control={step1Form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>E-mail</FormLabel>
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder="seu@email.com"
                                    className="h-12"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={step1Form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Senha</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="Mínimo 6 caracteres"
                                    className="h-12"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button
                            type="submit"
                            className="w-full h-12 bg-[#0A2F44] hover:bg-[#0A2F44]/90 text-base"
                            disabled={loading}
                          >
                            {loading ? (
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            ) : (
                              <>
                                Continuar
                                <ArrowRight className="h-5 w-5 ml-2" />
                              </>
                            )}
                          </Button>
                        </form>
                      </Form>

                      <p className="text-center text-sm text-muted-foreground">
                        Já tem uma conta?{" "}
                        <Link to="/entrar?redirect_to=/connect/cadastro-instrutor" className="text-[#0A2F44] font-medium hover:underline">
                          Faça login
                        </Link>
                      </p>
                    </CardContent>
                  </>
                )}

                {/* Step 2: Personal Info */}
                {currentStep === 2 && (
                  <>
                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-2xl text-[#0A2F44]">
                        Seus dados
                      </CardTitle>
                      <CardDescription className="text-base">
                        Informações para seu perfil de instrutor
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...step2Form}>
                        <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-4">
                          <FormField
                            control={step2Form.control}
                            name="full_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome completo</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Seu nome completo"
                                    className="h-12"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={step2Form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefone (WhatsApp)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="(00) 00000-0000"
                                    className="h-12"
                                    maxLength={15}
                                    value={field.value}
                                    onChange={(e) => field.onChange(maskPhone(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={step2Form.control}
                            name="cpf"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CPF</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="000.000.000-00"
                                    maxLength={14}
                                    className="h-12"
                                    value={field.value}
                                    onChange={(e) => field.onChange(maskCPF(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex gap-3 pt-4">
                            {formData.password && (
                              <Button
                                type="button"
                                variant="outline"
                                className="flex-1 h-12"
                                onClick={goBack}
                              >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Voltar
                              </Button>
                            )}
                            <Button
                              type="submit"
                              className={cn(
                                "h-12 bg-[#0A2F44] hover:bg-[#0A2F44]/90",
                                formData.password ? "flex-1" : "w-full"
                              )}
                            >
                              Continuar
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </>
                )}

                {/* Step 3: Location */}
                {currentStep === 3 && (
                  <>
                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-2xl text-[#0A2F44]">
                        Onde você atua?
                      </CardTitle>
                      <CardDescription className="text-base">
                        Localização para alunos encontrarem você
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...step3Form}>
                        <form onSubmit={step3Form.handleSubmit(handleStep3Submit)} className="space-y-4">
                          <FormField
                            control={step3Form.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-12">
                                      <SelectValue placeholder="Selecione seu estado" />
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
                            control={step3Form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cidade</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Sua cidade"
                                    className="h-12"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex gap-3 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1 h-12"
                              onClick={goBack}
                            >
                              <ArrowLeft className="h-4 w-4 mr-2" />
                              Voltar
                            </Button>
                            <Button
                              type="submit"
                              className="flex-1 h-12 bg-[#0A2F44] hover:bg-[#0A2F44]/90"
                            >
                              Continuar
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </>
                )}

                {/* Step 4: Professional Info */}
                {currentStep === 4 && (
                  <>
                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-2xl text-[#0A2F44]">
                        Suas aulas
                      </CardTitle>
                      <CardDescription className="text-base">
                        Configure seus serviços
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...step4Form}>
                        <form onSubmit={step4Form.handleSubmit(handleStep4Submit)} className="space-y-5">
                          <FormField
                            control={step4Form.control}
                            name="categories"
                            render={() => (
                              <FormItem>
                                <FormLabel>Categorias de CNH que você ensina</FormLabel>
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                  {CNH_CATEGORIES.map((cat) => {
                                    const isSelected = step4Form.watch("categories").includes(cat.value);
                                    return (
                                      <div
                                        key={cat.value}
                                        onClick={() => handleCategoryChange(cat.value, !isSelected)}
                                        className={cn(
                                          "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                                          isSelected
                                            ? "border-[#0A2F44] bg-[#0A2F44]/5"
                                            : "border-gray-200 hover:border-gray-300"
                                        )}
                                      >
                                        <div className={cn(
                                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                          isSelected
                                            ? "border-[#0A2F44] bg-[#0A2F44]"
                                            : "border-gray-300"
                                        )}>
                                          {isSelected && <Check className="h-3 w-3 text-white" />}
                                        </div>
                                        <div>
                                          <p className="font-medium text-sm">{cat.label}</p>
                                          <p className="text-xs text-muted-foreground">{cat.description}</p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={step4Form.control}
                            name="price_per_lesson"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Valor por aula (R$)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Ex: 80,00"
                                    className="h-12"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={step4Form.control}
                            name="bio"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sobre você (opcional)</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Descreva sua experiência, metodologia de ensino..."
                                    className="resize-none min-h-[100px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Credential Document Upload */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Credenciamento DETRAN <span className="text-red-500">*</span>
                            </Label>
                            <p className="text-xs text-muted-foreground mb-2">
                              Envie o documento de credenciamento aprovado pelo DETRAN
                            </p>

                            {!credentialFile ? (
                              <label
                                htmlFor="credential-upload"
                                className={cn(
                                  "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all",
                                  "border-gray-300 hover:border-[#0A2F44] hover:bg-gray-50"
                                )}
                              >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <Upload className="w-8 h-8 mb-2 text-gray-400" />
                                  <p className="text-sm text-gray-500">
                                    <span className="font-semibold text-[#0A2F44]">Clique para enviar</span>
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    PDF, JPG ou PNG (máx. 5MB)
                                  </p>
                                </div>
                                <input
                                  id="credential-upload"
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      if (file.size > 5 * 1024 * 1024) {
                                        toast({
                                          title: "Arquivo muito grande",
                                          description: "O arquivo deve ter no máximo 5MB",
                                          variant: "destructive",
                                        });
                                        return;
                                      }
                                      setCredentialFile(file);
                                    }
                                  }}
                                />
                              </label>
                            ) : (
                              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {credentialFile.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {(credentialFile.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setCredentialFile(null)}
                                  className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            )}
                          </div>

                          <FormField
                            control={step4Form.control}
                            name="terms"
                            render={({ field }) => (
                              <FormItem className="flex items-start space-x-3 space-y-0 p-4 bg-gray-50 rounded-lg">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="text-sm font-normal">
                                    Li e aceito os{" "}
                                    <Link to="/termos-de-uso" className="text-[#0A2F44] underline" target="_blank">
                                      Termos de Uso
                                    </Link>{" "}
                                    e a{" "}
                                    <Link to="/politica-de-privacidade" className="text-[#0A2F44] underline" target="_blank">
                                      Política de Privacidade
                                    </Link>
                                  </FormLabel>
                                  <FormMessage />
                                </div>
                              </FormItem>
                            )}
                          />

                          <div className="flex gap-3 pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1 h-12"
                              onClick={goBack}
                            >
                              <ArrowLeft className="h-4 w-4 mr-2" />
                              Voltar
                            </Button>
                            <Button
                              type="submit"
                              className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                              disabled={loading}
                            >
                              {loading ? (
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-5 w-5 mr-2" />
                                  Finalizar cadastro
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </>
                )}
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Trust indicators */}
          <div className="mt-8 text-center text-white/60 text-sm">
            <p>🔒 Seus dados estão protegidos</p>
            <p className="mt-1">Milhares de instrutores já usam o Vrumi Connect</p>
          </div>
        </div>
      </div>
    </>
  );
}
