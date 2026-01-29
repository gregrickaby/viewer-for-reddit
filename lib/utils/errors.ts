/**
 * Custom error classes for enhanced error reporting.
 * Provides structured error context while keeping user-facing messages generic.
 */

/**
 * Base application error with operation context.
 * Includes metadata for debugging while keeping user messages generic.
 */
export class AppError extends Error {
  public readonly operation: string
  public readonly context!: Record<string, unknown>
  public readonly statusCode?: number
  public readonly isOperational: boolean

  constructor(
    message: string,
    operation: string,
    context: Record<string, unknown> = {},
    statusCode?: number
  ) {
    super(message)
    this.name = this.constructor.name
    this.operation = operation
    this.statusCode = statusCode
    this.isOperational = true // Distinguishes operational errors from programmer errors

    // Store context as non-enumerable property (won't show in console output)
    Object.defineProperty(this, 'context', {
      value: context,
      enumerable: false,
      writable: false,
      configurable: true
    })

    // Flatten context properties onto error object for better console visibility
    Object.assign(this, context)

    // Maintains proper stack trace for where error was thrown (V8)
    Error.captureStackTrace?.(this, this.constructor)
  }

  /**
   * Returns a safe object representation for logging.
   * Excludes sensitive data but includes debugging context.
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      operation: this.operation,
      context: this.context,
      statusCode: this.statusCode,
      stack: this.stack
    }
  }
}

/**
 * Error for Reddit API failures.
 * Includes API-specific context like status codes and endpoints.
 */
export class RedditAPIError extends AppError {
  public readonly endpoint: string
  public readonly method: string

  constructor(
    message: string,
    operation: string,
    endpoint: string,
    method: string = 'GET',
    context: Record<string, unknown> = {},
    statusCode?: number
  ) {
    super(message, operation, context, statusCode)
    this.endpoint = endpoint
    this.method = method
  }

  toJSON() {
    return {
      ...super.toJSON(),
      endpoint: this.endpoint,
      method: this.method
    }
  }
}

/**
 * Error for authentication failures.
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string,
    operation: string,
    context: Record<string, unknown> = {}
  ) {
    super(message, operation, context, 401)
  }
}

/**
 * Error for rate limiting.
 * Includes retry-after information when available.
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number

  constructor(
    message: string,
    operation: string,
    retryAfter?: number,
    context: Record<string, unknown> = {}
  ) {
    super(message, operation, context, 429)
    this.retryAfter = retryAfter
  }

  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter
    }
  }
}

/**
 * Error for resource not found (404).
 */
export class NotFoundError extends AppError {
  public readonly resource: string

  constructor(
    message: string,
    operation: string,
    resource: string,
    context: Record<string, unknown> = {}
  ) {
    super(message, operation, context, 404)
    this.resource = resource
  }

  toJSON() {
    return {
      ...super.toJSON(),
      resource: this.resource
    }
  }
}

/**
 * Type guard to check if error is an AppError.
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/**
 * Safely extract error message from unknown error type.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

/**
 * Safely extract operation context from error.
 */
export function getErrorContext(error: unknown): Record<string, unknown> {
  if (isAppError(error)) {
    return {
      operation: error.operation,
      context: error.context,
      statusCode: error.statusCode
    }
  }
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message
    }
  }
  return {}
}
