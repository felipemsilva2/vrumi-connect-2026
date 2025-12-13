import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  instructorId: string;
  instructorName: string;
  studentId: string;
  onReviewSubmitted: () => void;
}

export function ReviewModal({
  isOpen,
  onClose,
  bookingId,
  instructorId,
  instructorName,
  studentId,
  onReviewSubmitted,
}: ReviewModalProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Avaliação necessária",
        description: "Por favor, selecione uma nota de 1 a 5 estrelas.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        booking_id: bookingId,
        instructor_id: instructorId,
        student_id: studentId,
        rating,
        comment: comment.trim() || null,
        is_approved: true,
      });

      if (error) throw error;

      toast({
        title: "Avaliação enviada!",
        description: "Obrigado pelo seu feedback.",
      });

      onReviewSubmitted();
      onClose();
    } catch (error: any) {
      console.error("Review error:", error);
      toast({
        title: "Erro ao enviar",
        description: error.message || "Não foi possível enviar a avaliação.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#0A2F44]">Avaliar aula</DialogTitle>
          <DialogDescription>
            Como foi sua aula com {instructorName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= displayRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              {displayRating === 0 && "Selecione uma nota"}
              {displayRating === 1 && "Muito ruim"}
              {displayRating === 2 && "Ruim"}
              {displayRating === 3 && "Regular"}
              {displayRating === 4 && "Bom"}
              {displayRating === 5 && "Excelente"}
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#0A2F44]">
              Comentário (opcional)
            </label>
            <Textarea
              placeholder="Conte como foi sua experiência..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-400 text-right">
              {comment.length}/500 caracteres
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="bg-[#0A2F44] hover:bg-[#0A2F44]/90"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar avaliação"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
