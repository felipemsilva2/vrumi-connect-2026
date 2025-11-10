import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        toast({
          title: "Erro",
          description: "ID da sessão não encontrado.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId },
        });

        if (error) throw error;

        if (data?.success) {
          setVerified(true);
          toast({
            title: "Pagamento confirmado!",
            description: "Seu passe foi ativado com sucesso.",
          });
        } else {
          throw new Error(data?.message || 'Pagamento não confirmado');
        }
      } catch (error) {
        console.error('Erro ao verificar pagamento:', error);
        toast({
          title: "Erro ao verificar pagamento",
          description: "Não foi possível confirmar seu pagamento. Entre em contato com o suporte.",
          variant: "destructive",
        });
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-lg p-8 text-center">
        {verifying ? (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
            <h1 className="text-2xl font-bold mb-2">Verificando pagamento...</h1>
            <p className="text-muted-foreground">
              Aguarde enquanto confirmamos seu pagamento.
            </p>
          </>
        ) : verified ? (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h1 className="text-2xl font-bold mb-2">Pagamento confirmado!</h1>
            <p className="text-muted-foreground mb-6">
              Seu passe foi ativado com sucesso. Você já pode começar a estudar!
            </p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Ir para o Dashboard
            </Button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">Erro ao verificar pagamento</h1>
            <p className="text-muted-foreground mb-6">
              Não conseguimos confirmar seu pagamento. Entre em contato com o suporte.
            </p>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              Voltar ao Início
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default CheckoutSuccess;
