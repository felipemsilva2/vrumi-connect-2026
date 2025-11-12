import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface CreatePassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  prefilledEmail?: string;
}

export const CreatePassDialog = ({ open, onOpenChange, onSuccess, prefilledEmail }: CreatePassDialogProps) => {
  const [userEmail, setUserEmail] = useState(prefilledEmail || "");
  const [passType, setPassType] = useState<"30_days" | "90_days" | "family_90_days">("30_days");
  const [expiresAt, setExpiresAt] = useState<Date>();
  const [price, setPrice] = useState("29.90");
  const [isLoading, setIsLoading] = useState(false);
  const [secondUserEmail, setSecondUserEmail] = useState("");

  // Atualizar email quando prefilledEmail mudar
  useState(() => {
    if (prefilledEmail) {
      setUserEmail(prefilledEmail);
    }
  });

  // Atualizar preço automaticamente quando o tipo de pass mudar
  const handlePassTypeChange = (value: "30_days" | "90_days" | "family_90_days") => {
    setPassType(value);
    if (value === "30_days") setPrice("29.90");
    else if (value === "90_days") setPrice("79.90");
    else if (value === "family_90_days") setPrice("84.90");
  };

  const handleCreate = async () => {
    if (!userEmail || !expiresAt) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (passType === "family_90_days" && !secondUserEmail) {
      toast.error("Para o plano família, informe o email do segundo usuário");
      return;
    }

    setIsLoading(true);
    try {
      console.log('Creating pass with data:', { userEmail, passType, expiresAt, price });
      
      const { data, error } = await supabase.functions.invoke("admin-create-pass", {
        body: {
          user_email: userEmail,
          pass_type: passType,
          expires_at: expiresAt.toISOString(),
          price: parseFloat(price),
          second_user_email: passType === "family_90_days" ? secondUserEmail : null,
        },
      });

      if (error) {
        console.error('Error from edge function:', error);
        throw error;
      }

      console.log('Pass created successfully:', data);
      toast.success("Assinatura criada com sucesso");
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setUserEmail("");
      setSecondUserEmail("");
      setPassType("30_days");
      setExpiresAt(undefined);
      setPrice("29.90");
    } catch (error: any) {
      console.error("Error creating pass:", error);
      const errorMessage = error?.message || "Erro ao criar assinatura";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Assinatura Manual</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email do Usuário *</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@exemplo.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="passType">Tipo de Assinatura *</Label>
            <Select value={passType} onValueChange={handlePassTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30_days">Passaporte 30 Dias - R$ 29,90</SelectItem>
                <SelectItem value="90_days">Passaporte 90 Dias - R$ 79,90</SelectItem>
                <SelectItem value="family_90_days">Passaporte Família 90 Dias - R$ 84,90 (2 pessoas)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {passType === "family_90_days" && (
            <div className="space-y-2">
              <Label htmlFor="secondEmail">Email do Segundo Usuário *</Label>
              <Input
                id="secondEmail"
                type="email"
                placeholder="segundo@exemplo.com"
                value={secondUserEmail}
                onChange={(e) => setSecondUserEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Para plano família, informe o email da segunda pessoa
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Data de Expiração *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expiresAt && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expiresAt ? format(expiresAt, "PPP") : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={expiresAt}
                  onSelect={setExpiresAt}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Preço (R$)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use 0 para cortesias
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading ? "Criando..." : "Criar Assinatura"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
