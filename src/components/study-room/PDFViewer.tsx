import { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { Viewer, Worker, SpecialZoomLevel } from "@react-pdf-viewer/core";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Upload, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/zoom/lib/styles/index.css";

interface PDFViewerProps {
  className?: string;
}

export interface PDFViewerHandle {
  getCurrentFile: () => string | null;
  getCurrentPage: () => number;
}

export const PDFViewer = forwardRef<PDFViewerHandle, PDFViewerProps>(({ className }, ref) => {
  const [file, setFile] = useState<string | null>("/materiais/MANUAL-OBTENCAO_2025.pdf");
  const [pageNumber, setPageNumber] = useState<number>(1);
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomPluginInstance = zoomPlugin();
  const { ZoomIn: ZoomInButton, ZoomOut: ZoomOutButton } = zoomPluginInstance;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      const fileUrl = URL.createObjectURL(uploadedFile);
      setFile(fileUrl);
      toast.info("Carregando PDF...");
    }
  };

  useImperativeHandle(ref, () => ({
    getCurrentFile: () => file,
    getCurrentPage: () => pageNumber,
  }));

  return (
    <div className={cn("flex flex-col h-full bg-background pb-safe", className)}>
      {/* Barra de ferramentas */}
      <div className={cn(
        "flex items-center gap-2 p-2 sm:p-3 border-b border-border bg-background/95 backdrop-blur",
        isMobile ? "justify-between flex-wrap" : "justify-between"
      )}>
        <div className="flex items-center gap-1 sm:gap-2">
          <label htmlFor="pdf-upload">
            <Button variant="outline" size={isMobile ? "sm" : "sm"} className={isMobile ? "h-12" : ""} asChild>
              <span className="cursor-pointer">
                <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                {!isMobile && <span className="ml-2">Upload</span>}
              </span>
            </Button>
          </label>
          <input
            id="pdf-upload"
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {file && (
          <div className="flex items-center gap-1 sm:gap-2">
            <ZoomOutButton>
              {(props: any) => (
                <Button variant="outline" size="sm" onClick={props.onClick} className={isMobile ? "h-12 w-12" : ""}>
                  <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              )}
            </ZoomOutButton>
            <ZoomInButton>
              {(props: any) => (
                <Button variant="outline" size="sm" onClick={props.onClick} className={isMobile ? "h-12 w-12" : ""}>
                  <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              )}
            </ZoomInButton>
          </div>
        )}
      </div>

      {/* Área de visualização do PDF */}
      <div ref={containerRef} className="flex-1 overflow-auto flex items-start justify-center p-4 bg-muted/5 study-room-scrollbar">
        {file ? (
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <div className="w-full h-full">
              <Viewer
                fileUrl={file}
                plugins={[zoomPluginInstance]}
                defaultScale={isMobile ? SpecialZoomLevel.PageWidth : SpecialZoomLevel.PageFit}
                onDocumentLoad={(e) => {
                  toast.success(`PDF carregado: ${e.doc.numPages} páginas`);
                }}
              />
            </div>
          </Worker>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <FileText className="h-16 w-16 mb-4" />
            <p className="text-lg font-medium mb-2">Nenhum PDF carregado</p>
            <p className="text-sm">Faça upload de um PDF para começar</p>
          </div>
        )}
      </div>
    </div>
  );
});