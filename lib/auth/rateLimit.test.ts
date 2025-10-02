import {NextRequest} from 'next/server'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {checkRateLimit} from './rateLimit'

// Mock NextRequest for testing
function createMockNextRequest(
  url = 'http://localhost:3000',
  headers: Record<string, string> = {}
): NextRequest {
  return {
    url,
    headers: {
      get: (name: string) => headers[name.toLowerCase()] || null
    }
  } as NextRequest
}

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('basic rate limiting', () => {
    it('should allow first request from IP', async () => {
      const request = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.1'
      })

      const result = await checkRateLimit(request)

      expect(result).toBeNull()
    })

    it('should allow requests under the limit', async () => {
      const request = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.2'
      })

      // Make 9 requests (under limit of 10)
      for (let i = 0; i < 9; i++) {
        const result = await checkRateLimit(request)
        expect(result).toBeNull()
      }
    })

    it('should block 11th request when limit exceeded', async () => {
      const request = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.3'
      })

      // Make 10 requests (at limit)
      for (let i = 0; i < 10; i++) {
        const result = await checkRateLimit(request)
        expect(result).toBeNull()
      }

      // 11th request should be blocked
      const result = await checkRateLimit(request)
      expect(result).not.toBeNull()
      expect(result?.status).toBe(429)
    })

    it('should return 429 response with proper error message', async () => {
      const request = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.4'
      })

      // Exhaust rate limit
      for (let i = 0; i < 10; i++) {
        await checkRateLimit(request)
      }

      const result = await checkRateLimit(request)
      expect(result).not.toBeNull()

      const json = await result?.json()
      expect(json).toEqual({
        error: 'rate_limit_exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: expect.any(Number)
      })
    })

    it('should include rate limit headers in 429 response', async () => {
      const request = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.5'
      })

      // Exhaust rate limit
      for (let i = 0; i < 10; i++) {
        await checkRateLimit(request)
      }

      const result = await checkRateLimit(request)
      expect(result).not.toBeNull()

      expect(result?.headers.get('Retry-After')).toBeTruthy()
      expect(result?.headers.get('X-RateLimit-Remaining')).toBe('0')
      expect(result?.headers.get('X-RateLimit-Reset')).toBeTruthy()
    })
  })

  describe('identifier handling', () => {
    it('should use x-forwarded-for header as identifier', async () => {
      const request = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.6'
      })

      // Exhaust limit for this IP
      for (let i = 0; i < 10; i++) {
        await checkRateLimit(request)
      }

      const result = await checkRateLimit(request)
      expect(result?.status).toBe(429)

      // Different IP should not be blocked
      const differentRequest = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.7'
      })
      const differentResult = await checkRateLimit(differentRequest)
      expect(differentResult).toBeNull()
    })

    it('should use custom identifier when provided', async () => {
      const request = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.8'
      })

      // Use custom identifier
      const customId = 'user_123'

      // Exhaust limit for custom identifier
      for (let i = 0; i < 10; i++) {
        await checkRateLimit(request, customId)
      }

      const result = await checkRateLimit(request, customId)
      expect(result?.status).toBe(429)

      // Same IP but different identifier should not be blocked
      const differentId = 'user_456'
      const differentResult = await checkRateLimit(request, differentId)
      expect(differentResult).toBeNull()
    })

    it('should fall back to "anonymous" when no IP header available', async () => {
      const request = createMockNextRequest('http://localhost:3000', {})

      // Exhaust limit for anonymous
      for (let i = 0; i < 10; i++) {
        await checkRateLimit(request)
      }

      const result = await checkRateLimit(request)
      expect(result?.status).toBe(429)
    })

    it('should handle multiple requests from anonymous users', async () => {
      const request1 = createMockNextRequest('http://localhost:3000', {})
      const request2 = createMockNextRequest('http://localhost:3000', {})

      // All anonymous requests share the same rate limit
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(request1)
      }

      for (let i = 0; i < 5; i++) {
        await checkRateLimit(request2)
      }

      // Next request should be blocked
      const result = await checkRateLimit(request1)
      expect(result?.status).toBe(429)
    })
  })

  describe('time window behavior', () => {
    it('should reset limit after time window expires', async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      const request = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.9'
      })

      // Exhaust rate limit
      for (let i = 0; i < 10; i++) {
        await checkRateLimit(request)
      }

      // Verify blocked
      let result = await checkRateLimit(request)
      expect(result?.status).toBe(429)

      // Advance time past 10 minute window
      vi.setSystemTime(now + 10 * 60 * 1000 + 1000)

      // Should be allowed again
      result = await checkRateLimit(request)
      expect(result).toBeNull()
    })

    it('should keep blocking if time window has not expired', async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      const request = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.10'
      })

      // Exhaust rate limit
      for (let i = 0; i < 10; i++) {
        await checkRateLimit(request)
      }

      // Advance time but not past window
      vi.setSystemTime(now + 5 * 60 * 1000)

      // Should still be blocked
      const result = await checkRateLimit(request)
      expect(result?.status).toBe(429)
    })

    it('should only count requests within time window', async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      const request = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.11'
      })

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(request)
      }

      // Advance time past window
      vi.setSystemTime(now + 11 * 60 * 1000)

      // Make 10 more requests (old ones should be expired)
      for (let i = 0; i < 10; i++) {
        const result = await checkRateLimit(request)
        expect(result).toBeNull()
      }

      // 11th should be blocked
      const result = await checkRateLimit(request)
      expect(result?.status).toBe(429)
    })

    it('should calculate correct retry-after time', async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      const request = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.12'
      })

      // Exhaust rate limit
      for (let i = 0; i < 10; i++) {
        await checkRateLimit(request)
      }

      const result = await checkRateLimit(request)
      const json = await result?.json()

      // Should be approximately 10 minutes (600 seconds)
      expect(json.retryAfter).toBeGreaterThan(595)
      expect(json.retryAfter).toBeLessThanOrEqual(600)
    })
  })

  describe('concurrent requests', () => {
    it('should handle concurrent requests from same IP', async () => {
      const request = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.13'
      })

      // Simulate 15 concurrent requests
      const promises = Array.from({length: 15}, () => checkRateLimit(request))
      const results = await Promise.all(promises)

      // First 10 should pass, rest should be blocked
      const passed = results.filter((r) => r === null).length
      const blocked = results.filter((r) => r !== null).length

      expect(passed).toBe(10)
      expect(blocked).toBe(5)
    })

    it('should handle requests from different IPs concurrently', async () => {
      // Create 5 different IP addresses
      const requests = [
        createMockNextRequest('http://localhost:3000', {
          'x-forwarded-for': '192.168.1.20'
        }),
        createMockNextRequest('http://localhost:3000', {
          'x-forwarded-for': '192.168.1.21'
        }),
        createMockNextRequest('http://localhost:3000', {
          'x-forwarded-for': '192.168.1.22'
        }),
        createMockNextRequest('http://localhost:3000', {
          'x-forwarded-for': '192.168.1.23'
        }),
        createMockNextRequest('http://localhost:3000', {
          'x-forwarded-for': '192.168.1.24'
        })
      ]

      // Each IP makes 10 concurrent requests
      const allPromises: Promise<any>[] = []
      for (const request of requests) {
        for (let i = 0; i < 10; i++) {
          allPromises.push(checkRateLimit(request))
        }
      }

      const results = await Promise.all(allPromises)

      // All should pass (each IP has its own limit)
      const passed = results.filter((r) => r === null).length
      expect(passed).toBe(50)
    })
  })

  describe('edge cases', () => {
    it('should handle empty x-forwarded-for header', async () => {
      const request = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': ''
      })

      // Use a unique identifier to avoid state from previous tests
      const result = await checkRateLimit(request, 'edge-case-empty')
      expect(result).toBeNull()
    })

    it('should handle whitespace in x-forwarded-for header', async () => {
      const request = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '  192.168.1.25  '
      })

      // Should still work (implementation should trim)
      const result = await checkRateLimit(request)
      expect(result).toBeNull()
    })

    it('should handle exactly at limit boundary', async () => {
      const request = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.26'
      })

      // Make exactly 10 requests
      for (let i = 0; i < 10; i++) {
        const result = await checkRateLimit(request)
        expect(result).toBeNull()
      }

      // Next one should be blocked
      const result = await checkRateLimit(request)
      expect(result?.status).toBe(429)
    })
  })

  describe('console warnings', () => {
    it('should log warning when rate limit exceeded', async () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {})

      const request = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.27'
      })

      // Exhaust rate limit
      for (let i = 0; i < 10; i++) {
        await checkRateLimit(request)
      }

      await checkRateLimit(request)

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Rate limit exceeded:',
        expect.objectContaining({
          identifier: expect.any(String),
          remaining: 0,
          resetAt: expect.any(String),
          timestamp: expect.any(String)
        })
      )

      consoleWarnSpy.mockRestore()
    })
  })
})
