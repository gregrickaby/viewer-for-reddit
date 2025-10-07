import {NextRequest} from 'next/server'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {POST} from './route'

// Mock the logError utility
vi.mock('@/lib/utils/logging/logError', () => ({
  logError: vi.fn()
}))

// Mock the validateOrigin utility
vi.mock('@/lib/utils/validation/validateOrigin', () => ({
  validateOrigin: vi.fn()
}))

const mockLogError = vi.mocked(
  (await import('@/lib/utils/logging/logError')).logError
)
const mockValidateOrigin = vi.mocked(
  (await import('@/lib/utils/validation/validateOrigin')).validateOrigin
)

describe('Log API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2023-01-01T12:00:00.000Z'))
    // Default to allowing requests (individual tests can override)
    mockValidateOrigin.mockReturnValue(true)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Origin Validation', () => {
    it('should block requests with invalid origins', async () => {
      mockValidateOrigin.mockReturnValue(false)

      const requestBody = {
        level: 'error',
        message: 'Test error message',
        context: {component: 'TestComponent'}
      }

      const request = new NextRequest('http://localhost:3000/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          origin: 'https://malicious.com'
        },
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data).toEqual({error: 'Forbidden'})
      expect(mockValidateOrigin).toHaveBeenCalledWith(request)
      expect(mockLogError).not.toHaveBeenCalled()
    })

    it('should allow requests with valid origins', async () => {
      mockValidateOrigin.mockReturnValue(true)

      const requestBody = {
        level: 'error',
        message: 'Test error message',
        context: {component: 'TestComponent'}
      }

      const request = new NextRequest('http://localhost:3000/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          origin: 'http://localhost:3000'
        },
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockValidateOrigin).toHaveBeenCalledWith(request)
    })
  })

  describe('POST /api/log', () => {
    it('should process error level logs and call logError', async () => {
      const requestBody = {
        level: 'error',
        message: 'Test error message',
        context: {
          component: 'TestComponent',
          action: 'testAction',
          userAgent: 'test-browser'
        }
      }

      const request = new NextRequest('http://localhost:3000/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Mozilla/5.0'
        },
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({success: true})
      expect(mockLogError).toHaveBeenCalledWith('Test error message', {
        component: 'TestComponent',
        action: 'testAction',
        userAgent: 'test-browser',
        serverTimestamp: '2023-01-01T12:00:00.000Z',
        clientIp: '192.168.1.1',
        serverUserAgent: 'Mozilla/5.0'
      })
    })

    it('should process info level logs and call console.info', async () => {
      const requestBody = {
        level: 'info',
        message: 'Test info message',
        context: {
          component: 'TestComponent',
          userId: '123'
        }
      }

      const request = new NextRequest('http://localhost:3000/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-real-ip': '10.0.0.1',
          'user-agent': 'Chrome/91.0'
        },
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({success: true})
      expect(console.info).toHaveBeenCalledWith(
        JSON.stringify(
          {
            timestamp: '2023-01-01T12:00:00.000Z',
            level: 'info',
            message: 'Test info message',
            context: {
              component: 'TestComponent',
              userId: '123',
              serverTimestamp: '2023-01-01T12:00:00.000Z',
              clientIp: '10.0.0.1',
              serverUserAgent: 'Chrome/91.0'
            }
          },
          null,
          2
        )
      )
    })

    it('should handle requests without x-forwarded-for or x-real-ip headers', async () => {
      const requestBody = {
        level: 'error',
        message: 'Test message',
        context: {}
      }

      const request = new NextRequest('http://localhost:3000/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({success: true})
      expect(mockLogError).toHaveBeenCalledWith('Test message', {
        serverTimestamp: '2023-01-01T12:00:00.000Z',
        clientIp: 'unknown',
        serverUserAgent: null
      })
    })

    it('should handle requests with minimal context', async () => {
      const requestBody = {
        level: 'error',
        message: 'Minimal test',
        context: undefined
      }

      const request = new NextRequest('http://localhost:3000/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({success: true})
      expect(mockLogError).toHaveBeenCalledWith('Minimal test', {
        serverTimestamp: '2023-01-01T12:00:00.000Z',
        clientIp: 'unknown',
        serverUserAgent: null
      })
    })

    it('should handle other log levels with console.info', async () => {
      const requestBody = {
        level: 'warn',
        message: 'Warning message',
        context: {action: 'test'}
      }

      const request = new NextRequest('http://localhost:3000/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({success: true})
      expect(console.info).toHaveBeenCalledWith(
        JSON.stringify(
          {
            timestamp: '2023-01-01T12:00:00.000Z',
            level: 'warn',
            message: 'Warning message',
            context: {
              action: 'test',
              serverTimestamp: '2023-01-01T12:00:00.000Z',
              clientIp: 'unknown',
              serverUserAgent: null
            }
          },
          null,
          2
        )
      )
    })

    it('should handle invalid JSON and return 500 error', async () => {
      const request = new NextRequest('http://localhost:3000/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: 'invalid json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({error: 'Failed to process log'})
      expect(mockLogError).toHaveBeenCalledWith(expect.any(SyntaxError), {
        component: 'LoggingAPI',
        action: 'POST',
        context: 'Failed to process client-side log'
      })
    })

    it('should handle requests with missing fields gracefully', async () => {
      const requestBody = {
        level: 'error'
        // Missing message and context
      }

      const request = new NextRequest('http://localhost:3000/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({success: true})
      expect(mockLogError).toHaveBeenCalledWith(undefined, {
        serverTimestamp: '2023-01-01T12:00:00.000Z',
        clientIp: 'unknown',
        serverUserAgent: null
      })
    })

    it('should prioritize x-forwarded-for over x-real-ip for client IP', async () => {
      const requestBody = {
        level: 'error',
        message: 'IP priority test',
        context: {}
      }

      const request = new NextRequest('http://localhost:3000/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.100',
          'x-real-ip': '10.0.0.50'
        },
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockLogError).toHaveBeenCalledWith('IP priority test', {
        serverTimestamp: '2023-01-01T12:00:00.000Z',
        clientIp: '192.168.1.100', // Should use x-forwarded-for
        serverUserAgent: null
      })
    })
  })
})
