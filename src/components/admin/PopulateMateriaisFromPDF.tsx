import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMateriaisHierarchy } from "@/hooks/useMateriaisHierarchy";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, CheckCircle, AlertCircle, Upload } from "lucide-react";
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
  const [results, setResults] = useState<Array<{ lesson: string; success: boolean; blocks: number }>>([]);
  const [pdfContent, setPdfContent] = useState<string>("");

  const selectedModuleData = hierarchy?.find(m => m.id === selectedModule);
  const selectedChapterData = selectedModuleData?.chapters.find(c => c.id === selectedChapter);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setParsing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      toast({
        title: "Parseando PDF...",
        description: "Extraindo conteúdo do documento (pode levar alguns minutos)",
      });

      // Parse PDF usando edge function
      const { data, error } = await supabase.functions.invoke('parse-pdf', {
        body: formData
      });

      if (error) throw error;

      setPdfContent(data.content);
      toast({
        title: "PDF parseado com sucesso!",
        description: `${data.pages} páginas extraídas`,
      });
    } catch (error) {
      console.error('Error parsing PDF:', error);
      toast({
        title: "Erro ao parsear PDF",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setParsing(false);
    }
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

    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      
      try {
        console.log(`Processing lesson ${i + 1}/${total}: ${lesson.title}`);
        
        const { data, error } = await supabase.functions.invoke('populate-materiais-from-pdf', {
          body: {
            lessonId: lesson.id,
            pdfContent: pdfContent,
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
            <label className="block text-sm font-medium mb-2">Upload do PDF (221 páginas)</label>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={parsing}
                className="flex-1"
              />
              {parsing && <Loader2 className="h-5 w-5 animate-spin" />}
            </div>
            {pdfContent && (
              <p className="text-sm text-green-600 mt-2">
                ✓ PDF carregado ({(pdfContent.length / 1024).toFixed(0)} KB de conteúdo)
              </p>
            )}
          </div>
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
          disabled={!selectedChapter || processing || !pdfContent}
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

        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>ℹ️ Como usar:</strong> Faça upload do PDF completo de 221 páginas. O sistema irá extrair automaticamente todo o conteúdo e processá-lo com IA para popular as lições.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
