import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function AdminFlashcards() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ generated: 0, total: 0 });
  const { toast } = useToast();

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

        // Chamar edge function para gerar flashcards
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Gerar Flashcards com IA</h1>
          <p className="text-muted-foreground">
            Use inteligência artificial para extrair conceitos do manual e criar flashcards automaticamente
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Geração Automática
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
                  <li>Extrai conceitos importantes e cria perguntas/respostas</li>
                  <li>Categoriza por tópico (Legislação, Sinalização, etc.)</li>
                  <li>Define nível de dificuldade automaticamente</li>
                  <li>Insere diretamente no banco de dados</li>
                </ul>
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
      </div>
    </div>
  );
}
