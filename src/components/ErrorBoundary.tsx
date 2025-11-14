import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getErrorMessage } from "@/utils/errorMessages";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = getErrorMessage(this.state.error, {
        operation: "renderização de componente",
        component: "ErrorBoundary",
        technicalDetails: this.state.errorInfo?.componentStack?.substring(0, 200)
      });

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {errorMessage.title}
              </h2>
              
              <p className="text-muted-foreground mb-4">
                {errorMessage.description}
              </p>
              
              <div className="bg-muted rounded-lg p-3 mb-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Ação sugerida:</strong> {errorMessage.action}
                </p>
              </div>

              {errorMessage.technical && (
                <details className="mb-4">
                  <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                    Detalhes técnicos
                  </summary>
                  <pre className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded overflow-auto">
                    {errorMessage.technical}
                  </pre>
                </details>
              )}

              <div className="flex gap-2 justify-center">
                <Button onClick={this.handleReset} variant="default" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Tentar Novamente
                </Button>
                <Button onClick={() => window.location.href = "/"} variant="outline" className="gap-2">
                  <Home className="w-4 h-4" />
                  Ir para Início
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}