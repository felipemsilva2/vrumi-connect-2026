import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFormValidation } from "@/hooks/useValidation";
import { getErrorMessage } from "@/utils/errorMessages";
import { Car, Mail, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

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

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    resetForm,
    setValues
  } = useFormValidation({
    email: '',
    password: '',
    fullName: ''
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === "SIGNED_IN") {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateForm = () => {
    const emailValid = values.email && !errors.email;
    const passwordValid = values.password && !errors.password;
    const fullNameValid = isLogin || (values.fullName && !errors.fullName);
    
    return emailValid && passwordValid && fullNameValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
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

        toast({
          title: "Bem-vindo de volta!",
          description: "Login realizado com sucesso.",
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
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
        redirectTo: `${window.location.origin}/auth`,
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

  const getInputIcon = (fieldName: string) => {
    if (!touched[fieldName]) return null;
    if (errors[fieldName]) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    if (values[fieldName as keyof typeof values]) {
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    }
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Car className="w-8 h-8 text-primary" />
          <span className="text-2xl font-black">Vrumi</span>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">
          {isLogin ? "Bem-vindo de volta" : "Criar conta grátis"}
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          {isLogin
            ? "Continue sua preparação para a CNH"
            : "Comece sua jornada para a aprovação"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <div className="relative">
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Seu nome completo"
                  value={values.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value, { required: true, minLength: 3 })}
                  onBlur={() => handleBlur('fullName', { required: true, minLength: 3 })}
                  className={errors.fullName && touched.fullName ? "border-destructive" : ""}
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {getInputIcon('fullName')}
                </div>
              </div>
              {errors.fullName && touched.fullName && (
                <p className="text-sm text-destructive">{errors.fullName}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={values.email}
                onChange={(e) => handleChange('email', e.target.value, { required: true, email: true })}
                onBlur={() => handleBlur('email', { required: true, email: true })}
                className={errors.email && touched.email ? "border-destructive" : ""}
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {getInputIcon('email')}
              </div>
            </div>
            {errors.email && touched.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={values.password}
                onChange={(e) => handleChange('password', e.target.value, { required: true, minLength: 6 })}
                onBlur={() => handleBlur('password', { required: true, minLength: 6 })}
                className={errors.password && touched.password ? "border-destructive pr-10" : "pr-10"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                {getInputIcon('password')}
              </div>
            </div>
            {errors.password && touched.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
            {!isLogin && !errors.password && values.password && (
              <p className="text-sm text-success">Senha forte ✓</p>
            )}
          </div>

          {isLogin && (
            <button
              type="button"
              onClick={() => setShowResetPassword(true)}
              className="text-sm text-primary hover:underline"
            >
              Esqueceu sua senha?
            </button>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !validateForm()}
          >
            {loading ? (
              "Processando..."
            ) : (
              isLogin ? "Entrar" : "Criar Conta"
            )}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleGoogleLogin}
          className="w-full"
          type="button"
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLogin ? "Entrar com Google" : "Criar conta com Google"}
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
          <button
            type="button"
            onClick={toggleMode}
            className="text-primary hover:underline ml-1"
          >
            {isLogin ? "Criar conta" : "Entrar"}
          </button>
        </p>
      </Card>

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
                  onChange={(e) => handleChange('email', e.target.value, { required: true, email: true })}
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
    </div>
  );
};

export default Auth;