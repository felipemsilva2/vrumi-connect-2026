// Structured logging helper for Edge Functions
// Provides consistent log format with levels and context

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogContext {
    userId?: string;
    bookingId?: string;
    instructorId?: string;
    eventId?: string;
    [key: string]: unknown;
}

/**
 * Create a logger for a specific Edge Function
 * @param functionName - Name of the Edge Function for log prefix
 */
export function createLogger(functionName: string) {
    const log = (level: LogLevel, message: string, context?: LogContext) => {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` ${JSON.stringify(context)}` : '';
        console.log(`[${timestamp}] [${functionName}] [${level}] ${message}${contextStr}`);
    };

    return {
        debug: (message: string, context?: LogContext) => log('DEBUG', message, context),
        info: (message: string, context?: LogContext) => log('INFO', message, context),
        warn: (message: string, context?: LogContext) => log('WARN', message, context),
        error: (message: string, context?: LogContext) => log('ERROR', message, context),
    };
}

// Pre-configured loggers for common flows
export const paymentLogger = createLogger('PAYMENT');
export const bookingLogger = createLogger('BOOKING');
export const webhookLogger = createLogger('WEBHOOK');
export const adminLogger = createLogger('ADMIN');
