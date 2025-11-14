import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseVisualFeedbackProps {
  successMessage?: string;
  errorMessage?: string;
  loadingMessage?: string;
}

interface FeedbackState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export function useVisualFeedback({
  successMessage = "Operação realizada com sucesso!",
  errorMessage = "Ocorreu um erro. Tente novamente.",
  loadingMessage = "Processando..."
}: UseVisualFeedbackProps = {}) {
  const [state, setState] = useState<FeedbackState>({
    isLoading: false,
    isSuccess: false,
    isError: false,
  });
  const { toast } = useToast();

  const execute = useCallback(async (operation: () => Promise<any>) => {
    setState({ isLoading: true, isSuccess: false, isError: false });
    
    try {
      const result = await operation();
      setState({ isLoading: false, isSuccess: true, isError: false });
      toast({
        title: successMessage,
        description: "Operação concluída com sucesso.",
        variant: "default",
      });
      return result;
    } catch (error) {
      setState({ isLoading: false, isSuccess: false, isError: true });
      toast({
        title: errorMessage,
        description: error instanceof Error ? error.message : "Erro desconhecido.",
        variant: "destructive",
      });
      throw error;
    }
  }, [successMessage, errorMessage, toast]);

  const reset = useCallback(() => {
    setState({ isLoading: false, isSuccess: false, isError: false });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}