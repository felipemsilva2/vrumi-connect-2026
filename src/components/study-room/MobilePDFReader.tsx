import { useState } from "react";

interface MobilePDFReaderProps {
  fileUrl: string | null;
  className?: string;
  onPageChange?: (page: number) => void;
}

export const MobilePDFReader = ({ fileUrl, className, onPageChange }: MobilePDFReaderProps) => {
  return (
    <div className={className}>
      {fileUrl ? (
        <iframe
          src={fileUrl}
          className="w-full h-full border-0"
          title="Mobile PDF Viewer"
        />
      ) : (
        <div className="p-8 text-center text-muted-foreground">Nenhum PDF carregado</div>
      )}
    </div>
  );
};

export default MobilePDFReader;
