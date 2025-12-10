import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Question {
    id?: string;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: string;
    explanation: string;
    difficulty: "easy" | "medium" | "hard";
    chapter_id?: string;
}

interface QuestionEditorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    question?: Question | null;
    onSuccess: () => void;
}

export const QuestionEditorDialog = ({ open, onOpenChange, question, onSuccess }: QuestionEditorDialogProps) => {
    const [formData, setFormData] = useState<Question>({
        question_text: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct_option: "A",
        explanation: "",
        difficulty: "medium"
    });
    const [chapters, setChapters] = useState<{ id: string; title: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open) {
            fetchChapters();
            if (question) {
                setFormData(question);
            } else {
                setFormData({
                    question_text: "",
                    option_a: "",
                    option_b: "",
                    option_c: "",
                    option_d: "",
                    correct_option: "A",
                    explanation: "",
                    difficulty: "medium"
                });
            }
        }
    }, [open, question]);

    const fetchChapters = async () => {
        const { data } = await supabase.from("study_chapters").select("id, title");
        if (data) setChapters(data);
    };

    const handleSave = async () => {
        if (!formData.question_text || !formData.option_a || !formData.option_b) {
            toast.error("Preencha os campos obrigatórios");
            return;
        }

        setIsLoading(true);
        try {
            if (question?.id) {
                const { error } = await supabase
                    .from("quiz_questions")
                    .update(formData)
                    .eq("id", question.id);
                if (error) throw error;
                toast.success("Questão atualizada!");
            } else {
                const { error } = await supabase
                    .from("quiz_questions")
                    .insert(formData as any);
                if (error) throw error;
                toast.success("Questão criada!");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Erro ao salvar questão:", error);
            toast.error("Erro ao salvar: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{question?.id ? "Editar Questão" : "Nova Questão"}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Enunciado</Label>
                        <Textarea
                            value={formData.question_text}
                            onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                            placeholder="Digite a pergunta..."
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Opção A</Label>
                            <Input
                                value={formData.option_a}
                                onChange={(e) => setFormData({ ...formData, option_a: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Opção B</Label>
                            <Input
                                value={formData.option_b}
                                onChange={(e) => setFormData({ ...formData, option_b: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Opção C</Label>
                            <Input
                                value={formData.option_c}
                                onChange={(e) => setFormData({ ...formData, option_c: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Opção D</Label>
                            <Input
                                value={formData.option_d}
                                onChange={(e) => setFormData({ ...formData, option_d: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Correta</Label>
                            <Select
                                value={formData.correct_option}
                                onValueChange={(val) => setFormData({ ...formData, correct_option: val })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A">A</SelectItem>
                                    <SelectItem value="B">B</SelectItem>
                                    <SelectItem value="C">C</SelectItem>
                                    <SelectItem value="D">D</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
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
                        <Label>Explicação</Label>
                        <Textarea
                            value={formData.explanation}
                            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                            placeholder="Explique por que a resposta está correta..."
                            rows={3}
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
