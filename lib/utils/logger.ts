/**
 * Application logger with structured, production-ready logging
 * Follows industry-standard common logging patterns with contextual metadata
 */

import {isDevelopment} from '@/lib/utils/env'

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LoggerOptions {
  context?: string
  forceProduction?: boolean
  [key: string]: unknown // Additional metadata
}

interface ErrorContext {
  url?: string
  method?: string
  status?: number
  statusText?: string
  isAuthenticated?: boolean
  errorBody?: string
  context?: string
  forceProduction?: boolean
  rateLimitHeaders?: {
    remaining: string | null
    used: string | null
    reset: string | null
    retryAfter: string | null
  }
  redditUserAgent?: string
  clientUserAgent?: string
  clientIp?: string
  referer?: string
  [key: string]: unknown
}

class Logger {
  private readonly isDevelopment = isDevelopment()

  private shouldLog(forceProduction = false): boolean {
    return this.isDevelopment || forceProduction
  }

  private formatStructuredLog(
    level: LogLevel,
    message: string,
    data?: unknown,
    options?: LoggerOptions
  ): Record<string, unknown> {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      context: options?.context,
      ...(data && typeof data === 'object' ? data : {data}),
      ...(options && Object.keys(options).length > 0 ? {metadata: options} : {})
    }
  }

  info(message: string, data?: unknown, options?: LoggerOptions): void {
    if (this.shouldLog(options?.forceProduction)) {
      const log = this.formatStructuredLog('info', message, data, options)
      console.info(JSON.stringify(log, null, 2))
    }
  }

  warn(message: string, data?: unknown, options?: LoggerOptions): void {
    if (this.shouldLog(options?.forceProduction)) {
      const log = this.formatStructuredLog('warn', message, data, options)
      console.warn(JSON.stringify(log, null, 2))
    }
  }

  error(message: string, error?: unknown, options?: LoggerOptions): void {
    if (this.shouldLog(options?.forceProduction)) {
      const log = this.formatStructuredLog('error', message, error, options)

      // Extract error details for better debugging
      if (error instanceof Error) {
        log.error = {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      } else if (error && typeof error === 'object') {
        log.error = error
      } else if (error) {
        log.error = String(error)
      }

      console.error(JSON.stringify(log, null, 2))
    }
  }

  debug(message: string, data?: unknown, options?: LoggerOptions): void {
    if (this.shouldLog(options?.forceProduction)) {
      const log = this.formatStructuredLog('debug', message, data, options)
      // eslint-disable-next-line no-console
      console.debug(JSON.stringify(log, null, 2))
    }
  }

  /**
   * Log HTTP request/response errors with full context
   * Use this for all API errors to provide actionable debugging information
   */
  httpError(
    message: string,
    errorContext: ErrorContext,
    error?: unknown
  ): void {
    const forceProduction =
      typeof errorContext.forceProduction === 'boolean'
        ? errorContext.forceProduction
        : false

    if (this.shouldLog(forceProduction)) {
      const log = this.formatStructuredLog('error', message, errorContext, {
        context: errorContext.context
      })

      // Add HTTP-specific context
      log.http = {
        url: errorContext.url,
        method: errorContext.method || 'GET',
        status: errorContext.status,
        statusText: errorContext.statusText,
        isAuthenticated: errorContext.isAuthenticated,
        responseBody: errorContext.errorBody?.substring(0, 1000), // Limit size
        rateLimitHeaders: errorContext.rateLimitHeaders || null
      }

      // Add client request details to identify crawlers/bots
      if (
        errorContext.clientUserAgent ||
        errorContext.clientIp ||
        errorContext.referer
      ) {
        log.client = {
          userAgent: errorContext.clientUserAgent || null,
          ip: errorContext.clientIp || null,
          referer: errorContext.referer || null,
          redditUserAgent: errorContext.redditUserAgent || null
        }
      }

      // Add error details if provided
      if (error instanceof Error) {
        log.error = {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      }

      console.error(JSON.stringify(log, null, 2))
    }
  }
}

export const logger = new Logger()
