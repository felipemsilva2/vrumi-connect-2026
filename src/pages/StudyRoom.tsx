import React, { useState, useRef, useEffect } from "react";
import { Send, Car, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModernButton } from "@/components/ui/modern-button";
import { ModernCard, ModernCardContent } from "@/components/ui/modern-card";
import { cn } from "@/lib/utils";
import { PDFViewer } from "@/components/study-room/PDFViewer";
import MobilePDFReader from "@/components/study-room/MobilePDFReader";
import { QuickActions } from "@/components/study-room/QuickActions";
import { TextSelectionTooltip } from "@/components/study-room/TextSelectionTooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { useContextualNavigation } from "@/utils/navigation";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist";
import { AppLayout } from '@/components/Layout/AppLayout';
import { getErrorMessage } from "@/utils/errorMessages";
import { SubscriptionGate } from "@/components/auth/SubscriptionGate";
import { SmartBreadcrumb } from "@/components/SmartBreadcrumb";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  session_id?: string;
  user_id?: string;
}

interface StudyRoomProps {
  user: any;
  profile: any;
}

export default function StudyRoom({ user, profile }: StudyRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pdfText, setPdfText] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'pdf' | 'chat'>('pdf');
  const navigate = useNavigate();
  const homeRoute = useContextualNavigation();
  const pdfViewerRef = useRef<{ getCurrentFile: () => string | null; getCurrentPage: () => number }>(null);
  const [mobilePdfPage, setMobilePdfPage] = useState(1);
  const mobilePdfFile = "/materiais/MANUAL-OBTENCAO_2025.pdf";
  const [mobilePdfFailed, setMobilePdfFailed] = useState(false);

  const extractPdfContext = async (file: string, currentPage: number): Promise<string> => {
    try {
      const loadingTask = pdfjsLib.getDocument({
        url: file,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
      });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      
      // Extrair contexto: página atual + 2 anteriores + 2 posteriores
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(numPages, currentPage + 2);
      
      let context = "";
      for (let i = startPage; i <= endPage; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => ('str' in item ? item.str : ''))
          .join(" ");
        context += `\n[Página ${i}]\n${pageText}\n`;
      }
      
      return context.substring(0, 8000); // Limitar contexto
    } catch (error) {
      const errorInfo = getErrorMessage(error, {
        operation: 'extrair PDF',
        component: 'PDFViewer'
      });
      
      toast.error(errorInfo.title, {
        description: errorInfo.message,
        duration: 5000,
      });
      
      console.error("Erro ao extrair texto do PDF:", error);
      return "";
    }
  };

  // Load chat history and get user on component mount
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          // Load chat history
          await loadChatHistory();
        } else {
          setIsLoadingHistory(false);
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
        setIsLoadingHistory(false);
      }
    };

    initializeChat();
  }, []);

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

    // Save user message to database
    await saveMessage(userMessage);

    try {
      // Extrair contexto do PDF atual
      const currentFile = isMobile ? mobilePdfFile : pdfViewerRef.current?.getCurrentFile();
      const currentPage = isMobile ? mobilePdfPage : (pdfViewerRef.current?.getCurrentPage() || 1);
      
      let pdfContext = "";
      if (currentFile) {
        pdfContext = await extractPdfContext(currentFile, currentPage);
      }

      // Chamar edge function
      const { data, error } = await supabase.functions.invoke("study-chat", {
        body: {
          message: userMessage.content,
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
      
      // Save AI response to database
      await saveMessage(aiResponse);
    } catch (error) {
      const errorInfo = getErrorMessage(error, {
        operation: 'enviar mensagem',
        component: 'StudyRoom'
      });
      
      toast.error(errorInfo.title, {
        description: errorInfo.message,
        duration: 5000,
      });
      
      console.error("Erro ao enviar mensagem:", error);
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

  const handleTextExplanation = async (selectedText: string) => {
    const explanationPrompt = `Me explique este trecho da lei: ${selectedText}`;
    
    // Set the input value and send the message
    setInputValue(explanationPrompt);
    
    // Use setTimeout to ensure the input value is set before sending
    setTimeout(() => {
      handleSendMessage();
    }, 0);
  };

  // Function to create or get current chat session
  const getOrCreateSession = async (): Promise<string> => {
    if (!userId) throw new Error('User not authenticated');
    
    if (sessionId) return sessionId;
    
    // Create a new session
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        title: 'Sessão de Estudo'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    setSessionId(data.id);
    return data.id;
  };

  // Function to save message to database
  const saveMessage = async (message: Message): Promise<void> => {
    if (!userId) return;
    
    try {
      const session_id = await getOrCreateSession();
      
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          session_id,
          user_id: userId,
          role: message.role,
          content: message.content
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error saving message:', error);
      // Don't show error to user - chat should work even if saving fails
    }
  };

  // Function to load chat history
  const loadChatHistory = async (): Promise<void> => {
    if (!userId) {
      setIsLoadingHistory(false);
      return;
    }
    
    try {
      // Get the most recent session
      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (sessionError) throw sessionError;
      
      if (sessionData) {
        setSessionId(sessionData.id);
        
        // Load messages from this session
        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionData.id)
          .order('timestamp', { ascending: true });
        
        if (messagesError) throw messagesError;
        
        if (messagesData && messagesData.length > 0) {
          const loadedMessages: Message[] = messagesData.map(msg => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            session_id: msg.session_id,
            user_id: msg.user_id
          }));
          
          setMessages(loadedMessages);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Don't show error to user - start fresh chat if loading fails
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Function to clear chat history
  const clearChatHistory = async (): Promise<void> => {
    if (!userId || !sessionId) return;
    
    try {
      // Delete all messages from current session
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', sessionId);
      
      if (error) throw error;
      
      // Clear local messages
      setMessages([]);
      
      toast.success('Histórico de chat limpo com sucesso!');
    } catch (error) {
      const errorInfo = getErrorMessage(error, {
        operation: 'limpar histórico',
        component: 'StudyRoom'
      });
      toast.error(errorInfo.title, {
        description: errorInfo.message
      });
    }
  };

  return (
    <div className="w-full">
      <SubscriptionGate feature="Sala de Estudos">
      <div className="min-h-svh bg-muted/30">

      {/* Conteúdo Principal */}
      <div className="mx-auto max-w-[1400px] w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <ModernCard 
          className={cn(
            "overflow-hidden",
            isMobile ? "flex flex-col min-h-[calc(100svh-140px)]" : "flex gap-4 min-h-[600px] h-[calc(100vh-140px)]"
          )}
          variant="elevated"
        >
          {isMobile ? (
            <>
              <div className="flex gap-2 p-3 border-b">
                <ModernButton 
                  variant={activeTab === 'pdf' ? 'default' : 'outline'} 
                  className="flex-1 h-12" 
                  onClick={() => setActiveTab('pdf')}
                  size="lg"
                >
                  PDF
                </ModernButton>
                <ModernButton 
                  variant={activeTab === 'chat' ? 'default' : 'outline'} 
                  className="flex-1 h-12" 
                  onClick={() => setActiveTab('chat')}
                  size="lg"
                >
                  Chat
                </ModernButton>
              </div>
              {activeTab === 'pdf' ? (
                <div className="w-full flex-1">
                  <object data={mobilePdfFile} type="application/pdf" className="w-full h-[80vh]">
                    <embed src={mobilePdfFile} type="application/pdf" className="w-full h-full" />
                    <div className="p-4 text-sm text-muted-foreground">
                      Não foi possível exibir o PDF inline neste navegador.
                      <a href={mobilePdfFile} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary underline">Abrir em nova guia</a>
                    </div>
                  </object>
                </div>
              ) : (
                <div className="flex flex-col bg-background w-full flex-1">
                  <div className="border-b border-border">
                    <div className="flex items-center justify-between p-3">
                      <h3 className="text-sm font-semibold text-muted-foreground">Chat com IA</h3>
                      {messages.length > 0 && (
                        <ModernButton 
                          variant="ghost" 
                          size="sm" 
                          onClick={clearChatHistory} 
                          className="h-8 px-2 text-muted-foreground hover:text-foreground" 
                          title="Limpar histórico do chat"
                        >
                          <Trash2 className="h-4 w-4" />
                        </ModernButton>
                      )}
                    </div>
                    <QuickActions onQuickAction={handleQuickAction} className="border-t border-border" />
                  </div>
                  <ScrollArea className="flex-1 p-3 study-room-scrollbar">
                    <div className="space-y-3">
                      {isLoadingHistory ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <div className="text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                            <p className="text-sm">Carregando histórico...</p>
                          </div>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <p className="text-sm">Faça uma pergunta para começar</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}> 
                            <div className={cn("max-w-[85%] rounded-lg px-3 py-2", message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}> 
                              <p className="text-xs whitespace-pre-wrap break-words">{message.content}</p>
                              <p className="text-[10px] opacity-70 mt-1">{message.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                  <div className="border-t border-border p-3 bg-background pb-safe">
                    <div className="flex gap-2">
                      <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={handleKeyPress} placeholder="Digite sua pergunta..." className="flex-1 text-sm" />
                      <ModernButton 
                        onClick={handleSendMessage} 
                        disabled={!inputValue.trim() || isLoading} 
                        className="bg-primary hover:bg-primary/90 shrink-0 h-12"
                        size="lg"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </ModernButton>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <PDFViewer ref={pdfViewerRef} className={cn("study-room-scrollbar w-1/2 border-r")} />
              <div className="flex flex-col bg-background w-1/2">
                <div className="border-b border-border">
                  <div className="flex items-center justify-between p-4">
                    <h3 className="text-sm font-semibold text-muted-foreground">Chat com IA</h3>
                    {messages.length > 0 && (
                      <ModernButton 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearChatHistory} 
                        className="h-8 px-2 text-muted-foreground hover:text-foreground" 
                        title="Limpar histórico do chat"
                      >
                        <Trash2 className="h-4 w-4" />
                      </ModernButton>
                    )}
                  </div>
                  <QuickActions onQuickAction={handleQuickAction} className="border-t border-border" />
                </div>
                <ScrollArea className="flex-1 p-4 study-room-scrollbar">
                  <div className="space-y-4">
                    {isLoadingHistory ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                          <p className="text-sm">Carregando histórico...</p>
                        </div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p className="text-base">Faça uma pergunta para começar</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}> 
                          <div className={cn("max-w-[80%] rounded-lg px-4 py-2", message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}> 
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
                <div className="border-t border-border p-4 bg-background">
                  <div className="flex gap-2">
                    <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={handleKeyPress} placeholder="Digite sua pergunta..." className="flex-1" />
                    <ModernButton 
                      onClick={handleSendMessage} 
                      disabled={!inputValue.trim() || isLoading} 
                      className="bg-primary hover:bg-primary/90 shrink-0 h-12"
                      size="lg"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </ModernButton>
                  </div>
                </div>
              </div>
            </>
          )}
        </ModernCard>
      </div>
      
      {/* Tooltip de seleção de texto */}
      <TextSelectionTooltip onExplain={handleTextExplanation} />
    </div>
    </SubscriptionGate>
    </div>
  );
}
class MobileReaderErrorBoundary extends React.Component<{ onError?: (error: Error) => void; fallback: React.ReactNode; children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { onError?: (error: Error) => void; fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
