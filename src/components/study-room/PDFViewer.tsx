import { forwardRef, useImperativeHandle, useState } from "react";

interface PDFViewerProps {
  className?: string;
}

export interface PDFViewerHandle {
  getCurrentFile: () => string | null;
  getCurrentPage: () => number;
}

export const PDFViewer = forwardRef<PDFViewerHandle, PDFViewerProps>(({ className }, ref) => {
  const pdfFile = "/materiais/MANUAL-OBTENCAO_2025.pdf";

  const [shouldLoad, setShouldLoad] = useState(false);

  useImperativeHandle(ref, () => ({
    getCurrentFile: () => pdfFile,
    getCurrentPage: () => 1, // Page tracking não disponível com object/embed
  }));

  if (!shouldLoad) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-muted/30 border-2 border-dashed border-border rounded-xl p-8`}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8 text-primary"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Manual de Obtenção da CNH
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
              Clique abaixo para carregar o visualizador de PDF. O arquivo pode levar alguns instantes para abrir.
            </p>
          </div>
          <button
            onClick={() => setShouldLoad(true)}
            className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            Carregar Manual (PDF)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <object data={pdfFile} type="application/pdf" className="w-full h-full rounded-xl overflow-hidden border border-border bg-white">
        <embed src={pdfFile} type="application/pdf" className="w-full h-full" />
        <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full gap-4">
          <p>Não foi possível exibir o PDF inline neste navegador.</p>
          <a
            href={pdfFile}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            Abrir em nova guia
          </a>
        </div>
      </object>
    </div>
  );
});
