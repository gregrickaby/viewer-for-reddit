import {describe, expect, it} from 'vitest'
import {
  AppError,
  AuthenticationError,
  getErrorContext,
  getErrorMessage,
  isAppError,
  NotFoundError,
  RateLimitError,
  RedditAPIError
} from './errors'

describe('AppError', () => {
  it('creates base error with operation context', () => {
    const error = new AppError(
      'Test error',
      'testOperation',
      {key: 'value'},
      500
    )

    expect(error.message).toBe('Test error')
    expect(error.operation).toBe('testOperation')
    expect(error.context).toEqual({key: 'value'})
    expect(error.statusCode).toBe(500)
    expect(error.isOperational).toBe(true)
    expect(error.name).toBe('AppError')
  })

  it('serializes to JSON with all context', () => {
    const error = new AppError('Test error', 'testOp', {foo: 'bar'})
    const json = error.toJSON()

    expect(json).toMatchObject({
      name: 'AppError',
      message: 'Test error',
      operation: 'testOp',
      context: {foo: 'bar'},
      statusCode: undefined
    })
    expect(json.stack).toBeDefined()
  })

  it('creates error without status code', () => {
    const error = new AppError('Test error', 'testOp')

    expect(error.statusCode).toBeUndefined()
    expect(error.context).toEqual({})
  })
})

describe('RedditAPIError', () => {
  it('includes API-specific properties', () => {
    const error = new RedditAPIError(
      'API failed',
      'fetchPosts',
      'https://oauth.reddit.com/r/test',
      'GET',
      {subreddit: 'test'},
      404
    )

    expect(error.message).toBe('API failed')
    expect(error.operation).toBe('fetchPosts')
    expect(error.endpoint).toBe('https://oauth.reddit.com/r/test')
    expect(error.method).toBe('GET')
    expect(error.context).toEqual({subreddit: 'test'})
    expect(error.statusCode).toBe(404)
  })

  it('defaults to GET method', () => {
    const error = new RedditAPIError(
      'API failed',
      'fetchPosts',
      'https://oauth.reddit.com/r/test'
    )

    expect(error.method).toBe('GET')
  })

  it('serializes with endpoint and method', () => {
    const error = new RedditAPIError(
      'API failed',
      'fetchPosts',
      'https://oauth.reddit.com/r/test',
      'POST',
      {id: '123'}
    )
    const json = error.toJSON()

    expect(json).toMatchObject({
      name: 'RedditAPIError',
      endpoint: 'https://oauth.reddit.com/r/test',
      method: 'POST',
      context: {id: '123'}
    })
  })
})

describe('AuthenticationError', () => {
  it('creates auth error with 401 status', () => {
    const error = new AuthenticationError('Auth failed', 'login', {
      user: 'test'
    })

    expect(error.statusCode).toBe(401)
    expect(error.operation).toBe('login')
    expect(error.context).toEqual({user: 'test'})
  })
})

describe('RateLimitError', () => {
  it('includes retry-after time', () => {
    const error = new RateLimitError('Rate limited', 'fetchPosts', 60, {
      endpoint: '/r/test'
    })

    expect(error.statusCode).toBe(429)
    expect(error.retryAfter).toBe(60)
    expect(error.context).toEqual({endpoint: '/r/test'})
  })

  it('works without retry-after', () => {
    const error = new RateLimitError('Rate limited', 'fetchPosts')

    expect(error.retryAfter).toBeUndefined()
  })

  it('serializes with retry-after', () => {
    const error = new RateLimitError('Rate limited', 'fetchPosts', 120)
    const json = error.toJSON()

    expect(json).toMatchObject({
      name: 'RateLimitError',
      retryAfter: 120
    })
  })
})

describe('NotFoundError', () => {
  it('includes resource information', () => {
    const error = new NotFoundError('Not found', 'fetchPost', 'r/test', {
      postId: '123'
    })

    expect(error.statusCode).toBe(404)
    expect(error.resource).toBe('r/test')
    expect(error.context).toEqual({postId: '123'})
  })

  it('serializes with resource', () => {
    const error = new NotFoundError('Not found', 'fetchPost', 'r/test')
    const json = error.toJSON()

    expect(json).toMatchObject({
      name: 'NotFoundError',
      resource: 'r/test'
    })
  })
})

describe('isAppError', () => {
  it('returns true for AppError instances', () => {
    const error = new AppError('Test', 'op')
    expect(isAppError(error)).toBe(true)
  })

  it('returns true for subclass instances', () => {
    const authError = new AuthenticationError('Test', 'op')
    const apiError = new RedditAPIError('Test', 'op', 'url')
    const rateError = new RateLimitError('Test', 'op')
    const notFoundError = new NotFoundError('Test', 'op', 'resource')

    expect(isAppError(authError)).toBe(true)
    expect(isAppError(apiError)).toBe(true)
    expect(isAppError(rateError)).toBe(true)
    expect(isAppError(notFoundError)).toBe(true)
  })

  it('returns false for regular errors', () => {
    const error = new Error('Test')
    expect(isAppError(error)).toBe(false)
  })

  it('returns false for non-error values', () => {
    expect(isAppError('string')).toBe(false)
    expect(isAppError(123)).toBe(false)
    expect(isAppError(null)).toBe(false)
    expect(isAppError(undefined)).toBe(false)
  })
})

describe('getErrorMessage', () => {
  it('extracts message from Error', () => {
    const error = new Error('Test error message')
    expect(getErrorMessage(error)).toBe('Test error message')
  })

  it('extracts message from AppError', () => {
    const error = new AppError('App error message', 'op')
    expect(getErrorMessage(error)).toBe('App error message')
  })

  it('converts non-error to string', () => {
    expect(getErrorMessage('string error')).toBe('string error')
    expect(getErrorMessage(123)).toBe('123')
  })

  it('handles null and undefined', () => {
    expect(getErrorMessage(null)).toBe('null')
    expect(getErrorMessage(undefined)).toBe('undefined')
  })
})

describe('getErrorContext', () => {
  it('extracts full context from AppError', () => {
    const error = new AppError('Test', 'fetchPosts', {subreddit: 'test'}, 500)
    const context = getErrorContext(error)

    expect(context).toEqual({
      operation: 'fetchPosts',
      context: {subreddit: 'test'},
      statusCode: 500
    })
  })

  it('extracts basic info from regular Error', () => {
    const error = new Error('Test error')
    error.name = 'CustomError'
    const context = getErrorContext(error)

    expect(context).toEqual({
      name: 'CustomError',
      message: 'Test error'
    })
  })

  it('returns empty object for non-error values', () => {
    expect(getErrorContext('string')).toEqual({})
    expect(getErrorContext(123)).toEqual({})
    expect(getErrorContext(null)).toEqual({})
    expect(getErrorContext(undefined)).toEqual({})
  })

  it('extracts context from RedditAPIError', () => {
    const error = new RedditAPIError(
      'API failed',
      'fetchPost',
      '/r/test',
      'GET',
      {
        postId: '123'
      }
    )
    const context = getErrorContext(error)

    expect(context).toMatchObject({
      operation: 'fetchPost',
      context: {postId: '123'}
    })
  })
})
