import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

const CheckoutCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-lg p-8 text-center">
        <XCircle className="w-16 h-16 mx-auto mb-4 text-amber-500" />
        <h1 className="text-2xl font-bold mb-2">Pagamento cancelado</h1>
        <p className="text-muted-foreground mb-6">
          Você cancelou o processo de pagamento. Nenhuma cobrança foi realizada.
        </p>
        <div className="space-y-3">
          <Button onClick={() => navigate('/')} className="w-full">
            Voltar ao Início
          </Button>
          <Button 
            onClick={() => navigate(-1)} 
            variant="outline" 
            className="w-full"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCancel;
