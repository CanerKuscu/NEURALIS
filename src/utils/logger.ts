/**
 * Logger Utility
 * Centralized logging with environment awareness
 * Only logs in development mode
 */

const isDev = __DEV__;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
    prefix?: string;
    enableInProduction?: boolean;
}

class Logger {
    private prefix: string;
    private enableInProduction: boolean;

    constructor(options: LoggerOptions = {}) {
        this.prefix = options.prefix || '';
        this.enableInProduction = options.enableInProduction || false;
    }

    private shouldLog(level: LogLevel): boolean {
        // Always log errors
        if (level === 'error') return true;
        // Only log debug/info/warn in development
        if (isDev) return true;
        return this.enableInProduction;
    }

    private formatMessage(level: LogLevel, message: string): string {
        const timestamp = new Date().toISOString();
        const prefix = this.prefix ? `[${this.prefix}]` : '';
        return `${timestamp} ${prefix} ${message}`;
    }

    debug(message: string, ...args: any[]): void {
        if (!this.shouldLog('debug')) return;
        console.log(this.formatMessage('debug', message), ...args);
    }

    info(message: string, ...args: any[]): void {
        if (!this.shouldLog('info')) return;
        console.log(this.formatMessage('info', message), ...args);
    }

    warn(message: string, ...args: any[]): void {
        if (!this.shouldLog('warn')) return;
        console.warn(this.formatMessage('warn', message), ...args);
    }

    error(message: string, ...args: any[]): void {
        if (!this.shouldLog('error')) return;
        console.error(this.formatMessage('error', message), ...args);
    }
}

// Pre-configured loggers for different services
export const createLogger = (prefix: string) => new Logger({ prefix });

// Default logger
export const logger = new Logger();

// Service-specific loggers
export const aiLogger = createLogger('AI');
export const authLogger = createLogger('Auth');
export const streakLogger = createLogger('Streak');
export const socialLogger = createLogger('Social');
export const notificationLogger = createLogger('Notification');
export const avatarLogger = createLogger('Avatar');
export const lessonLogger = createLogger('Lesson');
export const leagueLogger = createLogger('League');

export default logger;
