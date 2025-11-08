import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText, Sparkles, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function AdminQuestions() {
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

        // Chamar edge function para gerar questões
        const { data, error } = await supabase.functions.invoke('generate-questions', {
          body: { pdfBase64: base64 }
        });

        if (error) throw error;

        setProgress(100);
        setStats({ generated: data.questionsGenerated, total: data.questionsGenerated });

        toast({
          title: "Questões geradas com sucesso!",
          description: `${data.questionsGenerated} questões foram criadas no banco de dados.`,
        });
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Erro ao gerar questões:', error);
      toast({
        title: "Erro ao gerar questões",
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
          <h1 className="text-4xl font-bold mb-2">Gerar Questões com IA</h1>
          <p className="text-muted-foreground">
            Use inteligência artificial para criar questões de múltipla escolha automaticamente
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Geração Automática de Questões
              </CardTitle>
              <CardDescription>
                Gera questões de múltipla escolha a partir do Manual de Obtenção da CNH usando Gemini 2.5 Flash
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
                  <li>Cria questões de múltipla escolha (A, B, C, D)</li>
                  <li>Inclui explicação detalhada da resposta correta</li>
                  <li>Associa questões aos capítulos correspondentes</li>
                  <li>Define nível de dificuldade (fácil, médio, difícil)</li>
                  <li>Insere diretamente no banco de dados</li>
                </ul>
              </div>

              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Meta de Questões</h4>
                    <p className="text-sm text-muted-foreground">
                      Serão geradas aproximadamente 150-200 questões para garantir variedade nos simulados
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
                    Gerando questões...
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
                      {stats.generated} de {stats.total} questões geradas
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
                  <p className="text-sm text-muted-foreground">Questões Geradas</p>
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
