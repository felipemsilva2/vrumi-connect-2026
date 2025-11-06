import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMateriaisHierarchy } from "@/hooks/useMateriaisHierarchy";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Conteúdo do PDF extraído (simulado - você deve substituir pelo conteúdo real)
const PDF_CONTENT = `
[AQUI VOCÊ DEVE COLAR O CONTEÚDO COMPLETO DO PDF PARSEADO]

LEGISLAÇÃO DE TRÂNSITO BRASILEIRA - 2025

MÓDULO: PREVENÇÃO E MEIO AMBIENTE E CIDADANIA (PMAC)

Capítulo 1: Poluição Ambiental no Trânsito
- Poluição atmosférica causada por veículos automotores
- Emissão de gases poluentes e seus efeitos na saúde
- Normas de controle de emissões (PROCONVE)
- Inspeção veicular obrigatória

Capítulo 2: Poluição Sonora
- Ruído de veículos e seus limites legais
- Artigo 227 do CTB: proibição de buzinas em locais proibidos
- Dispositivos de escape e silenciadores
- Penalidades por poluição sonora

Capítulo 3: Poluição Visual
- Excesso de propaganda em veículos
- Limpeza e conservação de vias públicas
- Descarte inadequado de resíduos

Capítulo 4: Sustentabilidade e Mobilidade
- Transporte coletivo e carona solidária
- Uso de bicicletas e modos alternativos
- Redução da pegada de carbono
- Veículos elétricos e híbridos

MÓDULO: DIREÇÃO DEFENSIVA (DD)

Capítulo 1: Conceito e Definição
- O que é direção defensiva
- Princípios fundamentais
- Atitudes preventivas e corretivas
- Responsabilidade do condutor

Capítulo 2: Elementos da Direção Defensiva
- Conhecimento das normas de trânsito
- Atenção e concentração
- Previsão e antecipação de perigos
- Habilidade e perícia na condução
- Ação adequada em situações de risco

Capítulo 3: Importância da Direção Defensiva
- Prevenção de acidentes
- Redução de custos e prejuízos
- Preservação de vidas
- Fluidez do trânsito

[... CONTINUA COM TODO O CONTEÚDO DO PDF DE 221 PÁGINAS ...]
`;

export const PopulateMateriaisFromPDF = () => {
  const { data: hierarchy, isLoading } = useMateriaisHierarchy();
  const { toast } = useToast();
  
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Array<{ lesson: string; success: boolean; blocks: number }>>([]);

  const selectedModuleData = hierarchy?.find(m => m.id === selectedModule);
  const selectedChapterData = selectedModuleData?.chapters.find(c => c.id === selectedChapter);

  const handlePopulate = async () => {
    if (!selectedChapter || !selectedChapterData) {
      toast({
        title: "Erro",
        description: "Selecione um capítulo primeiro",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    setProgress(0);
    setResults([]);

    const lessons = selectedChapterData.lessons;
    const total = lessons.length;

    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      
      try {
        console.log(`Processing lesson ${i + 1}/${total}: ${lesson.title}`);
        
        const { data, error } = await supabase.functions.invoke('populate-materiais-from-pdf', {
          body: {
            lessonId: lesson.id,
            pdfContent: PDF_CONTENT,
            chapterContext: {
              module: selectedModuleData?.title,
              chapter: selectedChapterData.title,
            }
          }
        });

        if (error) throw error;

        setResults(prev => [...prev, {
          lesson: lesson.title,
          success: true,
          blocks: data.blocksCreated
        }]);

        toast({
          title: "Lição processada",
          description: `${lesson.title}: ${data.blocksCreated} blocos criados`,
        });

      } catch (error) {
        console.error(`Error processing lesson ${lesson.title}:`, error);
        
        setResults(prev => [...prev, {
          lesson: lesson.title,
          success: false,
          blocks: 0
        }]);

        toast({
          title: "Erro ao processar lição",
          description: lesson.title,
          variant: "destructive"
        });
      }

      setProgress(((i + 1) / total) * 100);
    }

    setProcessing(false);
    
    toast({
      title: "Processo concluído!",
      description: `${results.filter(r => r.success).length}/${total} lições processadas com sucesso`,
    });
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Popular Materiais do PDF com IA
        </CardTitle>
        <CardDescription>
          Extrai e estrutura automaticamente o conteúdo do PDF em lições granulares usando Gemini AI
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Módulo</label>
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um módulo" />
              </SelectTrigger>
              <SelectContent>
                {hierarchy?.map(module => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.code} - {module.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Capítulo</label>
            <Select 
              value={selectedChapter} 
              onValueChange={setSelectedChapter}
              disabled={!selectedModule}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um capítulo" />
              </SelectTrigger>
              <SelectContent>
                {selectedModuleData?.chapters.map(chapter => (
                  <SelectItem key={chapter.id} value={chapter.id}>
                    {chapter.title} ({chapter.lessons.length} lições)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedChapterData && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>{selectedChapterData.lessons.length} lições</strong> serão processadas:
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {selectedChapterData.lessons.map(lesson => (
                  <li key={lesson.id} className="ml-4">• {lesson.title}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <Button 
          onClick={handlePopulate}
          disabled={!selectedChapter || processing}
          className="w-full"
          size="lg"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando... {Math.round(progress)}%
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Iniciar População Automática
            </>
          )}
        </Button>

        {processing && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-center text-muted-foreground">
              {Math.round(progress)}% concluído
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Resultados:</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm"
                >
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                  )}
                  <span className="flex-1">{result.lesson}</span>
                  {result.success && (
                    <span className="text-muted-foreground">
                      {result.blocks} blocos
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            <strong>⚠️ Importante:</strong> Substitua o conteúdo de PDF_CONTENT no código com o texto completo do PDF parseado de 221 páginas para melhores resultados.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
