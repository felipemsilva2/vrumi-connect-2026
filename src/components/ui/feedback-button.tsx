import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2, Check, X } from "lucide-react";
import { useVisualFeedback } from "@/hooks/useVisualFeedback";

interface FeedbackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClickAction?: () => Promise<any>;
  successMessage?: string;
  errorMessage?: string;
  loadingMessage?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
}

export const FeedbackButton = React.forwardRef<HTMLButtonElement, FeedbackButtonProps>(
  ({ 
    onClickAction, 
    successMessage,
    errorMessage,
    loadingMessage,
    variant = 'default',
    size = 'default',
    className,
    children,
    onClick,
    ...props 
  }, ref) => {
    const feedback = useVisualFeedback({
      successMessage,
      errorMessage,
      loadingMessage,
    });

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        onClick(e);
      }
      
      if (onClickAction) {
        await feedback.execute(onClickAction);
      }
    };

    const getButtonContent = () => {
      if (feedback.isLoading) {
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingMessage || children}
          </>
        );
      }
      
      if (feedback.isSuccess) {
        return (
          <>
            <Check className="mr-2 h-4 w-4" />
            Sucesso!
          </>
        );
      }
      
      if (feedback.isError) {
        return (
          <>
            <X className="mr-2 h-4 w-4" />
            Erro
          </>
        );
      }
      
      return children;
    };

    const getVariant = () => {
      if (feedback.isSuccess) return 'default';
      if (feedback.isError) return 'destructive';
      return variant;
    };

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            'bg-primary text-primary-foreground hover:bg-primary/90': getVariant() === 'default',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90': getVariant() === 'destructive',
            'border border-input bg-background hover:bg-accent hover:text-accent-foreground': getVariant() === 'outline',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80': getVariant() === 'secondary',
            'hover:bg-accent hover:text-accent-foreground': getVariant() === 'ghost',
            'text-primary underline-offset-4 hover:underline': getVariant() === 'link',
            'h-10 px-4 py-2': size === 'default',
            'h-9 rounded-md px-3': size === 'sm',
            'h-11 rounded-md px-8': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        ref={ref}
        onClick={handleClick}
        disabled={feedback.isLoading || props.disabled}
        {...props}
      >
        {getButtonContent()}
      </button>
    );
  }
);

FeedbackButton.displayName = "FeedbackButton";