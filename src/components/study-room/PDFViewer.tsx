import { forwardRef, useImperativeHandle } from "react";

interface PDFViewerProps {
  className?: string;
}

export interface PDFViewerHandle {
  getCurrentFile: () => string | null;
  getCurrentPage: () => number;
}

export const PDFViewer = forwardRef<PDFViewerHandle, PDFViewerProps>(({ className }, ref) => {
  const pdfFile = "/materiais/MANUAL-OBTENCAO_2025.pdf";

  useImperativeHandle(ref, () => ({
    getCurrentFile: () => pdfFile,
    getCurrentPage: () => 1, // Page tracking não disponível com object/embed
  }));

  return (
    <div className={className}>
      <object data={pdfFile} type="application/pdf" className="w-full h-full">
        <embed src={pdfFile} type="application/pdf" className="w-full h-full" />
        <div className="p-4 text-sm text-muted-foreground">
          Não foi possível exibir o PDF inline neste navegador.
          <a href={pdfFile} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary underline">
            Abrir em nova guia
          </a>
        </div>
      </object>
    </div>
  );
});
