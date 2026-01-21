/**
 * Custom error classes for Reddit Viewer application.
 * These errors include a 'code' property that survives Next.js error serialization.
 */

/**
 * Base error class with error code.
 * The 'code' property is preserved during Next.js serialization in production.
 */
export class AppError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
  }
}

/**
 * Authentication error - thrown when user session has expired.
 * Use this instead of generic Error for auth failures.
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication expired') {
    super('AUTH_EXPIRED', message)
    this.name = 'AuthenticationError'
  }
}

/**
 * Not found error - thrown when a resource doesn't exist.
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super('NOT_FOUND', message)
    this.name = 'NotFoundError'
  }
}

/**
 * Rate limit error - thrown when Reddit API rate limit is exceeded.
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super('RATE_LIMIT', message)
    this.name = 'RateLimitError'
  }
}

/**
 * Forbidden error - thrown when user lacks permission.
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super('FORBIDDEN', message)
    this.name = 'ForbiddenError'
  }
}

/**
 * Check if an error is an authentication error.
 * Works with both custom AuthenticationError and error name/code fallback.
 * Note: Checks both error.name (more reliable) and error.code (fallback)
 * as Next.js serialization behavior can vary.
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AuthenticationError) {
    return true
  }
  if (error && typeof error === 'object') {
    // Check error.name first (preserved by Next.js serialization)
    if ('name' in error && error.name === 'AuthenticationError') {
      return true
    }
    // Fallback to error.code if available
    if ('code' in error && error.code === 'AUTH_EXPIRED') {
      return true
    }
  }
  return false
}

/**
 * Check if an error is a not found error.
 * Note: Checks both error.name (more reliable) and error.code (fallback)
 * as Next.js serialization behavior can vary.
 */
export function isNotFoundError(error: unknown): boolean {
  if (error instanceof NotFoundError) {
    return true
  }
  if (error && typeof error === 'object') {
    if ('name' in error && error.name === 'NotFoundError') {
      return true
    }
    if ('code' in error && error.code === 'NOT_FOUND') {
      return true
    }
  }
  return false
}

/**
 * Check if an error is a rate limit error.
 * Note: Checks both error.name (more reliable) and error.code (fallback)
 * as Next.js serialization behavior can vary.
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof RateLimitError) {
    return true
  }
  if (error && typeof error === 'object') {
    if ('name' in error && error.name === 'RateLimitError') {
      return true
    }
    if ('code' in error && error.code === 'RATE_LIMIT') {
      return true
    }
  }
  return false
}

/**
 * Check if an error is a forbidden error.
 * Note: Checks both error.name (more reliable) and error.code (fallback)
 * as Next.js serialization behavior can vary.
 */
export function isForbiddenError(error: unknown): boolean {
  if (error instanceof ForbiddenError) {
    return true
  }
  if (error && typeof error === 'object') {
    if ('name' in error && error.name === 'ForbiddenError') {
      return true
    }
    if ('code' in error && error.code === 'FORBIDDEN') {
      return true
    }
  }
  return false
}
