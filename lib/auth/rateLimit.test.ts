import {NextRequest} from 'next/server'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {checkRateLimit, cleanupRateLimitStore} from './rateLimit'

vi.mock('@/lib/utils/logError', () => ({
  logError: vi.fn()
}))

import {logError} from '@/lib/utils/logError'

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
  let mockLogError: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockLogError = vi.mocked(logError)
    mockLogError.mockClear()
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

      // Make 199 requests (under limit of 200)
      for (let i = 0; i < 199; i++) {
        const result = await checkRateLimit(request)
        expect(result).toBeNull()
      }
    })

    it('should block 201st request when limit exceeded', async () => {
      const request = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.3'
      })

      // Make 200 requests (at limit)
      for (let i = 0; i < 200; i++) {
        const result = await checkRateLimit(request)
        expect(result).toBeNull()
      }

      // 201st request should be blocked
      const result = await checkRateLimit(request)
      expect(result).not.toBeNull()
      expect(result?.status).toBe(429)
    })

    it('should return 429 response with proper error message', async () => {
      const request = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.4'
      })

      // Exhaust rate limit
      for (let i = 0; i < 200; i++) {
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
      for (let i = 0; i < 200; i++) {
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
      for (let i = 0; i < 200; i++) {
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
      for (let i = 0; i < 200; i++) {
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
      for (let i = 0; i < 200; i++) {
        await checkRateLimit(request)
      }

      const result = await checkRateLimit(request)
      expect(result?.status).toBe(429)
    })

    it('should handle multiple requests from anonymous users', async () => {
      const request1 = createMockNextRequest('http://localhost:3000', {})
      const request2 = createMockNextRequest('http://localhost:3000', {})

      // All anonymous requests share the same rate limit
      for (let i = 0; i < 100; i++) {
        await checkRateLimit(request1)
      }

      for (let i = 0; i < 100; i++) {
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
      for (let i = 0; i < 200; i++) {
        await checkRateLimit(request)
      }

      // Verify blocked
      let result = await checkRateLimit(request)
      expect(result?.status).toBe(429)

      // Advance time past 1 minute window
      vi.setSystemTime(now + 60 * 1000 + 1000)

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
      for (let i = 0; i < 200; i++) {
        await checkRateLimit(request)
      }

      // Advance time but not past window (30 seconds)
      vi.setSystemTime(now + 30 * 1000)

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

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await checkRateLimit(request)
      }

      // Advance time past window (61 seconds)
      vi.setSystemTime(now + 61 * 1000)

      // Make 200 more requests (old ones should be expired)
      for (let i = 0; i < 200; i++) {
        const result = await checkRateLimit(request)
        expect(result).toBeNull()
      }

      // 201st should be blocked
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
      for (let i = 0; i < 200; i++) {
        await checkRateLimit(request)
      }

      const result = await checkRateLimit(request)
      const json = await result?.json()

      // Should be approximately 1 minute (60 seconds)
      expect(json.retryAfter).toBeGreaterThan(55)
      expect(json.retryAfter).toBeLessThanOrEqual(60)
    })
  })

  describe('concurrent requests', () => {
    it('should handle concurrent requests from same IP', async () => {
      const request = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.13'
      })

      // Simulate 210 concurrent requests
      const promises = Array.from({length: 210}, () => checkRateLimit(request))
      const results = await Promise.all(promises)

      // First 200 should pass, rest should be blocked
      const passed = results.filter((r) => r === null).length
      const blocked = results.filter((r) => r !== null).length

      expect(passed).toBe(200)
      expect(blocked).toBe(10)
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

      // Each IP makes 200 concurrent requests
      const allPromises: Promise<any>[] = []
      for (const request of requests) {
        for (let i = 0; i < 200; i++) {
          allPromises.push(checkRateLimit(request))
        }
      }

      const results = await Promise.all(allPromises)

      // All should pass (each IP has its own limit)
      const passed = results.filter((r) => r === null).length
      expect(passed).toBe(1000)
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

      // Make exactly 200 requests
      for (let i = 0; i < 200; i++) {
        const result = await checkRateLimit(request)
        expect(result).toBeNull()
      }

      // Next one should be blocked
      const result = await checkRateLimit(request)
      expect(result?.status).toBe(429)
    })
  })

  describe('error logging', () => {
    it('should log error when rate limit exceeded', async () => {
      const request = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.27'
      })

      // Exhaust rate limit
      for (let i = 0; i < 200; i++) {
        await checkRateLimit(request)
      }

      mockLogError.mockClear()

      await checkRateLimit(request)

      expect(mockLogError).toHaveBeenCalledWith(
        'Rate limit exceeded',
        expect.objectContaining({
          component: 'RateLimit',
          action: 'checkRateLimit',
          identifier: '192.168.1.27',
          remaining: 0,
          resetAt: expect.any(String)
        })
      )
    })
  })

  describe('cleanup functionality', () => {
    it('should clean up expired entries from store', async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      // Create requests that will expire
      const request1 = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.100'
      })
      const request2 = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.101'
      })

      // Make some requests
      for (let i = 0; i < 50; i++) {
        await checkRateLimit(request1)
        await checkRateLimit(request2)
      }

      // Advance time past window
      vi.setSystemTime(now + 61 * 1000)

      // Call cleanup function directly
      cleanupRateLimitStore()

      // Make new requests - should have fresh quota since old entries were cleaned up
      for (let i = 0; i < 200; i++) {
        const result1 = await checkRateLimit(request1)
        const result2 = await checkRateLimit(request2)
        expect(result1).toBeNull()
        expect(result2).toBeNull()
      }
    })

    it('should handle store with mix of expired and valid entries', async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      const request = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.102'
      })

      // Make 100 requests at time T
      for (let i = 0; i < 100; i++) {
        await checkRateLimit(request)
      }

      // Advance 30 seconds (still within window)
      vi.setSystemTime(now + 30 * 1000)

      // Make 100 more requests at time T+30s
      for (let i = 0; i < 100; i++) {
        await checkRateLimit(request)
      }

      // Should be at limit (200 requests)
      let result = await checkRateLimit(request)
      expect(result?.status).toBe(429)

      // Advance to 61 seconds (first 100 should expire)
      vi.setSystemTime(now + 61 * 1000)

      // Should allow 100 more requests now
      for (let i = 0; i < 100; i++) {
        result = await checkRateLimit(request)
        expect(result).toBeNull()
      }

      // Should be at limit again
      result = await checkRateLimit(request)
      expect(result?.status).toBe(429)
    })

    it('should remove entries with no valid timestamps', async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      const request = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.103'
      })

      // Make some requests
      for (let i = 0; i < 10; i++) {
        await checkRateLimit(request)
      }

      // Advance time past window (all entries should expire)
      vi.setSystemTime(now + 61 * 1000)

      // Run cleanup
      cleanupRateLimitStore()

      // Make full quota of requests - should work since entry was deleted
      for (let i = 0; i < 200; i++) {
        const result = await checkRateLimit(request)
        expect(result).toBeNull()
      }
    })

    it('should preserve entries with valid timestamps', async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      const request = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.104'
      })

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await checkRateLimit(request)
      }

      // Advance time but stay within window (30 seconds)
      vi.setSystemTime(now + 30 * 1000)

      // Run cleanup - should preserve all entries
      cleanupRateLimitStore()

      // Should only be able to make 100 more requests
      for (let i = 0; i < 100; i++) {
        const result = await checkRateLimit(request)
        expect(result).toBeNull()
      }

      // 201st should be blocked
      const result = await checkRateLimit(request)
      expect(result?.status).toBe(429)
    })

    it('should handle empty store gracefully', () => {
      // Just run cleanup on potentially empty store
      expect(() => cleanupRateLimitStore()).not.toThrow()
    })

    it('should cleanup multiple IPs with different expiration times', async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      const request1 = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.105'
      })
      const request2 = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.106'
      })
      const request3 = createMockNextRequest('http://localhost:3000', {
        'x-forwarded-for': '192.168.1.107'
      })

      // IP1: Make requests at T=0
      for (let i = 0; i < 50; i++) {
        await checkRateLimit(request1)
      }

      // Advance 30 seconds
      vi.setSystemTime(now + 30 * 1000)

      // IP2: Make requests at T=30s
      for (let i = 0; i < 50; i++) {
        await checkRateLimit(request2)
      }

      // Advance to 61 seconds (IP1 entries should expire, IP2 should remain)
      vi.setSystemTime(now + 61 * 1000)

      // IP3: Make requests at T=61s
      for (let i = 0; i < 50; i++) {
        await checkRateLimit(request3)
      }

      // Run cleanup
      cleanupRateLimitStore()

      // IP1 should have full quota (old entries cleaned up)
      for (let i = 0; i < 200; i++) {
        const result = await checkRateLimit(request1)
        expect(result).toBeNull()
      }

      // IP2 should have 150 remaining (50 used, still valid)
      for (let i = 0; i < 150; i++) {
        const result = await checkRateLimit(request2)
        expect(result).toBeNull()
      }
      expect((await checkRateLimit(request2))?.status).toBe(429)

      // IP3 should have 150 remaining (50 used)
      for (let i = 0; i < 150; i++) {
        const result = await checkRateLimit(request3)
        expect(result).toBeNull()
      }
      expect((await checkRateLimit(request3))?.status).toBe(429)
    })
  })
})
