import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Flashcard {
    id?: string;
    question: string;
    answer: string;
    category: string;
    difficulty: "easy" | "medium" | "hard";
    chapter_id?: string;
}

interface FlashcardEditorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    flashcard?: Flashcard | null;
    onSuccess: () => void;
}

export const FlashcardEditorDialog = ({ open, onOpenChange, flashcard, onSuccess }: FlashcardEditorDialogProps) => {
    const [formData, setFormData] = useState<Flashcard>({
        question: "",
        answer: "",
        category: "",
        difficulty: "medium"
    });
    const [chapters, setChapters] = useState<{ id: string; title: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open) {
            fetchChapters();
            if (flashcard) {
                setFormData(flashcard);
            } else {
                setFormData({
                    question: "",
                    answer: "",
                    category: "",
                    difficulty: "medium"
                });
            }
        }
    }, [open, flashcard]);

    const fetchChapters = async () => {
        const { data } = await supabase.from("study_chapters").select("id, title");
        if (data) setChapters(data);
    };

    const handleSave = async () => {
        if (!formData.question || !formData.answer) {
            toast.error("Preencha os campos obrigatórios");
            return;
        }

        setIsLoading(true);
        try {
            if (flashcard?.id) {
                const { error } = await supabase
                    .from("flashcards")
                    .update(formData)
                    .eq("id", flashcard.id);
                if (error) throw error;
                toast.success("Flashcard atualizado!");
            } else {
                const { error } = await supabase
                    .from("flashcards")
                    .insert(formData as any);
                if (error) throw error;
                toast.success("Flashcard criado!");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Erro ao salvar flashcard:", error);
            toast.error("Erro ao salvar: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{flashcard?.id ? "Editar Flashcard" : "Novo Flashcard"}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Pergunta / Frente</Label>
                        <Textarea
                            value={formData.question}
                            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                            placeholder="Digite a pergunta..."
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Resposta / Verso</Label>
                        <Textarea
                            value={formData.answer}
                            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                            placeholder="Digite a resposta..."
                            rows={4}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Dificuldade</Label>
                            <Select
                                value={formData.difficulty}
                                onValueChange={(val: any) => setFormData({ ...formData, difficulty: val })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">Fácil</SelectItem>
                                    <SelectItem value="medium">Média</SelectItem>
                                    <SelectItem value="hard">Difícil</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Capítulo / Categoria</Label>
                            <Select
                                value={formData.chapter_id || ""}
                                onValueChange={(val) => setFormData({ ...formData, chapter_id: val })}
                            >
                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent>
                                    {chapters.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Categoria (Texto Livre)</Label>
                        <Input
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            placeholder="Ex: Legislação"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isLoading}>{isLoading ? "Salvando..." : "Salvar"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
