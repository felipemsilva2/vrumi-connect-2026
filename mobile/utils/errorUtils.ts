export enum ErrorType {
    NETWORK = 'NETWORK',
    AUTH = 'AUTH',
    SERVER = 'SERVER',
    NOT_FOUND = 'NOT_FOUND',
    UNKNOWN = 'UNKNOWN',
}

interface AppError {
    type: ErrorType;
    message: string;
    description: string;
    recoverable: boolean;
    actionLabel?: string;
}

/**
 * Parses technical errors into human-readable AppErrors.
 */
export function parseError(error: any): AppError {
    const technicalMessage = error?.message || '';

    // Auth Errors
    if (technicalMessage.includes('JWT') || technicalMessage.includes('invalid claim')) {
        return {
            type: ErrorType.AUTH,
            message: 'Sessão Expirada',
            description: 'Sua sessão expirou por segurança. Por favor, entre novamente.',
            recoverable: true,
            actionLabel: 'Entrar',
        };
    }

    // Network Errors
    if (technicalMessage.includes('network') || technicalMessage.includes('fetch')) {
        return {
            type: ErrorType.NETWORK,
            message: 'Sem Conexão',
            description: 'Não conseguimos falar com o servidor. Verifique sua internet.',
            recoverable: true,
            actionLabel: 'Tentar Novamente',
        };
    }

    // Default Server Errors
    return {
        type: ErrorType.SERVER,
        message: 'Ops! Algo deu errado',
        description: 'Temos um pequeno problema técnico. Já estamos trabalhando nisso.',
        recoverable: true,
        actionLabel: 'Tentar Novamente',
    };
}

/**
 * Logs error to console or monitoring service (e.g. Sentry).
 */
export function logError(error: any, context?: string) {
    console.error(`[AppError]${context ? ` in ${context}:` : ''}`, error);
    // Here we could integrate with Sentry or another service
}
