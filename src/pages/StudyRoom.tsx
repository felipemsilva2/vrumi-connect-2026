import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { PDFViewer } from "@/components/study-room/PDFViewer";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function StudyRoom() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");

    // Placeholder: Simular resposta da IA
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Esta é uma resposta de exemplo. A IA será implementada em breve.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] py-6 px-5">
      <div className="mx-auto max-w-[1200px] w-full">
        <div className="flex gap-5 min-h-[600px] h-[calc(100vh-100px)] rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden bg-background">
          {/* Lado Esquerdo - Visualizador de PDF */}
          <PDFViewer className="w-1/2 study-room-scrollbar" />

          {/* Lado Direito - Chat com IA */}
          <div className="w-1/2 flex flex-col bg-background border-l border-border">
            {/* Área de mensagens */}
            <ScrollArea className="flex-1 p-4 study-room-scrollbar">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Faça uma pergunta para começar</p>
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
                          "max-w-[80%] rounded-lg px-4 py-2",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
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
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua pergunta..."
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
