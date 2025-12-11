import React, { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, CheckCircle, AlertTriangle } from "lucide-react";

export default function AdminGenerateQuestions() {
  const [category, setCategory] = useState<string>("all");
  const [limit, setLimit] = useState<number>(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-sign-questions', {
        body: { 
          category: category === "all" ? null : category,
          limit 
        }
      });

      if (error) throw error;

      setResults(data);

      if (data.success) {
        toast({
          title: "Questões geradas!",
          description: data.message,
        });
      } else {
        toast({
          title: "Aviso",
          description: data.message || "Nenhuma questão gerada",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      toast({
        title: "Erro",
        description: "Falha ao gerar questões. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gerar Questões Automáticas</h1>
          <p className="text-muted-foreground mt-2">
            Gere questões de simulado automaticamente a partir das placas cadastradas no banco de dados
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Configurações
              </CardTitle>
              <CardDescription>
                Selecione a categoria e quantidade de questões a gerar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Categoria de Placas</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    <SelectItem value="Regulamentação">Regulamentação (Vermelhas)</SelectItem>
                    <SelectItem value="Advertência">Advertência (Amarelas)</SelectItem>
                    <SelectItem value="Indicação">Indicação (Azuis/Verdes)</SelectItem>
                    <SelectItem value="Educativas">Educativas</SelectItem>
                    <SelectItem value="Serviços auxiliares">Serviços auxiliares</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantidade de placas para processar</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Máximo de 50 por vez para evitar timeout
                </p>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando questões...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar Questões com IA
                  </>
                )}
              </Button>

              {isGenerating && (
                <p className="text-sm text-muted-foreground text-center">
                  Isso pode levar alguns minutos...
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resultado</CardTitle>
              <CardDescription>
                Questões geradas aparecerão aqui
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!results && !isGenerating && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma questão gerada ainda</p>
                  <p className="text-sm">Configure as opções e clique em gerar</p>
                </div>
              )}

              {results && results.success && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">{results.message}</span>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {results.generated?.map((item: any, index: number) => (
                      <div 
                        key={index}
                        className="p-3 bg-muted rounded-lg text-sm"
                      >
                        <span className="font-mono font-bold">{item.sign_code}</span>
                        <span className="mx-2">-</span>
                        <span>{item.sign_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results && !results.success && (
                <div className="text-center py-8 text-destructive">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                  <p>{results.message || results.error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Como funciona</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert">
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>O sistema busca placas cadastradas no banco de dados</li>
              <li>Para cada placa, a IA gera uma questão usando o código e nome EXATOS</li>
              <li>A imagem da placa é automaticamente vinculada à questão</li>
              <li>As questões são salvas no banco para uso nos simulados</li>
            </ol>
            <p className="mt-4 text-sm text-yellow-600 dark:text-yellow-500">
              ⚠️ Dica: Gere questões de Advertência (amarelas) para atender o feedback dos usuários de MG
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
