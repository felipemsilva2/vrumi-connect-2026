import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-2xl border transition-all duration-300 overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground border-border shadow-sm hover:shadow-md",
        gradient: "bg-gradient-to-br from-card to-card/80 text-card-foreground border-border/50 shadow-lg hover:shadow-xl",
        glass: "bg-white/10 dark:bg-black/10 backdrop-blur-md text-card-foreground border-white/20 dark:border-white/10 shadow-lg hover:shadow-xl",
        elevated: "bg-card text-card-foreground border-border shadow-lg hover:shadow-2xl transition-transform hover:scale-[1.005]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof cardVariants> {
  hover?: boolean;
  interactive?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover = false, interactive = false, ...props }, ref) => {
    const hoverClasses = hover ? 'hover:shadow-lg hover:border-primary/20' : '';
    const interactiveClasses = interactive ? 'cursor-pointer transition-transform duration-300 hover:-translate-y-1' : '';

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant }),
          hoverClasses,
          interactiveClasses,
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  gradient?: boolean;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, gradient = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-1.5 p-6",
        gradient && 'bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-xl',
        className
      )}
      {...props}
    />
  ),
);
CardHeader.displayName = "CardHeader";

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  gradient?: boolean;
}

const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(
  ({ className, gradient = false, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-xl font-semibold leading-none tracking-tight",
        gradient && 'bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent',
        className
      )}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  gradient?: boolean;
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, gradient = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center p-6 pt-0",
        gradient && 'bg-gradient-to-r from-primary/5 to-primary/10 rounded-b-xl',
        className
      )}
      {...props}
    />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
