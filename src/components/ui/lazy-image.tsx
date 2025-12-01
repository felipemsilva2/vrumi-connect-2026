import React, { useState } from 'react';
import { cn } from "@/lib/utils";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    placeholder?: string;
}

export function LazyImage({ src, alt, className, placeholder, ...props }: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    return (
        <div className={cn("relative overflow-hidden", className)}>
            {!isLoaded && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
                    {placeholder ? (
                        <img
                            src={placeholder}
                            alt="Loading..."
                            className="w-full h-full object-cover opacity-50 blur-sm"
                        />
                    ) : (
                        <span className="sr-only">Loading...</span>
                    )}
                </div>
            )}
            <img
                src={src}
                alt={alt}
                className={cn(
                    "w-full h-full object-cover transition-opacity duration-500",
                    isLoaded ? "opacity-100" : "opacity-0",
                    className
                )}
                onLoad={() => setIsLoaded(true)}
                onError={() => setHasError(true)}
                {...props}
            />
            {hasError && placeholder && (
                <img
                    src={placeholder}
                    alt={alt}
                    className={cn("absolute inset-0 w-full h-full object-cover", className)}
                />
            )}
        </div>
    );
}
