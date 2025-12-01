import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useContextualNavigation } from "@/utils/navigation";
import { SubscriptionGate } from "@/components/auth/SubscriptionGate";
import PdfChatPreview from "@/components/study-room/PdfChatPreview";
import { TextSelectionTooltip } from "@/components/study-room/TextSelectionTooltip";
import { getErrorMessage } from "@/utils/errorMessages";
import { FeatureExplanationButton } from "@/components/ui/feature-explanation-button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  session_id?: string;
  user_id?: string;
}

export default function StudyRoom() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'pdf' | 'chat'>('pdf');
  const navigate = useNavigate();
  const homeRoute = useContextualNavigation();
  const pdfViewerRef = useRef<{ getCurrentFile: () => string | null; getCurrentPage: () => number; getPageText: () => string }>(null);
  const mobilePdfFile = "/materiais/MANUAL-OBTENCAO_2025.pdf";

  // Simplified - chat works without automatic PDF context extraction
  // Users can reference their PDF viewing manually

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
      // Note: PDF context extraction simplified - users can reference content manually
      const currentFile = pdfViewerRef.current?.getCurrentFile() || (isMobile ? mobilePdfFile : null);
      const currentPage = pdfViewerRef.current?.getCurrentPage() || 1;
      const pageText = pdfViewerRef.current?.getPageText ? pdfViewerRef.current.getPageText() : "";

      const pdfContext = currentFile
        ? `O usuário está visualizando o PDF "${currentFile}" na página ${currentPage}.\n\nCONTEÚDO DA PÁGINA:\n${pageText}`
        : "Nenhum PDF carregado.";

      // Chamar edge function
      const { data, error } = await supabase.functions.invoke("study-chat", {
        body: {
          message: userMessage.content,
          pdfContext: pdfContext,
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

      toast({
        variant: "destructive",
        title: errorInfo.title,
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
      const syntheticEvent = { preventDefault: () => { } } as React.FormEvent;
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

      toast({
        title: 'Sucesso',
        description: 'Histórico de chat limpo com sucesso!',
      });
    } catch (error) {
      const errorInfo = getErrorMessage(error, {
        operation: 'limpar histórico',
        component: 'StudyRoom'
      });
      toast({
        variant: "destructive",
        title: errorInfo.title,
        description: errorInfo.message
      });
    }
  };

  return (
    <div className="w-full">
      <SubscriptionGate feature="Sala de Estudos">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Sala de Estudos</h1>
            <FeatureExplanationButton
              title="Sala de Estudos"
              description="Aqui você pode estudar com materiais em PDF e tirar dúvidas com a IA. Selecione um texto para pedir explicação ou use o chat para perguntas gerais."
            />
          </div>
        </div>
        <PdfChatPreview
          messages={messages}
          isLoading={isLoading}
          isLoadingHistory={isLoadingHistory}
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleSendMessage={handleSendMessage}
          handleKeyPress={handleKeyPress}
          handleQuickAction={handleQuickAction}
          clearChatHistory={clearChatHistory}
          pdfViewerRef={pdfViewerRef}
          isMobile={isMobile}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <TextSelectionTooltip onExplain={handleTextExplanation} />
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
