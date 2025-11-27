import { forwardRef, useImperativeHandle, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PDFViewerProps {
  className?: string;
}

export interface PDFViewerHandle {
  getCurrentFile: () => string | null;
  getCurrentPage: () => number;
}

export const PDFViewer = forwardRef<PDFViewerHandle, PDFViewerProps>(({ className }, ref) => {
  const pdfFile = "/materiais/MANUAL-OBTENCAO_2025.pdf";
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [pageText, setPageText] = useState<string>("");

  useImperativeHandle(ref, () => ({
    getCurrentFile: () => pdfFile,
    getCurrentPage: () => pageNumber,
    getPageText: () => pageText,
  }), [pageNumber, pageText]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPage = prevPageNumber + offset;
      return Math.max(1, Math.min(newPage, numPages));
    });
  };

  const changeScale = (delta: number) => {
    setScale(prevScale => Math.max(0.5, Math.min(prevScale + delta, 2.5)));
  };

  if (!shouldLoad) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-muted/30 border-2 border-dashed border-border rounded-xl p-8", className)}>
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
              Clique abaixo para carregar o visualizador de PDF.
            </p>
          </div>
          <Button
            onClick={() => setShouldLoad(true)}
            className="bg-primary hover:bg-primary/90"
          >
            Carregar Manual (PDF)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-background border rounded-xl overflow-hidden", className)}>
      <div className="flex items-center justify-between p-2 border-b bg-muted/30">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[80px] text-center">
            {pageNumber} / {numPages || '--'}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => changeScale(-0.1)} className="h-8 w-8">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={() => changeScale(0.1)} className="h-8 w-8">
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-100/50 dark:bg-gray-900/50 p-4 flex justify-center">
        <Document
          file={pdfFile}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
          error={
            <div className="flex items-center justify-center h-full text-red-500">
              Erro ao carregar PDF.
            </div>
          }
          className="max-w-full"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-lg bg-white"
            width={window.innerWidth < 768 ? window.innerWidth - 48 : undefined}
            onLoadSuccess={async (page) => {
              const textContent = await page.getTextContent();
              const text = textContent.items.map((item: any) => item.str).join(' ');
              setPageText(text);
            }}
          />
        </Document>
      </div>
    </div>
  );
});
