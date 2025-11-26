import { cn } from "@/lib/utils";
import { Mail, Lock, Eye, EyeOff, Check, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoginFormProps {
    isLogin: boolean;
    loading: boolean;
    values: any;
    errors: any;
    touched: any;
    handleChange: (field: string, value: any) => void;
    handleBlur: (field: string) => void;
    handleSubmit: (e: React.FormEvent) => void;
    handleGoogleLogin: () => void;
    toggleMode: () => void;
    showPassword: boolean;
    setShowPassword: (show: boolean) => void;
    onForgotPassword: () => void;
    termsAccepted?: boolean;
    setTermsAccepted?: (accepted: boolean) => void;
}

export default function LoginForm({
    isLogin,
    loading,
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    handleGoogleLogin,
    toggleMode,
    showPassword,
    setShowPassword,
    onForgotPassword,
    termsAccepted,
    setTermsAccepted
}: LoginFormProps) {
    return (
        <div className="flex min-h-screen w-full bg-white dark:bg-gray-950">
            <div className="hidden w-1/2 lg:block relative">
                <img
                    className="absolute inset-0 h-full w-full object-cover"
                    src="/login-illustration.png"
                    alt="Driving"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-white text-center p-8">
                        <h1 className="text-4xl font-bold mb-4">Vrumi</h1>
                        <p className="text-xl max-w-md mx-auto">Sua jornada para a aprovação na CNH começa aqui.</p>
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8">
                <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col items-center justify-center">
                    <div className="text-center mb-8">
                        <h2 className="text-4xl text-gray-900 dark:text-white font-medium mb-2">
                            {isLogin ? "Bem-vindo de volta" : "Criar conta"}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {isLogin
                                ? "Por favor, entre com seus dados para continuar"
                                : "Preencha os dados abaixo para começar"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 flex items-center justify-center h-16 rounded-full transition-colors duration-200"
                    >
                        <img
                            src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/googleLogo.svg"
                            alt="Google"
                            className="w-12 h-12"
                        />
                    </button>

                    <div className="flex items-center gap-4 w-full my-6">
                        <div className="w-full h-px bg-gray-200 dark:bg-gray-800"></div>
                        <p className="w-full text-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">
                            ou {isLogin ? "entrar" : "cadastrar"} com email
                        </p>
                        <div className="w-full h-px bg-gray-200 dark:bg-gray-800"></div>
                    </div>

                    {!isLogin && (
                        <div className="w-full mb-4">
                            <div className={cn(
                                "flex items-center w-full bg-transparent border h-12 rounded-full overflow-hidden px-4 gap-2 transition-colors",
                                errors.fullName && touched.fullName
                                    ? "border-red-500 focus-within:border-red-500"
                                    : "border-gray-300 dark:border-gray-700 focus-within:border-primary"
                            )}>
                                <User className="w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Nome Completo"
                                    className="bg-transparent text-gray-900 dark:text-white placeholder-gray-500 outline-none text-sm w-full h-full"
                                    value={values.fullName || ''}
                                    onChange={(e) => handleChange('fullName', e.target.value)}
                                    onBlur={() => handleBlur('fullName')}
                                />
                            </div>
                            {errors.fullName && touched.fullName && (
                                <p className="text-xs text-red-500 mt-1 ml-4">{errors.fullName}</p>
                            )}
                        </div>
                    )}

                    <div className="w-full mb-4">
                        <div className={cn(
                            "flex items-center w-full bg-transparent border h-12 rounded-full overflow-hidden px-4 gap-2 transition-colors",
                            errors.email && touched.email
                                ? "border-red-500 focus-within:border-red-500"
                                : "border-gray-300 dark:border-gray-700 focus-within:border-primary"
                        )}>
                            <Mail className="w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                placeholder="Email"
                                className="bg-transparent text-gray-900 dark:text-white placeholder-gray-500 outline-none text-sm w-full h-full"
                                value={values.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                onBlur={() => handleBlur('email')}
                                required
                            />
                        </div>
                        {errors.email && touched.email && (
                            <p className="text-xs text-red-500 mt-1 ml-4">{errors.email}</p>
                        )}
                    </div>

                    <div className="w-full mb-2">
                        <div className={cn(
                            "flex items-center w-full bg-transparent border h-12 rounded-full overflow-hidden px-4 gap-2 transition-colors",
                            errors.password && touched.password
                                ? "border-red-500 focus-within:border-red-500"
                                : "border-gray-300 dark:border-gray-700 focus-within:border-primary"
                        )}>
                            <Lock className="w-5 h-5 text-gray-400" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Senha"
                                className="bg-transparent text-gray-900 dark:text-white placeholder-gray-500 outline-none text-sm w-full h-full"
                                value={values.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                onBlur={() => handleBlur('password')}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.password && touched.password && (
                            <p className="text-xs text-red-500 mt-1 ml-4">{errors.password}</p>
                        )}
                    </div>

                    {!isLogin && (
                        <div className="w-full flex items-start gap-2 mt-4">
                            <input
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                type="checkbox"
                                id="terms"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted?.(e.target.checked)}
                            />
                            <label className="text-sm text-gray-500 dark:text-gray-400" htmlFor="terms">
                                Eu concordo com os <a href="/termos-de-uso" target="_blank" className="text-primary hover:underline">Termos de Uso</a> e <a href="/politica-de-privacidade" target="_blank" className="text-primary hover:underline">Política de Privacidade</a>
                            </label>
                        </div>
                    )}

                    <div className="w-full flex items-center justify-between mt-4 text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                            <input
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                type="checkbox"
                                id="remember"
                            />
                            <label className="text-sm cursor-pointer" htmlFor="remember">Lembrar de mim</label>
                        </div>
                        {isLogin && (
                            <button
                                type="button"
                                onClick={onForgotPassword}
                                className="text-sm underline hover:text-primary transition-colors"
                            >
                                Esqueceu a senha?
                            </button>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="mt-8 w-full h-12 rounded-full text-white bg-primary hover:bg-primary/90 hover:opacity-90 transition-all text-base font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processando...</>
                        ) : (
                            isLogin ? "Entrar" : "Criar Conta"
                        )}
                    </Button>

                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-6">
                        {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
                        <button
                            type="button"
                            onClick={toggleMode}
                            className="text-primary hover:underline ml-1 font-medium"
                        >
                            {isLogin ? "Cadastre-se" : "Entre agora"}
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
}
