import { useState, useEffect } from "react";
import { Plus, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Availability {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface AvailabilityManagerProps {
  instructorId: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6; // Start at 6:00
  const min = (i % 2) * 30;
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
});

export function AvailabilityManager({ instructorId }: AvailabilityManagerProps) {
  const { toast } = useToast();
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [newDay, setNewDay] = useState<string>("");
  const [newStartTime, setNewStartTime] = useState<string>("");
  const [newEndTime, setNewEndTime] = useState<string>("");

  useEffect(() => {
    fetchAvailability();
  }, [instructorId]);

  const fetchAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from("instructor_availability")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error("Error fetching availability:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a disponibilidade.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAvailability = async () => {
    if (!newDay || !newStartTime || !newEndTime) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para adicionar um horário.",
        variant: "destructive",
      });
      return;
    }

    if (newStartTime >= newEndTime) {
      toast({
        title: "Horário inválido",
        description: "O horário de início deve ser anterior ao horário de término.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("instructor_availability")
        .insert({
          instructor_id: instructorId,
          day_of_week: parseInt(newDay),
          start_time: newStartTime,
          end_time: newEndTime,
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: "Horário adicionado",
        description: "Sua disponibilidade foi atualizada.",
      });

      // Reset form and refresh
      setNewDay("");
      setNewStartTime("");
      setNewEndTime("");
      fetchAvailability();
    } catch (error) {
      console.error("Error adding availability:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o horário.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAvailability = async (id: string) => {
    try {
      const { error } = await supabase
        .from("instructor_availability")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Horário removido",
        description: "Sua disponibilidade foi atualizada.",
      });

      fetchAvailability();
    } catch (error) {
      console.error("Error removing availability:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o horário.",
        variant: "destructive",
      });
    }
  };

  const getDayLabel = (day: number) => {
    return DAYS_OF_WEEK.find(d => d.value === day)?.label || "";
  };

  const groupedAvailability = DAYS_OF_WEEK.map(day => ({
    ...day,
    slots: availability.filter(a => a.day_of_week === day.value),
  })).filter(day => day.slots.length > 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          Carregando disponibilidade...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add new slot */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-[#0A2F44] flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar horário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Dia da semana</Label>
              <Select value={newDay} onValueChange={setNewDay}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={String(day.value)}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Horário início</Label>
              <Select value={newStartTime} onValueChange={setNewStartTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Início" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Horário fim</Label>
              <Select value={newEndTime} onValueChange={setNewEndTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Fim" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleAddAvailability} 
              disabled={saving}
              className="bg-[#0A2F44] hover:bg-[#0A2F44]/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current availability */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-[#0A2F44] flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horários disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {groupedAvailability.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Você ainda não configurou nenhum horário de disponibilidade.
            </p>
          ) : (
            <div className="space-y-4">
              {groupedAvailability.map((day) => (
                <div key={day.value} className="border-b border-gray-100 pb-4 last:border-0">
                  <h4 className="font-medium text-[#0A2F44] mb-2">{day.label}</h4>
                  <div className="flex flex-wrap gap-2">
                    {day.slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 text-sm"
                      >
                        <span>
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </span>
                        <button
                          onClick={() => handleRemoveAvailability(slot.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
