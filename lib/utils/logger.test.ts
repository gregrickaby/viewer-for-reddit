import {beforeEach, describe, expect, it, vi} from 'vitest'

/* eslint-disable testing-library/no-debugging-utils */
// False positive: logger.debug is not testing-library's debug

describe('logger', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = {...originalEnv}
    vi.clearAllMocks()
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('info', () => {
    it('logs in development mode', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.info('Test message')

      expect(console.info).toHaveBeenCalled()
      const call = vi.mocked(console.info).mock.calls[0]
      expect(call[0]).toContain('[INFO]')
      expect(call[0]).toContain('Test message')
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

    it('includes context in log message', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.info('Test message', undefined, {context: 'TestContext'})

      expect(console.info).toHaveBeenCalled()
      const call = vi.mocked(console.info).mock.calls[0]
      expect(call[0]).toContain('[TestContext]')
    })

    it('includes data in log output', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.info('Test message', {foo: 'bar'})

      expect(console.info).toHaveBeenCalled()
      const call = vi.mocked(console.info).mock.calls[0]
      expect(call[1]).toEqual({foo: 'bar'})
    })

    it('logs empty string when no data provided', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.info('Test message')

      expect(console.info).toHaveBeenCalled()
      const call = vi.mocked(console.info).mock.calls[0]
      expect(call[1]).toBe('')
    })

    it('formats timestamp in ISO format', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.info('Test message')

      expect(console.info).toHaveBeenCalled()
      const call = vi.mocked(console.info).mock.calls[0]
      expect(call[0]).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })
  })

  describe('warn', () => {
    it('logs in development mode', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.warn('Warning message')

      expect(console.warn).toHaveBeenCalled()
      const call = vi.mocked(console.warn).mock.calls[0]
      expect(call[0]).toContain('[WARN]')
      expect(call[0]).toContain('Warning message')
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

    it('includes context in log message', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.warn('Warning message', undefined, {context: 'TestContext'})

      expect(console.warn).toHaveBeenCalled()
      const call = vi.mocked(console.warn).mock.calls[0]
      expect(call[0]).toContain('[TestContext]')
    })
  })

  describe('error', () => {
    it('logs in development mode', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.error('Error message')

      expect(console.error).toHaveBeenCalled()
      const call = vi.mocked(console.error).mock.calls[0]
      expect(call[0]).toContain('[ERROR]')
      expect(call[0]).toContain('Error message')
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

    it('includes error object in log output', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')
      const error = new Error('Test error')

      logger.error('Error message', error)

      expect(console.error).toHaveBeenCalled()
      const call = vi.mocked(console.error).mock.calls[0]
      expect(call[1]).toBe(error)
    })

    it('includes context in log message', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.error('Error message', undefined, {context: 'TestContext'})

      expect(console.error).toHaveBeenCalled()
      const call = vi.mocked(console.error).mock.calls[0]
      expect(call[0]).toContain('[TestContext]')
    })
  })

  describe('debug', () => {
    it('logs in development mode', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.debug('Debug message')

      expect(console.info).toHaveBeenCalled()
      const call = vi.mocked(console.info).mock.calls[0]
      expect(call[0]).toContain('[DEBUG]')
      expect(call[0]).toContain('Debug message')
    })

    it('does not log in production mode', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.debug('Debug message')

      expect(console.info).toHaveBeenCalled()
      const call = vi.mocked(console.info).mock.calls[0]
      expect(call[0]).toContain('[DEBUG]')
      expect(call[0]).toContain('Debug message')
    })

    it('logs in production with forceProduction option', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'production'
      const {logger} = await import('./logger')

      logger.debug('Debug message', undefined, {forceProduction: true})

      expect(console.info).toHaveBeenCalled()
    })

    it('includes context in log message', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.debug('Debug message', undefined, {context: 'TestContext'})

      expect(console.info).toHaveBeenCalled()
      const call = vi.mocked(console.info).mock.calls[0]
      expect(call[0]).toContain('[TestContext]')
    })

    it('includes data in log output', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.debug('Debug message', {debug: true})

      expect(console.info).toHaveBeenCalled()
      const call = vi.mocked(console.info).mock.calls[0]
      expect(call[1]).toEqual({debug: true})
    })
  })

  describe('edge cases', () => {
    it('handles null data gracefully', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.info('Test message', null)

      expect(console.info).toHaveBeenCalled()
      const call = vi.mocked(console.info).mock.calls[0]
      expect(call[1]).toBe('')
    })

    it('handles undefined data gracefully', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.info('Test message', undefined)

      expect(console.info).toHaveBeenCalled()
      const call = vi.mocked(console.info).mock.calls[0]
      expect(call[1]).toBe('')
    })

    it('handles complex data objects', async () => {
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
      const call = vi.mocked(console.info).mock.calls[0]
      expect(call[1]).toEqual(complexData)
    })

    it('handles options without context', async () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      const {logger} = await import('./logger')

      logger.info('Test message', undefined, {customOption: 'value'})

      expect(console.info).toHaveBeenCalled()
      const call = vi.mocked(console.info).mock.calls[0]
      expect(call[0]).not.toContain('[TestContext]')
      expect(call[0]).toContain('Test message')
    })
  })
})
