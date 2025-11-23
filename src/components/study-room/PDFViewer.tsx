import { useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

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

      </div>

      {/* Área de visualização do PDF */}
      <div className="flex-1 overflow-auto flex items-start justify-center bg-muted/5">
        {file ? (
          <iframe
            src={file}
            className="w-full h-full border-0"
            title="PDF Viewer"
          />
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