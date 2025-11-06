import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMateriaisHierarchy } from "@/hooks/useMateriaisHierarchy";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

export const PopulateMateriaisFromPDF = () => {
  const { data: hierarchy, isLoading } = useMateriaisHierarchy();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Array<{ lesson: string; success: boolean; blocks: number; error?: string }>>([]);
  const [pdfContent, setPdfContent] = useState<string>("");

  // Batch processing states
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({
    totalLessons: 0,
    processedLessons: 0,
    currentChapter: "",
    processedChapters: 0,
    totalChapters: 0,
    startTime: 0,
  });

  const selectedModuleData = hierarchy?.find(m => m.id === selectedModule);
  const selectedChapterData = selectedModuleData?.chapters.find(c => c.id === selectedChapter);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setParsing(true);
    try {
      // Simple approach: read as text (works for text-based PDFs)
      const text = await file.text();
      
      if (text.length < 100) {
        throw new Error("Arquivo muito pequeno ou não é um PDF válido. Por favor, use o botão 'Usar PDF do Servidor' ou cole o conteúdo manualmente.");
      }

      setPdfContent(text);
      toast({
        title: "Arquivo carregado!",
        description: `${(text.length / 1024).toFixed(0)} KB de conteúdo carregado`,
      });
    } catch (error) {
      console.error('Error loading file:', error);
      toast({
        title: "Erro ao carregar arquivo",
        description: "Use o botão 'Usar PDF do Servidor' ou cole o texto manualmente.",
        variant: "destructive"
      });
    } finally {
      setParsing(false);
    }
  };

  const handleUseServerPDF = async () => {
    setParsing(true);
    try {
      toast({
        title: "Carregando PDF do servidor...",
        description: "Buscando conteúdo do manual",
      });

      const response = await fetch('/materiais/MANUAL-OBTENCAO_2025.pdf');
      if (!response.ok) throw new Error("PDF não encontrado no servidor");

      const blob = await response.blob();
      const text = await blob.text();
      
      setPdfContent(text);
      toast({
        title: "PDF do servidor carregado!",
        description: `${(text.length / 1024).toFixed(0)} KB de conteúdo`,
      });
    } catch (error) {
      console.error('Error loading server PDF:', error);
      toast({
        title: "Erro ao carregar PDF do servidor",
        description: "Por favor, faça upload manual ou cole o texto.",
        variant: "destructive"
      });
    } finally {
      setParsing(false);
    }
  };

  const processLessonWithRetry = async (
    lesson: any,
    chapterContext: any,
    maxRetries = 3
  ): Promise<{ lesson: string; success: boolean; blocks: number; error?: string }> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke('populate-materiais-from-pdf', {
          body: {
            lessonId: lesson.id,
            pdfContent: pdfContent,
            chapterContext: chapterContext,
          }
        });

        if (error) throw error;

        return {
          lesson: lesson.title,
          success: true,
          blocks: data.blocksCreated
        };
      } catch (err) {
        if (attempt < maxRetries) {
          console.log(`⚠️ Tentativa ${attempt} falhou para ${lesson.title}, tentando novamente em 2s...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          return {
            lesson: lesson.title,
            success: false,
            blocks: 0,
            error: err instanceof Error ? err.message : "Erro desconhecido"
          };
        }
      }
    }
    
    return {
      lesson: lesson.title,
      success: false,
      blocks: 0,
      error: "Falhou após múltiplas tentativas"
    };
  };

  const handlePopulate = async () => {
    if (!selectedChapter || !selectedChapterData) {
      toast({
        title: "Erro",
        description: "Selecione um capítulo primeiro",
        variant: "destructive"
      });
      return;
    }

    if (!pdfContent) {
      toast({
        title: "Erro",
        description: "Faça upload do PDF primeiro",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    setProgress(0);
    setResults([]);

    const lessons = selectedChapterData.lessons;
    const total = lessons.length;
    const chapterContext = {
      module: selectedModuleData?.title,
      chapter: selectedChapterData.title,
    };

    toast({
      title: "Iniciando Processamento",
      description: `Processando ${total} lições com IA...`,
    });

    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      const result = await processLessonWithRetry(lesson, chapterContext);
      
      setResults(prev => [...prev, result]);
      setProgress(((i + 1) / total) * 100);

      if (result.success) {
        toast({
          title: "Lição processada",
          description: `${lesson.title}: ${result.blocks} blocos criados`,
        });
      }
    }

    setProcessing(false);
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    toast({
      title: successCount === total ? "✅ Sucesso!" : "⚠️ Processamento Concluído",
      description: `${successCount} lições processadas${failCount > 0 ? `, ${failCount} falharam` : ""}`,
      variant: successCount === total ? "default" : "destructive",
    });
  };

  const handlePopulateAll = async () => {
    if (!pdfContent) {
      toast({
        title: "Erro",
        description: "Faça upload do PDF primeiro",
        variant: "destructive"
      });
      return;
    }

    const allChapters = hierarchy?.flatMap(m => m.chapters) || [];
    const allLessons = allChapters.flatMap(c => c.lessons);

    if (allLessons.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhuma lição encontrada",
        variant: "destructive"
      });
      return;
    }

    setIsBatchProcessing(true);
    setResults([]);
    setBatchProgress({
      totalLessons: allLessons.length,
      processedLessons: 0,
      currentChapter: "",
      processedChapters: 0,
      totalChapters: allChapters.length,
      startTime: Date.now(),
    });

    toast({
      title: "🚀 Processamento em Batch Iniciado",
      description: `Processando ${allLessons.length} lições em ${allChapters.length} capítulos...`,
    });

    const allResults: { lesson: string; success: boolean; blocks: number; error?: string }[] = [];
    const BATCH_SIZE = 5;

    for (let chapterIndex = 0; chapterIndex < allChapters.length; chapterIndex++) {
      const chapter = allChapters[chapterIndex];
      const lessons = chapter.lessons;
      
      setBatchProgress(prev => ({
        ...prev,
        currentChapter: chapter.title,
        processedChapters: chapterIndex,
      }));

      const moduleData = hierarchy?.find(m => m.chapters.some(c => c.id === chapter.id));
      const chapterContext = {
        module: moduleData?.title,
        chapter: chapter.title,
      };

      // Process lessons in batches of 5
      for (let i = 0; i < lessons.length; i += BATCH_SIZE) {
        const batch = lessons.slice(i, i + BATCH_SIZE);
        
        const batchResults = await Promise.all(
          batch.map(lesson => processLessonWithRetry(lesson, chapterContext))
        );

        allResults.push(...batchResults);

        setBatchProgress(prev => ({
          ...prev,
          processedLessons: allResults.length,
        }));
      }
    }

    setResults(allResults);
    setIsBatchProcessing(false);

    const successCount = allResults.filter(r => r.success).length;
    const failCount = allResults.filter(r => !r.success).length;
    const totalTime = Math.round((Date.now() - batchProgress.startTime) / 1000);

    toast({
      title: "🎉 Processamento Completo!",
      description: `✅ ${successCount} lições | ❌ ${failCount} falhas | ⏱️ ${Math.floor(totalTime / 60)}m ${totalTime % 60}s`,
      variant: failCount === 0 ? "default" : "destructive",
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
            <label className="block text-sm font-medium mb-2">Conteúdo do PDF</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  onClick={handleUseServerPDF}
                  disabled={parsing || processing || isBatchProcessing}
                  variant="outline"
                  className="flex-1"
                >
                  {parsing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      📄 Usar PDF do Servidor
                    </>
                  )}
                </Button>
                
                <div className="flex-1">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt"
                    onChange={handleFileUpload}
                    disabled={parsing || processing || isBatchProcessing}
                  />
                </div>
              </div>
              
              {pdfContent && (
                <p className="text-sm text-green-600">
                  ✓ Conteúdo carregado: {(pdfContent.length / 1024).toFixed(0)} KB
                </p>
              )}
              
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground">
                  Opção alternativa: colar texto manualmente
                </summary>
                <textarea
                  className="w-full h-32 mt-2 p-2 border rounded text-xs"
                  placeholder="Cole o conteúdo do PDF aqui se os métodos acima não funcionarem..."
                  value={pdfContent}
                  onChange={(e) => setPdfContent(e.target.value)}
                  disabled={processing || isBatchProcessing}
                />
              </details>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Módulo (para processar 1 capítulo)</label>
            <Select value={selectedModule} onValueChange={setSelectedModule} disabled={processing || isBatchProcessing}>
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
              disabled={!selectedModule || processing || isBatchProcessing}
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
              <ul className="mt-2 space-y-1 text-sm max-h-32 overflow-y-auto">
                {selectedChapterData.lessons.map(lesson => (
                  <li key={lesson.id} className="ml-4">• {lesson.title}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Button
            onClick={handlePopulate}
            disabled={!selectedChapter || !pdfContent || processing || isBatchProcessing}
            className="w-full"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processando... {Math.round(progress)}%
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Processar 1 Capítulo
              </>
            )}
          </Button>

          <Button
            onClick={handlePopulateAll}
            disabled={!pdfContent || processing || isBatchProcessing}
            className="w-full"
            size="lg"
            variant="default"
          >
            {isBatchProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processando Todos...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                🚀 Processar Todos os 23 Capítulos
              </>
            )}
          </Button>
        </div>

        {(processing || isBatchProcessing) && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
            {isBatchProcessing && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Progresso Global</span>
                    <span className="text-muted-foreground">
                      {batchProgress.processedLessons}/{batchProgress.totalLessons} lições ({Math.round((batchProgress.processedLessons / batchProgress.totalLessons) * 100)}%)
                    </span>
                  </div>
                  <Progress 
                    value={(batchProgress.processedLessons / batchProgress.totalLessons) * 100} 
                    className="h-3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Capítulos Processados</div>
                    <div className="font-medium">
                      {batchProgress.processedChapters}/{batchProgress.totalChapters}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Tempo Estimado</div>
                    <div className="font-medium">
                      ~{Math.max(1, Math.ceil(((batchProgress.totalLessons - batchProgress.processedLessons) * 8) / 60))} min
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Processando agora:</div>
                  <div className="font-medium text-sm">{batchProgress.currentChapter}</div>
                </div>
              </>
            )}

            {processing && !isBatchProcessing && (
              <>
                <Progress value={progress} />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processando capítulo com IA Gemini 2.5 Flash... {Math.round(progress)}%</span>
                </div>
              </>
            )}
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Resultados do Processamento</h3>
              <div className="text-sm text-muted-foreground">
                ✅ {results.filter(r => r.success).length} sucesso | 
                ❌ {results.filter(r => !r.success).length} falhas
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-1 pr-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`text-sm p-3 rounded-lg flex items-start gap-3 border ${
                    result.success
                      ? "bg-green-500/5 border-green-500/20"
                      : "bg-red-500/5 border-red-500/20"
                  }`}
                >
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{result.lesson}</div>
                    {result.success && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {result.blocks} blocos criados
                      </div>
                    )}
                    {result.error && (
                      <div className="text-xs opacity-75 mt-1">{result.error}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>ℹ️ Como usar:</strong>
          </p>
          <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 ml-4">
            <li>• <strong>Opção 1:</strong> Clique em "Usar PDF do Servidor" para usar o PDF já carregado</li>
            <li>• <strong>Opção 2:</strong> Faça upload de um arquivo PDF ou TXT</li>
            <li>• <strong>Opção 3:</strong> Cole o conteúdo manualmente no campo de texto</li>
            <li>• Depois escolha processar 1 capítulo (teste) ou todos os 23 capítulos (~3-4 min)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};