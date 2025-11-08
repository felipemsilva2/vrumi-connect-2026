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
}

export const CreatePassDialog = ({ open, onOpenChange, onSuccess }: CreatePassDialogProps) => {
  const [userEmail, setUserEmail] = useState("");
  const [passType, setPassType] = useState<"30_days" | "90_days">("30_days");
  const [expiresAt, setExpiresAt] = useState<Date>();
  const [price, setPrice] = useState("0");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!userEmail || !expiresAt) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsLoading(true);
    try {
      // Buscar o user_id pelo email
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userEmail)
        .single();

      if (userError) {
        // Tentar buscar pelo auth.users se não encontrar no profiles
        const { data: authData } = await supabase.auth.admin.listUsers();
        const user = authData?.users?.find((u: any) => u.email === userEmail);
        
        if (!user) {
          toast.error("Usuário não encontrado");
          return;
        }
      }

      const { error } = await supabase.functions.invoke("admin-create-pass", {
        body: {
          user_email: userEmail,
          pass_type: passType,
          expires_at: expiresAt.toISOString(),
          price: parseFloat(price),
        },
      });

      if (error) throw error;

      toast.success("Assinatura criada com sucesso");
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setUserEmail("");
      setPassType("30_days");
      setExpiresAt(undefined);
      setPrice("0");
    } catch (error) {
      console.error("Error creating pass:", error);
      toast.error("Erro ao criar assinatura");
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
            <Select value={passType} onValueChange={(value: "30_days" | "90_days") => setPassType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30_days">30 Dias</SelectItem>
                <SelectItem value="90_days">90 Dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
