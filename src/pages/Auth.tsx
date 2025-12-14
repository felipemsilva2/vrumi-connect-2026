import { useState, useEffect, useLayoutEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

const browserLocalPersistence: any = {
  type: 'local',
  storage: localStorage,
};
const browserSessionPersistence: any = {
  type: 'session',
  storage: sessionStorage,
};

import { useToast } from "@/hooks/use-toast";
import { useFormValidation } from "@/hooks/useValidation";
import { getErrorMessage } from "@/utils/errorMessages";
import LoginForm from "@/components/ui/login-form";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [isLogin, setIsLogin] = useState(() => {
    const mode = searchParams.get('mode');
    return mode !== 'register';
  });
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    resetForm,
  } = useFormValidation({
    email: '',
    password: '',
    fullName: '',
    acceptedTerms: ''
  });

  // Helper function to handle redirect after login
  const handlePostLoginRedirect = async (session: any, redirectTo: string | null) => {
    // If there's a specific redirect, use it
    if (redirectTo) {
      navigate(redirectTo);
      return;
    }

    // Check if user is an instructor
    try {
      const { data: instructor } = await supabase
        .from("instructors")
        .select("id, status")
        .eq("user_id", session.user.id)
        .single();

      if (instructor) {
        // User is an instructor - redirect to instructor dashboard
        navigate("/connect/painel-instrutor");
      } else {
        // Regular user - redirect to main dashboard
        navigate("/painel");
      }
    } catch {
      // Not an instructor or error - redirect to main dashboard
      navigate("/painel");
    }
  };

  useEffect(() => {
    const redirectTo = searchParams.get('redirect_to');

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handlePostLoginRedirect(session, redirectTo);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === "SIGNED_IN") {
        handlePostLoginRedirect(session, redirectTo);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, searchParams]);

  useLayoutEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  }, []);

  const validateForm = () => {
    const emailValid = values.email && !errors.email;
    const passwordValid = values.password && !errors.password;
    const fullNameValid = isLogin || (values.fullName && !errors.fullName);
    const termsValid = isLogin || termsAccepted;
    const envOk = isSupabaseConfigured && navigator.onLine;
    return envOk && emailValid && passwordValid && fullNameValid && termsValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSupabaseConfigured) {
      toast({
        title: "Configuração ausente",
        description: "Supabase não está configurado. Verifique variáveis de ambiente.",
        variant: "destructive",
      });
      return;
    }

    if (!navigator.onLine) {
      toast({
        title: "Sem conexão",
        description: "Você está offline. Conecte-se para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) {
      if (!isLogin && !termsAccepted) {
        toast({
          title: "Termos de uso",
          description: "Você precisa aceitar os termos de uso para criar uma conta.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Campos inválidos",
        description: "Por favor, corrija os erros antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        try {
          await (supabase.auth as any).setPersistence(
            rememberMe ? browserLocalPersistence : browserSessionPersistence
          );
        } catch (err) {
          console.warn("Failed to set persistence:", err);
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });

        if (error) {
          const errorInfo = getErrorMessage(error);

          toast({
            title: errorInfo.title,
            description: errorInfo.message,
            variant: "destructive",
            duration: 5000,
          });
          return;
        }

        if (!searchParams.get('redirect_to')) {
          toast({
            title: "Bem-vindo de volta!",
            description: "Login realizado com sucesso.",
          });
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            emailRedirectTo: `${window.location.origin}/entrar`,
            data: {
              full_name: values.fullName,
            },
          },
        });

        if (error) {
          const errorInfo = getErrorMessage(error);

          toast({
            title: errorInfo.title,
            description: errorInfo.message,
            variant: "destructive",
            duration: 5000,
          });
          return;
        }

        toast({
          title: "Conta criada!",
          description: "Bem-vindo à plataforma Vrumi. Verifique seu email para confirmar sua conta.",
        });
        resetForm();
      }
    } catch (error) {
      const errorInfo = getErrorMessage(error);

      toast({
        title: errorInfo.title,
        description: errorInfo.message,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      if (!isSupabaseConfigured) {
        toast({
          title: "Configuração ausente",
          description: "Supabase não está configurado. Verifique variáveis de ambiente.",
          variant: "destructive",
        });
        return;
      }
      if (!navigator.onLine) {
        toast({
          title: "Sem conexão",
          description: "Você está offline. Conecte-se para continuar.",
          variant: "destructive",
        });
        return;
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/entrar`,
        }
      });

      if (error) throw error;
    } catch (error) {
      const errorInfo = getErrorMessage(error);

      toast({
        title: errorInfo.title,
        description: errorInfo.message,
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleResetPassword = async () => {
    if (!values.email) {
      toast({
        title: "Email necessário",
        description: "Por favor, insira seu email para redefinir a senha.",
        variant: "destructive",
      });
      return;
    }

    if (errors.email) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/entrar`,
      });

      if (error) throw error;

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      setShowResetPassword(false);
    } catch (error) {
      const errorInfo = getErrorMessage(error);

      toast({
        title: errorInfo.title,
        description: errorInfo.message,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  const onFieldChange = (field: string, value: any) => {
    const rules = {
      email: { required: true, email: true },
      password: { required: true, minLength: 6 },
      fullName: { required: true, minLength: 3 }
    };
    handleChange(field, value, rules[field as keyof typeof rules]);
  };

  const onFieldBlur = (field: string) => {
    const rules = {
      email: { required: true, email: true },
      password: { required: true, minLength: 6 },
      fullName: { required: true, minLength: 3 }
    };
    handleBlur(field, rules[field as keyof typeof rules]);
  };

  return (
    <>
      <LoginForm
        isLogin={isLogin}
        loading={loading}
        values={values}
        errors={errors}
        touched={touched}
        handleChange={onFieldChange}
        handleBlur={onFieldBlur}
        handleSubmit={handleSubmit}
        handleGoogleLogin={handleGoogleLogin}
        toggleMode={toggleMode}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        onForgotPassword={() => setShowResetPassword(true)}
        termsAccepted={termsAccepted}
        setTermsAccepted={setTermsAccepted}
        rememberMe={rememberMe}
        setRememberMe={setRememberMe}
      />

      {showResetPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Redefinir Senha</h2>
            <p className="text-muted-foreground mb-4">
              Insira seu email para receber o link de redefinição de senha.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  value={values.email}
                  onChange={(e) => onFieldChange('email', e.target.value)}
                  placeholder="seu@email.com"
                  className={errors.email && touched.email ? "border-destructive" : ""}
                />
                {errors.email && touched.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowResetPassword(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loading || !values.email || !!errors.email}
                  className="flex-1"
                >
                  {loading ? "Enviando..." : "Enviar Email"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default Auth;