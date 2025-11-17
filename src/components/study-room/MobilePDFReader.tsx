import { useState } from "react";
import { Viewer, SpecialZoomLevel } from "@react-pdf-viewer/core";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import type { CharacterMap } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/zoom/lib/styles/index.css";

interface MobilePDFReaderProps {
  fileUrl: string | null;
  className?: string;
  onPageChange?: (page: number) => void;
}

const characterMap: CharacterMap = {
  isCompressed: true,
  url: "https://unpkg.com/pdfjs-dist@3.11.174/cmaps/",
};

export const MobilePDFReader = ({ fileUrl, className, onPageChange }: MobilePDFReaderProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const zoom = zoomPlugin();
  

  return (
    <div className={className}>
      {fileUrl ? (
        <Viewer
          fileUrl={fileUrl}
          defaultScale={SpecialZoomLevel.PageWidth}
          characterMap={characterMap}
          transformGetDocumentParams={(options) => ({
            ...options,
            cMapUrl: characterMap.url,
            cMapPacked: characterMap.isCompressed,
          })}
          plugins={[zoom]}
          onPageChange={(e) => {
            setCurrentPage(e.currentPage);
            onPageChange?.(e.currentPage + 1);
          }}
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
};

export default MobilePDFReader;