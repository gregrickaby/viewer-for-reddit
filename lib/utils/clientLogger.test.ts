import {logClientError, logClientInfo} from './clientLogger'

// Mock fetch globally
const mockFetch = vi.fn()

describe('clientLogger', () => {
  beforeEach(() => {
    global.fetch = mockFetch
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({})
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('logClientError', () => {
    it('should send error log to server with basic message', async () => {
      const message = 'Test error message'

      logClientError(message)

      // Wait for async call
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockFetch).toHaveBeenCalledWith('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: expect.stringContaining('"level":"error"')
      })

      // Verify the actual payload structure
      const call = mockFetch.mock.calls[0]
      const body = JSON.parse(call[1].body)
      expect(body.level).toBe('error')
      expect(body.message).toBe(message)
      expect(body.context.clientTimestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
      )
    })

    it('should send error log with context data', async () => {
      const message = 'Component error'
      const context = {
        component: 'TestComponent',
        action: 'buttonClick',
        userId: '123'
      }

      logClientError(message, context)

      await new Promise((resolve) => setTimeout(resolve, 0))

      const call = mockFetch.mock.calls[0]
      const body = JSON.parse(call[1].body)

      expect(body.level).toBe('error')
      expect(body.message).toBe(message)
      expect(body.context).toMatchObject(context)
      expect(body.context.clientTimestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
      )
    })

    it('should include valid ISO timestamp', async () => {
      logClientError('Test message')

      await new Promise((resolve) => setTimeout(resolve, 0))

      const call = mockFetch.mock.calls[0]
      const body = JSON.parse(call[1].body)
      const timestamp = body.context.clientTimestamp

      // Verify it's a valid ISO string
      expect(new Date(timestamp).toISOString()).toBe(timestamp)
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
    })

    it('should handle empty context gracefully', async () => {
      logClientError('Test message', {})

      await new Promise((resolve) => setTimeout(resolve, 0))

      const call = mockFetch.mock.calls[0]
      const body = JSON.parse(call[1].body)

      expect(body.level).toBe('error')
      expect(body.message).toBe('Test message')
      expect(body.context.clientTimestamp).toBeDefined()
    })
  })

  describe('logClientInfo', () => {
    it('should send info log to server with basic message', async () => {
      const message = 'Test info message'

      logClientInfo(message)

      await new Promise((resolve) => setTimeout(resolve, 0))

      const call = mockFetch.mock.calls[0]
      const body = JSON.parse(call[1].body)

      expect(body.level).toBe('info')
      expect(body.message).toBe(message)
      expect(body.context.clientTimestamp).toBeDefined()
    })

    it('should send info log with context data', async () => {
      const message = 'User action'
      const context = {
        component: 'Header',
        action: 'search',
        query: 'react'
      }

      logClientInfo(message, context)

      await new Promise((resolve) => setTimeout(resolve, 0))

      const call = mockFetch.mock.calls[0]
      const body = JSON.parse(call[1].body)

      expect(body.level).toBe('info')
      expect(body.message).toBe(message)
      expect(body.context).toMatchObject(context)
      expect(body.context.clientTimestamp).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should fallback to console.error when fetch fails', async () => {
      const fetchError = new Error('Network error')
      mockFetch.mockRejectedValueOnce(fetchError)

      const message = 'Test error'
      const context = {component: 'TestComponent'}

      logClientError(message, context)

      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(console.error).toHaveBeenCalledWith(
        'Failed to send log to server:',
        fetchError
      )
      expect(console.error).toHaveBeenCalledWith(
        'Original log:',
        expect.objectContaining({
          level: 'error',
          message
        })
      )
    })

    it('should handle fetch rejection gracefully for info logs', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Server unavailable'))

      const message = 'Info message'

      logClientInfo(message)

      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(console.error).toHaveBeenCalledWith(
        'Failed to send log to server:',
        expect.any(Error)
      )
      expect(console.error).toHaveBeenCalledWith(
        'Original log:',
        expect.objectContaining({
          level: 'info',
          message
        })
      )
    })

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout')
      timeoutError.name = 'AbortError'
      mockFetch.mockRejectedValueOnce(timeoutError)

      logClientError('Timeout test')

      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(console.error).toHaveBeenCalledWith(
        'Failed to send log to server:',
        timeoutError
      )
    })
  })

  describe('integration scenarios', () => {
    it('should handle multiple rapid log calls', async () => {
      const messages = ['Error 1', 'Error 2', 'Error 3']

      messages.forEach((msg) => logClientError(msg))

      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockFetch).toHaveBeenCalledTimes(3)

      // Verify each call
      messages.forEach((msg, index) => {
        const call = mockFetch.mock.calls[index]
        const body = JSON.parse(call[1].body)
        expect(body.level).toBe('error')
        expect(body.message).toBe(msg)
        expect(body.context.clientTimestamp).toBeDefined()
      })
    })

    it('should handle mixed log levels', async () => {
      logClientError('Error message')
      logClientInfo('Info message')

      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockFetch).toHaveBeenCalledTimes(2)

      const calls = mockFetch.mock.calls
      const errorCall = JSON.parse(calls[0][1].body)
      const infoCall = JSON.parse(calls[1][1].body)

      expect(errorCall.level).toBe('error')
      expect(infoCall.level).toBe('info')
    })

    it('should preserve context object integrity', async () => {
      const context = {
        component: 'ComplexComponent',
        action: 'formSubmit',
        formData: {
          field1: 'value1',
          field2: 42,
          field3: true
        },
        metadata: {
          nested: {
            deep: 'value'
          }
        }
      }

      logClientError('Form submission error', context)

      await new Promise((resolve) => setTimeout(resolve, 0))

      const call = mockFetch.mock.calls[0]
      const body = JSON.parse(call[1].body)

      expect(body.context).toMatchObject(context)
      expect(body.context.clientTimestamp).toBeDefined()
      expect(body.context.formData.field2).toBe(42)
      expect(body.context.metadata.nested.deep).toBe('value')
    })
  })
})
