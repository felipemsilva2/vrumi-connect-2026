import { useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Upload, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  className?: string;
}

export interface PDFViewerHandle {
  getCurrentFile: () => string | null;
  getCurrentPage: () => number;
}

export const PDFViewer = forwardRef<PDFViewerHandle, PDFViewerProps>(({ className }, ref) => {
  const [file, setFile] = useState<string | null>("/materiais/MANUAL-OBTENCAO_2025.pdf");
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const isMobile = useIsMobile();

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    toast.success(`PDF carregado: ${numPages} páginas`);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error("Erro ao carregar PDF:", error);
    toast.error("Erro ao carregar o PDF");
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      const fileUrl = URL.createObjectURL(uploadedFile);
      setFile(fileUrl);
      toast.info("Carregando PDF...");
    }
  }, []);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3.0));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));
  const handlePreviousPage = () => setPageNumber((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setPageNumber((prev) => Math.min(prev + 1, numPages));

  useImperativeHandle(ref, () => ({
    getCurrentFile: () => file,
    getCurrentPage: () => pageNumber,
  }));

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Barra de ferramentas */}
      <div className={cn(
        "flex items-center gap-2 p-2 sm:p-3 border-b border-border bg-background/95 backdrop-blur",
        isMobile ? "justify-between flex-wrap" : "justify-between"
      )}>
        <div className="flex items-center gap-1 sm:gap-2">
          <label htmlFor="pdf-upload">
            <Button variant="outline" size={isMobile ? "sm" : "sm"} asChild>
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
          <>
            {/* Controles de navegação */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={pageNumber <= 1}
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <span className="text-xs sm:text-sm font-medium min-w-[60px] sm:min-w-[80px] text-center">
                {pageNumber} / {numPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={pageNumber >= numPages}
              >
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>

            {/* Controles de zoom */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={scale <= 0.5}>
                <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <span className="text-xs sm:text-sm font-medium min-w-[45px] sm:min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={scale >= 3.0}>
                <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Área de visualização do PDF */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-4 bg-muted/5 study-room-scrollbar">
        {file ? (
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
                  <p className="text-muted-foreground">Carregando PDF...</p>
                </div>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              loading={
                <div className="flex items-center justify-center p-8 bg-background rounded-lg border border-border">
                  <p className="text-muted-foreground">Carregando página...</p>
                </div>
              }
              className="shadow-lg"
            />
          </Document>
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
