import { useState, useRef } from "react";
import { Send, Car, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { PDFViewer } from "@/components/study-room/PDFViewer";
import { QuickActions } from "@/components/study-room/QuickActions";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { pdfjs } from "react-pdf";
import { SmartBreadcrumb } from "@/components/SmartBreadcrumb";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function StudyRoom() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pdfText, setPdfText] = useState<string>("");
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const pdfViewerRef = useRef<{ getCurrentFile: () => string | null; getCurrentPage: () => number }>(null);

  const extractPdfContext = async (file: string, currentPage: number): Promise<string> => {
    try {
      const pdf = await pdfjs.getDocument(file).promise;
      const numPages = pdf.numPages;
      
      // Extrair contexto: página atual + 2 anteriores + 2 posteriores
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(numPages, currentPage + 2);
      
      let context = "";
      for (let i = startPage; i <= endPage; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        context += `\n[Página ${i}]\n${pageText}\n`;
      }
      
      return context.substring(0, 8000); // Limitar contexto
    } catch (error) {
      console.error("Erro ao extrair texto do PDF:", error);
      return "";
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Extrair contexto do PDF atual
      const currentFile = pdfViewerRef.current?.getCurrentFile();
      const currentPage = pdfViewerRef.current?.getCurrentPage() || 1;
      
      let pdfContext = "";
      if (currentFile) {
        pdfContext = await extractPdfContext(currentFile, currentPage);
      }

      // Chamar edge function
      const { data, error } = await supabase.functions.invoke("study-chat", {
        body: {
          message: inputValue,
          pdfContext: pdfContext || "Nenhum PDF carregado.",
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao se comunicar com a IA. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = async (prompt: string) => {
    // Set the input value and send the message
    setInputValue(prompt);
    
    // Use setTimeout to ensure the input value is set before sending
    setTimeout(() => {
      // Create a synthetic event to trigger handleSendMessage
      const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSendMessage();
    }, 0);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header com Logo */}
      <header className="bg-background border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="mx-auto max-w-[1400px] w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/")}
            >
              <Car className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              <span className="text-lg sm:text-xl font-black text-foreground">Vrumi</span>
            </div>
            <h1 className="text-sm sm:text-lg font-semibold text-foreground">
              Sala de Estudos
            </h1>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="mx-auto max-w-[1400px] w-full px-3 sm:px-4 lg:px-6 py-3">
        <SmartBreadcrumb />
      </div>

      {/* Conteúdo Principal */}
      <div className="mx-auto max-w-[1400px] w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className={cn(
          "rounded-lg shadow-elegant overflow-hidden bg-background border border-border",
          isMobile ? "flex flex-col min-h-[calc(100vh-140px)]" : "flex gap-4 min-h-[600px] h-[calc(100vh-140px)]"
        )}>
          {/* Lado Esquerdo - Visualizador de PDF */}
          <PDFViewer 
            ref={pdfViewerRef}
            className={cn(
              "study-room-scrollbar",
              isMobile ? "w-full h-[50vh] border-b" : "w-1/2 border-r"
            )} 
          />

          {/* Lado Direito - Chat com IA */}
          <div className={cn(
            "flex flex-col bg-background",
            isMobile ? "w-full flex-1" : "w-1/2"
          )}>
            {/* Ações Rápidas - Acima da área de mensagens */}
            <QuickActions 
              onQuickAction={handleQuickAction} 
              className="border-b border-border"
            />
            
            {/* Área de mensagens */}
            <ScrollArea className="flex-1 p-3 sm:p-4 study-room-scrollbar">
              <div className="space-y-3 sm:space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p className="text-sm sm:text-base">Faça uma pergunta para começar</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        )}
                      >
                        <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <p className="text-[10px] sm:text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Barra de input fixada na parte inferior */}
            <div className="border-t border-border p-3 sm:p-4 bg-background">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua pergunta..."
                  className="flex-1 text-sm sm:text-base"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size={isMobile ? "sm" : "default"}
                  className="bg-primary hover:bg-primary/90 shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
