import React from 'react';
import { cn } from '@/lib/utils';

interface ModernCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'glass' | 'elevated';
  hover?: boolean;
  interactive?: boolean;
}

const ModernCard = React.forwardRef<HTMLDivElement, ModernCardProps>(
  ({ className, variant = 'default', hover = true, interactive = false, children, ...props }, ref) => {
    const baseClasses = 'rounded-2xl border transition-all duration-300';

    const variantClasses = {
      default: 'bg-card text-card-foreground border-border shadow-sm hover:shadow-md',
      gradient: 'bg-gradient-to-br from-card to-card/80 text-card-foreground border-border/50 shadow-lg hover:shadow-xl',
      glass: 'bg-white/10 dark:bg-black/10 backdrop-blur-md text-card-foreground border-white/20 dark:border-white/10 shadow-lg hover:shadow-xl',
      elevated: 'bg-card text-card-foreground border-border shadow-lg hover:shadow-2xl transition-transform hover:scale-[1.005]',
    };

    const hoverClasses = hover ? 'hover:shadow-lg hover:border-primary/20' : '';
    const interactiveClasses = interactive ? 'cursor-pointer transform hover:scale-[1.02]' : '';

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          hoverClasses,
          interactiveClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ModernCard.displayName = 'ModernCard';

interface ModernCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  gradient?: boolean;
}

const ModernCardHeader = React.forwardRef<HTMLDivElement, ModernCardHeaderProps>(
  ({ className, gradient = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col space-y-1.5 p-6',
          gradient && 'bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-xl',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ModernCardHeader.displayName = 'ModernCardHeader';

interface ModernCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  gradient?: boolean;
}

const ModernCardTitle = React.forwardRef<HTMLParagraphElement, ModernCardTitleProps>(
  ({ className, gradient = false, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn(
          'text-xl font-semibold leading-none tracking-tight',
          gradient && 'bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent',
          className
        )}
        {...props}
      >
        {children}
      </h3>
    );
  }
);
ModernCardTitle.displayName = 'ModernCardTitle';

interface ModernCardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> { }

const ModernCardDescription = React.forwardRef<HTMLParagraphElement, ModernCardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);
ModernCardDescription.displayName = 'ModernCardDescription';

interface ModernCardContentProps extends React.HTMLAttributes<HTMLDivElement> { }

const ModernCardContent = React.forwardRef<HTMLDivElement, ModernCardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('p-6 pt-0', className)} {...props}>
        {children}
      </div>
    );
  }
);
ModernCardContent.displayName = 'ModernCardContent';

interface ModernCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  gradient?: boolean;
}

const ModernCardFooter = React.forwardRef<HTMLDivElement, ModernCardFooterProps>(
  ({ className, gradient = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center p-6 pt-0',
          gradient && 'bg-gradient-to-r from-primary/5 to-primary/10 rounded-b-xl',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ModernCardFooter.displayName = 'ModernCardFooter';

export {
  ModernCard,
  ModernCardHeader,
  ModernCardFooter,
  ModernCardTitle,
  ModernCardDescription,
  ModernCardContent,
};