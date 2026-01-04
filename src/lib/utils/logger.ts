/**
 * Production-ready logging utility
 * Replaces console.log with structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  action?: string;
  resource?: string;
  metadata?: Record<string, any>;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isServer = typeof window === 'undefined';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (context) {
      const contextStr = JSON.stringify(context, null, 2);
      return `${prefix} ${message}\nContext: ${contextStr}`;
    }
    
    return `${prefix} ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    
    // In production, only log warn and error levels
    return level === 'warn' || level === 'error';
  }

  private logToService(level: LogLevel, message: string, context?: LogContext) {
    if (this.isServer) {
      // Server-side: Could send to external logging service
      // For now, just use console for server logs
      const formattedMessage = this.formatMessage(level, message, context);
      
      switch (level) {
        case 'error':
          console.error(formattedMessage);
          break;
        case 'warn':
          console.warn(formattedMessage);
          break;
        case 'info':
          console.info(formattedMessage);
          break;
        case 'debug':
          console.debug(formattedMessage);
          break;
      }
    } else {
      // Client-side: Send to analytics/monitoring service
      if (typeof window !== 'undefined' && (window as any).gtag) {
        // Send to Google Analytics if available
        (window as any).gtag('event', 'log_event', {
          event_category: level,
          event_label: message,
          custom_parameter: context
        });
      }

      // Also log to console in development
      if (this.isDevelopment) {
        const formattedMessage = this.formatMessage(level, message, context);
        
        switch (level) {
          case 'error':
            console.error(formattedMessage);
            break;
          case 'warn':
            console.warn(formattedMessage);
            break;
          case 'info':
            console.info(formattedMessage);
            break;
          case 'debug':
            console.debug(formattedMessage);
            break;
        }
      }
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog('debug')) {
      this.logToService('debug', message, context);
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog('info')) {
      this.logToService('info', message, context);
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.shouldLog('warn')) {
      this.logToService('warn', message, context);
    }
  }

  error(message: string, context?: LogContext) {
    if (this.shouldLog('error')) {
      this.logToService('error', message, context);
    }
  }

  // Convenience methods for common use cases
  userAction(action: string, userId: string, metadata?: Record<string, any>) {
    this.info(`User action: ${action}`, {
      userId,
      action,
      metadata
    });
  }

  apiCall(endpoint: string, method: string, status: number, userId?: string) {
    const level = status >= 400 ? 'error' : 'info';
    this[level](`API ${method} ${endpoint} - ${status}`, {
      userId,
      action: 'api_call',
      resource: endpoint,
      metadata: { method, status }
    });
  }

  databaseQuery(table: string, operation: string, userId?: string, error?: Error) {
    if (error) {
      this.error(`Database ${operation} failed on ${table}`, {
        userId,
        action: 'database_query',
        resource: table,
        metadata: { operation },
        error
      });
    } else {
      this.debug(`Database ${operation} on ${table}`, {
        userId,
        action: 'database_query',
        resource: table,
        metadata: { operation }
      });
    }
  }

  businessEvent(event: string, userId: string, metadata?: Record<string, any>) {
    this.info(`Business event: ${event}`, {
      userId,
      action: 'business_event',
      metadata: { event, ...metadata }
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for external use
export type { LogLevel, LogContext };