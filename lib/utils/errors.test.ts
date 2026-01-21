import {describe, expect, it} from 'vitest'
import {
  AppError,
  AuthenticationError,
  ForbiddenError,
  isAuthError,
  isForbiddenError,
  isNotFoundError,
  isRateLimitError,
  NotFoundError,
  RateLimitError
} from './errors'

describe('AppError', () => {
  it('creates error with code and message', () => {
    const error = new AppError('TEST_CODE', 'Test message')

    expect(error.code).toBe('TEST_CODE')
    expect(error.message).toBe('Test message')
    expect(error.name).toBe('AppError')
  })

  it('extends Error class', () => {
    const error = new AppError('TEST_CODE', 'Test message')

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(AppError)
  })

  it('has stack trace', () => {
    const error = new AppError('TEST_CODE', 'Test message')

    expect(error.stack).toBeDefined()
  })
})

describe('AuthenticationError', () => {
  it('creates auth error with AUTH_EXPIRED code', () => {
    const error = new AuthenticationError()

    expect(error.code).toBe('AUTH_EXPIRED')
    expect(error.message).toBe('Authentication expired')
    expect(error.name).toBe('AuthenticationError')
  })

  it('accepts custom message', () => {
    const error = new AuthenticationError('Session timed out')

    expect(error.code).toBe('AUTH_EXPIRED')
    expect(error.message).toBe('Session timed out')
  })

  it('extends AppError', () => {
    const error = new AuthenticationError()

    expect(error).toBeInstanceOf(AppError)
    expect(error).toBeInstanceOf(AuthenticationError)
  })
})

describe('NotFoundError', () => {
  it('creates not found error with NOT_FOUND code', () => {
    const error = new NotFoundError()

    expect(error.code).toBe('NOT_FOUND')
    expect(error.message).toBe('Resource not found')
    expect(error.name).toBe('NotFoundError')
  })

  it('accepts custom message', () => {
    const error = new NotFoundError('Subreddit not found')

    expect(error.code).toBe('NOT_FOUND')
    expect(error.message).toBe('Subreddit not found')
  })

  it('extends AppError', () => {
    const error = new NotFoundError()

    expect(error).toBeInstanceOf(AppError)
    expect(error).toBeInstanceOf(NotFoundError)
  })
})

describe('RateLimitError', () => {
  it('creates rate limit error with RATE_LIMIT code', () => {
    const error = new RateLimitError()

    expect(error.code).toBe('RATE_LIMIT')
    expect(error.message).toBe('Rate limit exceeded')
    expect(error.name).toBe('RateLimitError')
  })

  it('accepts custom message', () => {
    const error = new RateLimitError('Too many requests')

    expect(error.code).toBe('RATE_LIMIT')
    expect(error.message).toBe('Too many requests')
  })

  it('extends AppError', () => {
    const error = new RateLimitError()

    expect(error).toBeInstanceOf(AppError)
    expect(error).toBeInstanceOf(RateLimitError)
  })
})

describe('ForbiddenError', () => {
  it('creates forbidden error with FORBIDDEN code', () => {
    const error = new ForbiddenError()

    expect(error.code).toBe('FORBIDDEN')
    expect(error.message).toBe('Access forbidden')
    expect(error.name).toBe('ForbiddenError')
  })

  it('accepts custom message', () => {
    const error = new ForbiddenError('Private subreddit')

    expect(error.code).toBe('FORBIDDEN')
    expect(error.message).toBe('Private subreddit')
  })

  it('extends AppError', () => {
    const error = new ForbiddenError()

    expect(error).toBeInstanceOf(AppError)
    expect(error).toBeInstanceOf(ForbiddenError)
  })
})

describe('isAuthError', () => {
  it('returns true for AuthenticationError', () => {
    const error = new AuthenticationError()

    expect(isAuthError(error)).toBe(true)
  })

  it('returns true for error with AUTH_EXPIRED code', () => {
    const error = new AppError('AUTH_EXPIRED', 'Auth failed')

    expect(isAuthError(error)).toBe(true)
  })

  it('returns true for generic Error with code property', () => {
    const error = new Error('Auth expired') as Error & {code?: string}
    error.code = 'AUTH_EXPIRED'

    expect(isAuthError(error)).toBe(true)
  })

  it('returns true for generic Error with AuthenticationError name (Next.js serialization)', () => {
    // This simulates how Next.js serializes custom errors - preserves name but not code
    const error = new Error('Session expired')
    Object.defineProperty(error, 'name', {value: 'AuthenticationError'})

    expect(isAuthError(error)).toBe(true)
  })

  it('returns false for error without code property', () => {
    const error = new Error('Generic error')

    expect(isAuthError(error)).toBe(false)
  })

  it('returns false for error with different code', () => {
    const error = new NotFoundError()

    expect(isAuthError(error)).toBe(false)
  })

  it('returns false for null', () => {
    expect(isAuthError(null as any)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isAuthError(undefined as any)).toBe(false)
  })
})

describe('isNotFoundError', () => {
  it('returns true for NotFoundError', () => {
    const error = new NotFoundError()

    expect(isNotFoundError(error)).toBe(true)
  })

  it('returns true for error with NOT_FOUND code', () => {
    const error = new AppError('NOT_FOUND', '404')

    expect(isNotFoundError(error)).toBe(true)
  })

  it('returns true for generic Error with code property', () => {
    const error = new Error('Not found') as Error & {code?: string}
    error.code = 'NOT_FOUND'

    expect(isNotFoundError(error)).toBe(true)
  })

  it('returns true for generic Error with NotFoundError name (Next.js serialization)', () => {
    const error = new Error('Resource not found')
    Object.defineProperty(error, 'name', {value: 'NotFoundError'})

    expect(isNotFoundError(error)).toBe(true)
  })

  it('returns false for error without code property', () => {
    const error = new Error('Generic error')

    expect(isNotFoundError(error)).toBe(false)
  })

  it('returns false for error with different code', () => {
    const error = new AuthenticationError()

    expect(isNotFoundError(error)).toBe(false)
  })

  it('returns false for null', () => {
    expect(isNotFoundError(null as any)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isNotFoundError(undefined as any)).toBe(false)
  })
})

describe('isRateLimitError', () => {
  it('returns true for RateLimitError', () => {
    const error = new RateLimitError()

    expect(isRateLimitError(error)).toBe(true)
  })

  it('returns true for error with RATE_LIMIT code', () => {
    const error = new AppError('RATE_LIMIT', '429')

    expect(isRateLimitError(error)).toBe(true)
  })

  it('returns true for generic Error with code property', () => {
    const error = new Error('Too many requests') as Error & {code?: string}
    error.code = 'RATE_LIMIT'

    expect(isRateLimitError(error)).toBe(true)
  })

  it('returns true for generic Error with RateLimitError name (Next.js serialization)', () => {
    const error = new Error('Rate limit exceeded')
    Object.defineProperty(error, 'name', {value: 'RateLimitError'})

    expect(isRateLimitError(error)).toBe(true)
  })

  it('returns false for error without code property', () => {
    const error = new Error('Generic error')

    expect(isRateLimitError(error)).toBe(false)
  })

  it('returns false for error with different code', () => {
    const error = new AuthenticationError()

    expect(isRateLimitError(error)).toBe(false)
  })

  it('returns false for null', () => {
    expect(isRateLimitError(null as any)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isRateLimitError(undefined as any)).toBe(false)
  })
})

describe('isForbiddenError', () => {
  it('returns true for ForbiddenError', () => {
    const error = new ForbiddenError()

    expect(isForbiddenError(error)).toBe(true)
  })

  it('returns true for error with FORBIDDEN code', () => {
    const error = new AppError('FORBIDDEN', '403')

    expect(isForbiddenError(error)).toBe(true)
  })

  it('returns true for generic Error with code property', () => {
    const error = new Error('Access denied') as Error & {code?: string}
    error.code = 'FORBIDDEN'

    expect(isForbiddenError(error)).toBe(true)
  })

  it('returns true for generic Error with ForbiddenError name (Next.js serialization)', () => {
    const error = new Error('Access forbidden')
    Object.defineProperty(error, 'name', {value: 'ForbiddenError'})

    expect(isForbiddenError(error)).toBe(true)
  })

  it('returns false for error without code property', () => {
    const error = new Error('Generic error')

    expect(isForbiddenError(error)).toBe(false)
  })

  it('returns false for error with different code', () => {
    const error = new AuthenticationError()

    expect(isForbiddenError(error)).toBe(false)
  })

  it('returns false for null', () => {
    expect(isForbiddenError(null as any)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isForbiddenError(undefined as any)).toBe(false)
  })
})

describe('Error serialization (Next.js production behavior)', () => {
  it('preserves code property through JSON serialization', () => {
    const error = new AuthenticationError()
    const serialized = JSON.stringify({
      code: error.code,
      message: error.message
    })
    const parsed = JSON.parse(serialized)

    expect(parsed.code).toBe('AUTH_EXPIRED')
    expect(isAuthError({code: parsed.code} as any)).toBe(true)
  })

  it('code property survives object spread', () => {
    const error = new AuthenticationError()
    const spread = {...error}

    expect(spread.code).toBe('AUTH_EXPIRED')
    expect(isAuthError(spread as any)).toBe(true)
  })

  it('works with Error objects that only have code property', () => {
    // Simulates Next.js production behavior where message is sanitized
    // but custom properties like 'code' are preserved
    const productionError = {
      name: 'Error',
      message: 'An error occurred in the Server Components render',
      digest: '1820301655',
      code: 'AUTH_EXPIRED'
    } as Error & {code?: string}

    expect(isAuthError(productionError)).toBe(true)
    expect(isNotFoundError(productionError)).toBe(false)
    expect(isRateLimitError(productionError)).toBe(false)
  })
})
