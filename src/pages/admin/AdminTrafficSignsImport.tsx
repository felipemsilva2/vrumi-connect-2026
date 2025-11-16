import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ImportResult {
  total: number;
  success: number;
  errors: Array<{ code: string; error: string }>;
}

export default function AdminTrafficSignsImport() {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/json') {
      setFile(selectedFile);
      setResult(null);
    } else {
      toast.error('Por favor, selecione um arquivo JSON válido');
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Selecione um arquivo JSON primeiro');
      return;
    }

    setIsImporting(true);
    setProgress(0);

    try {
      const fileContent = await file.text();
      const signs = JSON.parse(fileContent);

      if (!Array.isArray(signs)) {
        throw new Error('O arquivo JSON deve conter um array de placas');
      }

      toast.info(`Iniciando importação de ${signs.length} placas...`);

      // Simular progresso durante o upload
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 95));
      }, 1000);

      const { data, error } = await supabase.functions.invoke('import-traffic-signs', {
        body: { signs },
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      setResult(data as ImportResult);
      
      if (data.success === data.total) {
        toast.success(`✅ Todas as ${data.total} placas foram importadas com sucesso!`);
      } else {
        toast.warning(`⚠️ ${data.success} placas importadas com sucesso, ${data.errors.length} com erro`);
      }
    } catch (error: any) {
      console.error('Erro na importação:', error);
      toast.error(`Erro ao importar placas: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Importar Placas de Trânsito</h1>
        <p className="text-muted-foreground">
          Faça upload de um arquivo JSON contendo as placas de trânsito para importação em lote
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Selecionar Arquivo</CardTitle>
          <CardDescription>
            O arquivo deve ser um JSON contendo um array de objetos com os campos: code, name, image_url, description, category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                disabled={isImporting}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
              />
            </div>

            {file && (
              <Alert>
                <Upload className="h-4 w-4" />
                <AlertDescription>
                  Arquivo selecionado: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleImport}
              disabled={!file || isImporting}
              className="w-full"
              size="lg"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Iniciar Importação
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isImporting && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Progresso da Importação</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              {progress}% concluído
            </p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.errors.length === 0 ? (
                <>
                  <CheckCircle className="text-green-500" />
                  Importação Concluída com Sucesso
                </>
              ) : (
                <>
                  <AlertCircle className="text-yellow-500" />
                  Importação Concluída com Avisos
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{result.success}</div>
                  <div className="text-sm text-muted-foreground">Sucesso</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{result.errors.length}</div>
                  <div className="text-sm text-muted-foreground">Erros</div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <XCircle className="text-red-500 h-5 w-5" />
                    Erros Encontrados
                  </h3>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {result.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertDescription>
                          <strong>{error.code}:</strong> {error.error}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 text-sm text-muted-foreground">
        <h3 className="font-semibold mb-2">Formato esperado do JSON:</h3>
        <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
{`[
  {
    "code": "A-1a",
    "name": "Curva acentuada à esquerda",
    "image_url": "https://exemplo.com/imagem.jpg",
    "description": "Indica uma curva fechada...",
    "category": "Advertência"
  }
]`}
        </pre>
      </div>
    </div>
  );
}
