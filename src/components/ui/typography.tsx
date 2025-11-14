import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface TypographyProps {
  children: ReactNode;
  className?: string;
}

// Heading components with consistent hierarchy
export function Heading1({ children, className }: TypographyProps) {
  return (
    <h1 className={cn("text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight", className)}>
      {children}
    </h1>
  );
}

export function Heading2({ children, className }: TypographyProps) {
  return (
    <h2 className={cn("text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight", className)}>
      {children}
    </h2>
  );
}

export function Heading3({ children, className }: TypographyProps) {
  return (
    <h3 className={cn("text-2xl sm:text-3xl md:text-4xl font-semibold", className)}>
      {children}
    </h3>
  );
}

export function Heading4({ children, className }: TypographyProps) {
  return (
    <h4 className={cn("text-xl sm:text-2xl md:text-3xl font-medium", className)}>
      {children}
    </h4>
  );
}

export function Heading5({ children, className }: TypographyProps) {
  return (
    <h5 className={cn("text-lg sm:text-xl md:text-2xl font-medium", className)}>
      {children}
    </h5>
  );
}

export function Heading6({ children, className }: TypographyProps) {
  return (
    <h6 className={cn("text-base sm:text-lg md:text-xl font-medium", className)}>
      {children}
    </h6>
  );
}

// Body text components
export function BodyLarge({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-lg leading-relaxed", className)}>
      {children}
    </p>
  );
}

export function BodyMedium({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-base leading-relaxed", className)}>
      {children}
    </p>
  );
}

export function BodySmall({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-sm leading-relaxed", className)}>
      {children}
    </p>
  );
}

// Utility components
export function Caption({ children, className }: TypographyProps) {
  return (
    <span className={cn("text-xs text-muted-foreground", className)}>
      {children}
    </span>
  );
}

export function Lead({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-xl text-muted-foreground leading-relaxed", className)}>
      {children}
    </p>
  );
}

// Display text for hero sections
export function Display({ children, className, style }: TypographyProps & { style?: React.CSSProperties }) {
  return (
    <h1 className={cn("text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter", className)} style={style}>
      {children}
    </h1>
  );
}