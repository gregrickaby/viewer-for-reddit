/**
 * Application logger with environment-aware logging
 * Only logs in development mode unless explicitly overridden
 */

import {isDevelopment} from '@/lib/utils/env'

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LoggerOptions {
  context?: string
  forceProduction?: boolean
  [key: string]: unknown // Allow additional metadata
}

class Logger {
  private readonly isDevelopment = isDevelopment()

  private shouldLog(forceProduction = false): boolean {
    return this.isDevelopment || forceProduction
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: string
  ): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? `[${context}]` : ''
    return `${timestamp} [${level.toUpperCase()}]${contextStr} ${message}`
  }

  info(message: string, data?: unknown, options?: LoggerOptions): void {
    if (this.shouldLog(options?.forceProduction)) {
      const formatted = this.formatMessage('info', message, options?.context)

      console.info(formatted, data ?? '')
    }
  }

  warn(message: string, data?: unknown, options?: LoggerOptions): void {
    if (this.shouldLog(options?.forceProduction)) {
      const formatted = this.formatMessage('warn', message, options?.context)

      console.warn(formatted, data ?? '')
    }
  }

  error(message: string, error?: unknown, options?: LoggerOptions): void {
    if (this.shouldLog(options?.forceProduction)) {
      const formatted = this.formatMessage('error', message, options?.context)

      console.error(formatted, error ?? '')
    }
  }

  debug(message: string, data?: unknown, options?: LoggerOptions): void {
    if (this.shouldLog(options?.forceProduction)) {
      const formatted = this.formatMessage('debug', message, options?.context)

      console.info(formatted, data ?? '')
    }
  }
}

export const logger = new Logger()
