import { useState } from "react";
import { ImageOff } from "lucide-react";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  onClick?: () => void;
}

export const ImageWithFallback = ({
  src,
  alt,
  className = "",
  fallbackClassName = "",
  onClick,
}: ImageWithFallbackProps) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-muted rounded-lg ${fallbackClassName}`}
      >
        <div className="text-center p-4">
          <ImageOff className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Imagem não disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`absolute inset-0 bg-muted animate-pulse rounded-lg ${className}`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        onError={() => setImageError(true)}
        onLoad={() => setIsLoading(false)}
        onClick={onClick}
        loading="lazy"
      />
    </div>
  );
};
