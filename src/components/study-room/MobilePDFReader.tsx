import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Viewer, SpecialZoomLevel } from "@react-pdf-viewer/core";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { scrollModePlugin, ScrollMode } from "@react-pdf-viewer/scroll-mode";
import type { CharacterMap } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";

export interface MobilePDFReaderHandle {
  getCurrentFile: () => string | null;
  getCurrentPage: () => number;
}

interface MobilePDFReaderProps {
  fileUrl: string | null;
  className?: string;
}

const characterMap: CharacterMap = {
  isCompressed: true,
  url: "https://unpkg.com/pdfjs-dist@3.11.174/cmaps/",
};

export const MobilePDFReader = forwardRef<MobilePDFReaderHandle, MobilePDFReaderProps>(({ fileUrl, className }, ref) => {
  const [currentPage, setCurrentPage] = useState(0);
  const zoom = zoomPlugin();
  const scrollMode = scrollModePlugin();
  const fileRef = useRef<string | null>(fileUrl);

  useImperativeHandle(ref, () => ({
    getCurrentFile: () => fileRef.current,
    getCurrentPage: () => currentPage + 1,
  }));

  return (
    <div className={className}>
      {fileUrl ? (
        <Viewer
          fileUrl={fileUrl}
          defaultScale={SpecialZoomLevel.PageWidth}
          characterMap={characterMap}
          scrollMode={ScrollMode.Vertical}
          plugins={[zoom, scrollMode]}
          onPageChange={(e) => setCurrentPage(e.currentPage)}
          renderLoader={() => (
            <div className="p-8 text-center text-muted-foreground">Carregando PDF…</div>
          )}
          renderError={(err) => (
            <div className="p-8 text-center text-destructive">Erro ao abrir PDF: {err.message}</div>
          )}
        />
      ) : (
        <div className="p-8 text-center text-muted-foreground">Nenhum PDF carregado</div>
      )}
    </div>
  );
});

export default MobilePDFReader;