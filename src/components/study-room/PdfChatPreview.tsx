import React, { useRef, useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { ModernButton } from "@/components/ui/modern-button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuickActions } from "@/components/study-room/QuickActions";
import { PDFViewer } from "@/components/study-room/PDFViewer";

interface PdfChatPreviewProps {
    pdfUrl?: string;
    messages: any[];
    isLoading: boolean;
    isLoadingHistory: boolean;
    inputValue: string;
    setInputValue: (value: string) => void;
    handleSendMessage: () => void;
    handleKeyPress: (e: React.KeyboardEvent) => void;
    handleQuickAction: (prompt: string) => void;
    clearChatHistory: () => void;
    pdfViewerRef: any;
    isMobile: boolean;
    activeTab: 'pdf' | 'chat';
    setActiveTab: (tab: 'pdf' | 'chat') => void;
}

export default function PdfChatPreview({
    pdfUrl = '/materiais/MANUAL-OBTENCAO_2025.pdf',
    messages,
    isLoading,
    isLoadingHistory,
    inputValue,
    setInputValue,
    handleSendMessage,
    handleKeyPress,
    handleQuickAction,
    clearChatHistory,
    pdfViewerRef,
    isMobile,
    activeTab,
    setActiveTab
}: PdfChatPreviewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const leftRef = useRef<HTMLDivElement>(null);
    const rightRef = useRef<HTMLDivElement>(null);
    const resizerRef = useRef<HTMLDivElement>(null);
    const [leftWidth, setLeftWidth] = useState(50); // percent
    const [isDragging, setIsDragging] = useState(false);

    // DRAG RESIZER
    useEffect(() => {
        const onMove = (e: MouseEvent | TouchEvent) => {
            if (!isDragging || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            // support touch and mouse
            const clientX = (e as TouchEvent).touches ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
            let pct = ((clientX - rect.left) / rect.width) * 100;
            if (pct < 30) pct = 30;
            if (pct > 70) pct = 70;
            setLeftWidth(pct);
        };
        const onUp = () => setIsDragging(false);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchend', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('mouseup', onUp);
            window.removeEventListener('touchend', onUp);
        };
    }, [isDragging]);

    // Prevent accidental hover/shift effects coming from embedded PDF or other elements
    // We apply a strictly controlled layout and disable transitions on child elements.
    useEffect(() => {
        const el = containerRef.current;
        if (el) {
            el.classList.add('no-hover-transforms');
        }
        return () => {
            if (el) {
                el.classList.remove('no-hover-transforms');
            }
        };
    }, []);

    return (
        <div className="h-[calc(100svh-80px)] p-2 sm:p-4 bg-gray-50 dark:bg-background overflow-x-hidden">
            <div className="max-w-[1600px] mx-auto h-full shadow-sm rounded-lg overflow-hidden bg-white dark:bg-card border dark:border-border flex flex-col" ref={containerRef}>
                {/* Header */}
                <header className="flex items-center justify-between px-4 py-3 border-b bg-white dark:bg-card shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-md text-sm bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-medium">Sala de Estudos</span>
                        <h1 className="text-lg font-semibold hidden sm:block">Manual de Obtenção da CNH</h1>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-muted-foreground hidden sm:block">Arraste o separador para ajustar o layout</div>
                </header>

                {/* Mobile Tabs */}
                {isMobile && (
                    <div className="flex gap-2 p-2 border-b bg-white dark:bg-card shrink-0">
                        <ModernButton
                            variant={activeTab === 'pdf' ? 'default' : 'outline'}
                            className="flex-1 h-10"
                            onClick={() => setActiveTab('pdf')}
                            size="sm"
                        >
                            PDF
                        </ModernButton>
                        <ModernButton
                            variant={activeTab === 'chat' ? 'default' : 'outline'}
                            className="flex-1 h-10"
                            onClick={() => setActiveTab('chat')}
                            size="sm"
                        >
                            Chat
                        </ModernButton>
                    </div>
                )}

                {/* Main content: left PDF, resizer, right chat */}
                <div className="flex flex-1 relative overflow-hidden">
                    {/* Left: PDF viewer */}
                    <div
                        ref={leftRef}
                        style={{ width: isMobile ? '100%' : `${leftWidth}%`, display: isMobile && activeTab !== 'pdf' ? 'none' : 'block' }}
                        className="pdf-panel relative h-full overflow-hidden border-r bg-white dark:bg-card"
                        // stop text selection when resizing
                        onMouseDown={(e) => { if (isDragging) e.preventDefault(); }}
                    >
                        <div className="h-full bg-gray-50 dark:bg-muted/30">
                            {/* PDF Viewer Component */}
                            <PDFViewer ref={pdfViewerRef} className="w-full h-full border-none rounded-none" />
                        </div>
                    </div>

                    {/* Resizer (Desktop only) */}
                    {!isMobile && (
                        <div
                            ref={resizerRef}
                            onMouseDown={() => setIsDragging(true)}
                            onTouchStart={() => setIsDragging(true)}
                            className={`resizer z-20 flex items-center justify-center cursor-col-resize select-none bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-3 -ml-1.5 h-full absolute`}
                            style={{ left: `${leftWidth}%` }}
                        >
                            <div className={`w-[4px] h-16 bg-gray-300 dark:bg-gray-600 rounded-full ${isDragging ? 'bg-indigo-500 dark:bg-indigo-400' : ''}`}></div>
                        </div>
                    )}

                    {/* Right: Chat panel */}
                    <div
                        ref={rightRef}
                        style={{ width: isMobile ? '100%' : `${100 - leftWidth}%`, display: isMobile && activeTab !== 'chat' ? 'none' : 'flex' }}
                        className="chat-panel flex-col h-full bg-white dark:bg-card w-full"
                    >
                        <div className="flex flex-col h-full">
                            {/* Quick action buttons */}
                            <div className="border-b dark:border-border shrink-0">
                                <div className="flex items-center justify-between px-4 pt-3 pb-1">
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
                                <QuickActions onQuickAction={handleQuickAction} className="border-none" />
                            </div>

                            {/* Chat messages */}
                            <ScrollArea className="flex-1 p-4 study-room-scrollbar">
                                <div className="space-y-4 pb-4">
                                    {isLoadingHistory ? (
                                        <div className="flex items-center justify-center h-full text-muted-foreground py-10">
                                            <div className="text-center">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                                <p className="text-sm">Carregando histórico...</p>
                                            </div>
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10 opacity-70">
                                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                                <Send className="w-8 h-8 text-muted-foreground/50" />
                                            </div>
                                            <p className="text-base font-medium">Faça uma pergunta para começar</p>
                                            <p className="text-sm">A IA responderá com base no manual</p>
                                        </div>
                                    ) : (
                                        messages.map((message) => (
                                            <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                                                <div className={cn("max-w-[85%] rounded-2xl px-5 py-3 shadow-sm", message.role === "user" ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted/50 text-foreground border border-border/50 rounded-bl-none")}>
                                                    {message.role === "assistant" ? (
                                                        <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                                                            <ReactMarkdown>{message.content}</ReactMarkdown>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                                    )}
                                                    <p className="text-[10px] opacity-70 mt-1.5 text-right">{message.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-muted/50 text-foreground border border-border/50 rounded-2xl rounded-bl-none px-5 py-3 shadow-sm flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span className="text-sm">Digitando...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            {/* Chat input */}
                            <div className="p-4 bg-white dark:bg-card border-t dark:border-border shrink-0">
                                <div className="flex gap-2">
                                    <Input
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Digite sua pergunta sobre o manual..."
                                        className="flex-1 h-12 rounded-xl border-gray-200 dark:border-gray-800 focus-visible:ring-indigo-500"
                                    />
                                    <ModernButton
                                        onClick={handleSendMessage}
                                        disabled={!inputValue.trim() || isLoading}
                                        className="bg-primary hover:bg-primary/90 shrink-0 h-12 w-12 rounded-xl p-0"
                                        size="lg"
                                    >
                                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                    </ModernButton>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Inline styles to block unwanted hover transforms on children and to ensure layout stability */}
            <style>{`
        /* Disable transform/transition effects inside the container to avoid the "block moves when hover" bug */
        .no-hover-transforms * {
          transition: none !important;
          transform: none !important;
        }

        /* Make sure the resizer is easy to hit on small screens */
        .resizer { display: flex; align-items: center; justify-content: center; }

        /* Prevent iframe from shifting layout during hover */
        .pdf-panel iframe { pointer-events: auto; }

        /* Responsive: stack panels on small screens */
        @media (max-width: 900px) {
          .pdf-panel { width: 100% !important; }
          .chat-panel { width: 100% !important; }
          .resizer { display: none; }
        }
      `}</style>
        </div>
    );
}
