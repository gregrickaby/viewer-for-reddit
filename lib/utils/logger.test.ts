import {beforeEach, describe, expect, it, vi} from 'vitest'

/* eslint-disable testing-library/no-debugging-utils */
/* eslint-disable no-console */
// False positive: logger.debug is not testing-library's debug
// Tests need to spy on console.debug

describe('logger', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = {...originalEnv}
    vi.clearAllMocks()
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'debug').mockImplementation(() => {})
  })

  describe('info', () => {
    it('logs structured JSON in development mode', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.info('Test message')

      expect(console.info).toHaveBeenCalled()
      const logOutput = JSON.parse(vi.mocked(console.info).mock.calls[0][0])
      expect(logOutput.level).toBe('INFO')
      expect(logOutput.message).toBe('Test message')
      expect(logOutput.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('does not log in production mode', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'production'
      const {logger} = await import('./logger')

      logger.info('Test message')

      expect(console.info).not.toHaveBeenCalled()
    })

    it('logs in production with forceProduction option', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'production'
      const {logger} = await import('./logger')

      logger.info('Test message', undefined, {forceProduction: true})

      expect(console.info).toHaveBeenCalled()
    })

    it('includes context in structured log', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.info('Test message', undefined, {context: 'TestContext'})

      expect(console.info).toHaveBeenCalled()
      const logOutput = JSON.parse(vi.mocked(console.info).mock.calls[0][0])
      expect(logOutput.context).toBe('TestContext')
    })

    it('includes data in structured log', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.info('Test message', {foo: 'bar', count: 42})

      expect(console.info).toHaveBeenCalled()
      const logOutput = JSON.parse(vi.mocked(console.info).mock.calls[0][0])
      expect(logOutput.foo).toBe('bar')
      expect(logOutput.count).toBe(42)
    })
  })

  describe('warn', () => {
    it('logs structured JSON in development mode', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.warn('Warning message')

      expect(console.warn).toHaveBeenCalled()
      const logOutput = JSON.parse(vi.mocked(console.warn).mock.calls[0][0])
      expect(logOutput.level).toBe('WARN')
      expect(logOutput.message).toBe('Warning message')
    })

    it('does not log in production mode', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'production'
      const {logger} = await import('./logger')

      logger.warn('Warning message')

      expect(console.warn).not.toHaveBeenCalled()
    })

    it('logs in production with forceProduction option', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'production'
      const {logger} = await import('./logger')

      logger.warn('Warning message', undefined, {forceProduction: true})

      expect(console.warn).toHaveBeenCalled()
    })

    it('includes context in structured log', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.warn('Warning message', undefined, {context: 'TestContext'})

      expect(console.warn).toHaveBeenCalled()
      const logOutput = JSON.parse(vi.mocked(console.warn).mock.calls[0][0])
      expect(logOutput.context).toBe('TestContext')
    })
  })

  describe('error', () => {
    it('logs structured JSON in development mode', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.error('Error message')

      expect(console.error).toHaveBeenCalled()
      const logOutput = JSON.parse(vi.mocked(console.error).mock.calls[0][0])
      expect(logOutput.level).toBe('ERROR')
      expect(logOutput.message).toBe('Error message')
    })

    it('does not log in production mode', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'production'
      const {logger} = await import('./logger')

      logger.error('Error message')

      expect(console.error).not.toHaveBeenCalled()
    })

    it('logs in production with forceProduction option', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'production'
      const {logger} = await import('./logger')

      logger.error('Error message', undefined, {forceProduction: true})

      expect(console.error).toHaveBeenCalled()
    })

    it('includes Error object details in structured log', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')
      const error = new Error('Test error')

      logger.error('Error message', error)

      expect(console.error).toHaveBeenCalled()
      const logOutput = JSON.parse(vi.mocked(console.error).mock.calls[0][0])
      expect(logOutput.error).toBeDefined()
      expect(logOutput.error.name).toBe('Error')
      expect(logOutput.error.message).toBe('Test error')
      expect(logOutput.error.stack).toBeDefined()
    })

    it('handles non-Error objects', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.error('Error message', {status: 500, message: 'Server error'})

      expect(console.error).toHaveBeenCalled()
      const logOutput = JSON.parse(vi.mocked(console.error).mock.calls[0][0])
      expect(logOutput.error).toEqual({status: 500, message: 'Server error'})
    })

    it('handles primitive error values', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.error('Error message', 'simple error string')

      expect(console.error).toHaveBeenCalled()
      const logOutput = JSON.parse(vi.mocked(console.error).mock.calls[0][0])
      expect(logOutput.error).toBe('simple error string')
    })

    it('includes context in structured log', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.error('Error message', undefined, {context: 'TestContext'})

      expect(console.error).toHaveBeenCalled()
      const logOutput = JSON.parse(vi.mocked(console.error).mock.calls[0][0])
      expect(logOutput.context).toBe('TestContext')
    })
  })

  describe('debug', () => {
    it('logs structured JSON in development mode', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.debug('Debug message')

      expect(console.debug).toHaveBeenCalled()
      const logOutput = JSON.parse(vi.mocked(console.debug).mock.calls[0][0])
      expect(logOutput.level).toBe('DEBUG')
      expect(logOutput.message).toBe('Debug message')
    })

    it('does not log in production mode', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'production'
      const {logger} = await import('./logger')

      logger.debug('Debug message')

      expect(console.debug).not.toHaveBeenCalled()
    })

    it('logs in production with forceProduction option', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'production'
      const {logger} = await import('./logger')

      logger.debug('Debug message', undefined, {forceProduction: true})

      expect(console.debug).toHaveBeenCalled()
    })

    it('includes context in structured log', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.debug('Debug message', undefined, {context: 'TestContext'})

      expect(console.debug).toHaveBeenCalled()
      const logOutput = JSON.parse(vi.mocked(console.debug).mock.calls[0][0])
      expect(logOutput.context).toBe('TestContext')
    })

    it('includes data in structured log', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.debug('Debug message', {debug: true, traceId: '123'})

      expect(console.debug).toHaveBeenCalled()
      const logOutput = JSON.parse(vi.mocked(console.debug).mock.calls[0][0])
      expect(logOutput.debug).toBe(true)
      expect(logOutput.traceId).toBe('123')
    })
  })

  describe('httpError', () => {
    it('logs HTTP errors with full context', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.httpError('API request failed', {
        url: 'https://api.example.com/posts',
        method: 'GET',
        status: 500,
        statusText: 'Internal Server Error',
        isAuthenticated: true,
        errorBody: 'Server error details',
        context: 'fetchPosts'
      })

      expect(console.error).toHaveBeenCalled()
      const logOutput = JSON.parse(vi.mocked(console.error).mock.calls[0][0])
      expect(logOutput.level).toBe('ERROR')
      expect(logOutput.message).toBe('API request failed')
      expect(logOutput.context).toBe('fetchPosts')
      expect(logOutput.http).toEqual({
        url: 'https://api.example.com/posts',
        method: 'GET',
        status: 500,
        statusText: 'Internal Server Error',
        isAuthenticated: true,
        responseBody: 'Server error details',
        rateLimitHeaders: null
      })
      expect(logOutput.client).toBeUndefined() // No client info provided
    })

    it('includes Error object if provided', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')
      const error = new Error('Network timeout')

      logger.httpError(
        'API request failed',
        {
          url: 'https://api.example.com/posts',
          status: 504,
          statusText: 'Gateway Timeout',
          context: 'fetchPosts'
        },
        error
      )

      expect(console.error).toHaveBeenCalled()
      const logOutput = JSON.parse(vi.mocked(console.error).mock.calls[0][0])
      expect(logOutput.error).toBeDefined()
      expect(logOutput.error.message).toBe('Network timeout')
      expect(logOutput.error.stack).toBeDefined()
    })

    it('truncates large response bodies', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')
      const largeBody = 'x'.repeat(2000)

      logger.httpError('API request failed', {
        url: 'https://api.example.com/posts',
        status: 500,
        errorBody: largeBody,
        context: 'fetchPosts'
      })

      expect(console.error).toHaveBeenCalled()
      const logOutput = JSON.parse(vi.mocked(console.error).mock.calls[0][0])
      expect(logOutput.http.responseBody.length).toBe(1000)
    })

    it('defaults method to GET if not provided', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.httpError('API request failed', {
        url: 'https://api.example.com/posts',
        status: 404,
        context: 'fetchPosts'
      })

      expect(console.error).toHaveBeenCalled()
      const logOutput = JSON.parse(vi.mocked(console.error).mock.calls[0][0])
      expect(logOutput.http.method).toBe('GET')
    })

    it('respects forceProduction flag', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'production'
      const {logger} = await import('./logger')

      logger.httpError('API request failed', {
        url: 'https://api.example.com/posts',
        status: 500,
        forceProduction: true,
        context: 'fetchPosts'
      })

      expect(console.error).toHaveBeenCalled()
    })

    it('does not log in production without forceProduction', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'production'
      const {logger} = await import('./logger')

      logger.httpError('API request failed', {
        url: 'https://api.example.com/posts',
        status: 500,
        context: 'fetchPosts'
      })

      expect(console.error).not.toHaveBeenCalled()
    })

    it('includes client metadata when provided', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.httpError('API request failed', {
        url: 'https://api.example.com/posts',
        status: 429,
        statusText: 'Too Many Requests',
        isAuthenticated: false,
        clientUserAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
        clientIp: '66.249.66.1',
        referer: 'https://www.google.com/',
        redditUserAgent: 'web:viewer-for-reddit:v9.0.0',
        context: 'fetchPosts',
        forceProduction: true
      })

      expect(console.error).toHaveBeenCalled()
      const logOutput = JSON.parse(vi.mocked(console.error).mock.calls[0][0])
      expect(logOutput.client).toEqual({
        userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
        ip: '66.249.66.1',
        referer: 'https://www.google.com/',
        redditUserAgent: 'web:viewer-for-reddit:v9.0.0'
      })
    })
  })

  describe('edge cases', () => {
    it('handles null data gracefully', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.info('Test message', null)

      expect(console.info).toHaveBeenCalled()
      const logOutput = JSON.parse(vi.mocked(console.info).mock.calls[0][0])
      expect(logOutput.data).toBe(null)
    })

    it('handles undefined data gracefully', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.info('Test message', undefined)

      expect(console.info).toHaveBeenCalled()
      const logOutput = JSON.parse(vi.mocked(console.info).mock.calls[0][0])
      expect(logOutput.message).toBe('Test message')
      expect(logOutput.data).toBeUndefined()
    })

    it('handles complex nested data objects', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')
      const complexData = {
        nested: {
          object: {
            with: 'values'
          }
        },
        array: [1, 2, 3]
      }

      logger.info('Test message', complexData)

      expect(console.info).toHaveBeenCalled()
      const logOutput = JSON.parse(vi.mocked(console.info).mock.calls[0][0])
      expect(logOutput.nested).toEqual(complexData.nested)
      expect(logOutput.array).toEqual(complexData.array)
    })

    it('handles options without context', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.info('Test message', undefined, {customOption: 'value'})

      expect(console.info).toHaveBeenCalled()
      const logOutput = JSON.parse(vi.mocked(console.info).mock.calls[0][0])
      expect(logOutput.message).toBe('Test message')
      expect(logOutput.context).toBeUndefined()
    })

    it('formats timestamp in ISO 8601 format', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.info('Test message')

      expect(console.info).toHaveBeenCalled()
      const logOutput = JSON.parse(vi.mocked(console.info).mock.calls[0][0])
      expect(logOutput.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })
  })
})
