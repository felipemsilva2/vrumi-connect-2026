import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText, Sparkles, CheckCircle2, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FlashcardEditorDialog } from "@/components/admin/FlashcardEditorDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminFlashcards() {
  const [view, setView] = useState<'list' | 'generate'>('list');
  const { toast } = useToast();

  // AI Generation State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ generated: 0, total: 0 });

  // List & management State
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 20;

  // Dialogs
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (view === 'list') {
      fetchFlashcards();
    }
  }, [view, page, filterDifficulty, searchTerm]);

  const fetchFlashcards = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("flashcards")
        .select(`*, study_chapters(title)`)
        .order("created_at", { ascending: false })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      if (searchTerm) {
        query = query.ilike("question", `%${searchTerm}%`);
      }
      if (filterDifficulty !== "all") {
        query = query.eq("difficulty", filterDifficulty);
      }

      const { data, error } = await query;
      if (error) throw error;
      setFlashcards(data || []);
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao carregar flashcards", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("flashcards").delete().eq("id", deleteId);
      if (error) throw error;
      toast({ title: "Flashcard removido" });
      fetchFlashcards();
    } catch (error) {
      toast({ title: "Erro ao remover", variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  };

  const handleEdit = (fc: any) => {
    setEditingFlashcard(fc);
    setEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingFlashcard(null);
    setEditorOpen(true);
  };

  const handleGenerateFromServerPDF = async () => {
    try {
      setIsProcessing(true);
      setProgress(10);
      setStats({ generated: 0, total: 0 });

      // Carregar PDF do servidor
      const response = await fetch('/materiais/MANUAL-OBTENCAO_2025.pdf');
      if (!response.ok) throw new Error('Erro ao carregar PDF do servidor');

      const blob = await response.blob();
      const reader = new FileReader();

      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        setProgress(30);

        const { data, error } = await supabase.functions.invoke('generate-flashcards', {
          body: { pdfBase64: base64 }
        });

        if (error) throw error;

        setProgress(100);
        setStats({ generated: data.flashcardsGenerated, total: data.flashcardsGenerated });

        toast({
          title: "Flashcards gerados com sucesso!",
          description: `${data.flashcardsGenerated} flashcards foram criados no banco de dados.`,
        });
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Erro ao gerar flashcards:', error);
      toast({
        title: "Erro ao gerar flashcards",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 mb-20 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestão de Flashcards</h1>
            <p className="text-muted-foreground">
              {view === 'list' ? "Gerencie o banco de flashcards manualmente" : "Gere novos flashcards usando IA"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={view === 'list' ? "default" : "outline"}
              onClick={() => setView('list')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Listagem
            </Button>
            <Button
              variant={view === 'generate' ? "default" : "outline"}
              onClick={() => setView('generate')}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar com IA
            </Button>
          </div>
        </div>

        {view === 'generate' ? (
          <div className="grid gap-6 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Geração Automática de Flashcards
                </CardTitle>
                <CardDescription>
                  Gera flashcards a partir do Manual de Obtenção da CNH usando Gemini 2.5 Flash
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Como funciona:
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>IA analisa o conteúdo do manual completo</li>
                    <li>Cria pares de pergunta e resposta</li>
                    <li>Foca em conceitos chave para memorização</li>
                    <li>Associa aos capítulos correspondentes</li>
                    <li>Define nível de dificuldade (fácil, médio, difícil)</li>
                    <li>Insere diretamente no banco de dados</li>
                  </ul>
                </div>

                <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">Meta de Flashcards</h4>
                      <p className="text-sm text-muted-foreground">
                        Serão gerados aproximadamente 50 flashcards por execução
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateFromServerPDF}
                  disabled={isProcessing}
                  size="lg"
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando flashcards...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Usar PDF do Servidor
                    </>
                  )}
                </Button>

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Progresso</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                    {stats.total > 0 && (
                      <p className="text-sm text-center text-muted-foreground">
                        {stats.generated} de {stats.total} flashcards gerados
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{stats.generated}</p>
                    <p className="text-sm text-muted-foreground">Flashcards Gerados</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {isProcessing ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : '✓'}
                    </p>
                    <p className="text-sm text-muted-foreground">Status</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-lg border">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar na pergunta..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-[200px]">
                <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Dificuldade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Dificuldades</SelectItem>
                    <SelectItem value="easy">Fácil</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="hard">Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Flashcard
              </Button>
            </div>

            {/* Table */}
            <div className="border rounded-md bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[400px]">Pergunta</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Dificuldade</TableHead>
                    <TableHead>Resposta (Resumo)</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : flashcards.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Nenhum flashcard encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    flashcards.map((fc) => (
                      <TableRow key={fc.id}>
                        <TableCell className="font-medium">
                          <p className="truncate max-w-[380px]" title={fc.question}>
                            {fc.question}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{fc.study_chapters?.title || fc.category || "Geral"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={fc.difficulty === 'hard' ? 'destructive' : fc.difficulty === 'medium' ? 'secondary' : 'default'}>
                            {fc.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="truncate max-w-[200px] text-muted-foreground" title={fc.answer}>
                            {fc.answer}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(fc)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(fc.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="p-4 border-t flex justify-between items-center bg-muted/20">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">Página {page + 1}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={flashcards.length < ITEMS_PER_PAGE}
                  onClick={() => setPage(p => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </div>
        )}

        <FlashcardEditorDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          flashcard={editingFlashcard}
          onSuccess={fetchFlashcards}
        />

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Flashcard</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza? Esta ação é irreversível.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
