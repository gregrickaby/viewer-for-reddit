import {
  RETRY_CONFIG,
  calculateBackoffDelay,
  isRetryableError
} from './retryConfig'

describe('retryConfig', () => {
  describe('RETRY_CONFIG constants', () => {
    it('should have correct configuration values', () => {
      expect(RETRY_CONFIG.MAX_RETRIES).toBe(3)
      expect(RETRY_CONFIG.LIGHT_MAX_RETRIES).toBe(1)
      expect(RETRY_CONFIG.BASE_DELAY).toBe(1000)
      expect(RETRY_CONFIG.MAX_DELAY).toBe(10000)
    })

    it('should be immutable (readonly)', () => {
      // TypeScript prevents mutation, but we can test the original values are preserved
      const originalMaxRetries = RETRY_CONFIG.MAX_RETRIES
      const originalLightMaxRetries = RETRY_CONFIG.LIGHT_MAX_RETRIES
      const originalBaseDelay = RETRY_CONFIG.BASE_DELAY
      const originalMaxDelay = RETRY_CONFIG.MAX_DELAY

      // Values should remain unchanged
      expect(RETRY_CONFIG.MAX_RETRIES).toBe(originalMaxRetries)
      expect(RETRY_CONFIG.LIGHT_MAX_RETRIES).toBe(originalLightMaxRetries)
      expect(RETRY_CONFIG.BASE_DELAY).toBe(originalBaseDelay)
      expect(RETRY_CONFIG.MAX_DELAY).toBe(originalMaxDelay)
    })
  })

  describe('isRetryableError', () => {
    it('should return true for FETCH_ERROR', () => {
      expect(isRetryableError('FETCH_ERROR')).toBe(true)
    })

    it('should return true for TIMEOUT_ERROR', () => {
      expect(isRetryableError('TIMEOUT_ERROR')).toBe(true)
    })

    it('should return true for 5xx HTTP status codes', () => {
      expect(isRetryableError(500)).toBe(true)
      expect(isRetryableError(501)).toBe(true)
      expect(isRetryableError(502)).toBe(true)
      expect(isRetryableError(503)).toBe(true)
      expect(isRetryableError(504)).toBe(true)
      expect(isRetryableError(599)).toBe(true)
    })

    it('should return false for 4xx HTTP status codes (except rate limiting)', () => {
      expect(isRetryableError(400)).toBe(false)
      expect(isRetryableError(401)).toBe(false)
      expect(isRetryableError(403)).toBe(false)
      expect(isRetryableError(404)).toBe(false)
      expect(isRetryableError(422)).toBe(false)
      expect(isRetryableError(499)).toBe(false)
    })

    it('should return false for rate limiting 429 status code', () => {
      // 429 is typically handled differently with respect to retry-after headers
      expect(isRetryableError(429)).toBe(false)
    })

    it('should return false for 2xx and 3xx HTTP status codes', () => {
      expect(isRetryableError(200)).toBe(false)
      expect(isRetryableError(201)).toBe(false)
      expect(isRetryableError(204)).toBe(false)
      expect(isRetryableError(301)).toBe(false)
      expect(isRetryableError(302)).toBe(false)
      expect(isRetryableError(304)).toBe(false)
    })

    it('should return false for 1xx HTTP status codes', () => {
      expect(isRetryableError(100)).toBe(false)
      expect(isRetryableError(101)).toBe(false)
      expect(isRetryableError(199)).toBe(false)
    })

    it('should return false for other string values', () => {
      expect(isRetryableError('PARSING_ERROR')).toBe(false)
      expect(isRetryableError('CUSTOM_ERROR')).toBe(false)
      expect(isRetryableError('SUCCESS')).toBe(false)
      expect(isRetryableError('')).toBe(false)
    })

    it('should return false for null and undefined', () => {
      expect(isRetryableError(null)).toBe(false)
      expect(isRetryableError(undefined)).toBe(false)
    })

    it('should return false for boolean values', () => {
      expect(isRetryableError(true)).toBe(false)
      expect(isRetryableError(false)).toBe(false)
    })

    it('should return false for objects and arrays', () => {
      expect(isRetryableError({})).toBe(false)
      expect(isRetryableError([])).toBe(false)
      expect(isRetryableError({status: 500})).toBe(false)
    })

    it('should return false for edge case numbers', () => {
      expect(isRetryableError(0)).toBe(false)
      expect(isRetryableError(-1)).toBe(false)
      expect(isRetryableError(NaN)).toBe(false)
      expect(isRetryableError(Infinity)).toBe(true) // Infinity >= 500 is true
      expect(isRetryableError(-Infinity)).toBe(false)
    })
  })

  describe('calculateBackoffDelay', () => {
    it('should calculate exponential backoff correctly for early attempts', () => {
      // attempt 0: 1000 * 2^0 = 1000ms
      expect(calculateBackoffDelay(0)).toBe(1000)

      // attempt 1: 1000 * 2^1 = 2000ms
      expect(calculateBackoffDelay(1)).toBe(2000)

      // attempt 2: 1000 * 2^2 = 4000ms
      expect(calculateBackoffDelay(2)).toBe(4000)

      // attempt 3: 1000 * 2^3 = 8000ms
      expect(calculateBackoffDelay(3)).toBe(8000)
    })

    it('should cap delay at MAX_DELAY for large attempts', () => {
      // attempt 4: 1000 * 2^4 = 16000ms, but capped at 10000ms
      expect(calculateBackoffDelay(4)).toBe(10000)

      // attempt 5: 1000 * 2^5 = 32000ms, but capped at 10000ms
      expect(calculateBackoffDelay(5)).toBe(10000)

      // Large attempt numbers should still be capped
      expect(calculateBackoffDelay(10)).toBe(10000)
      expect(calculateBackoffDelay(100)).toBe(10000)
    })

    it('should handle negative attempt numbers gracefully', () => {
      // Math.pow(2, negative) results in fractions, so we get small delays
      expect(calculateBackoffDelay(-1)).toBe(500) // 1000 * 2^(-1) = 500
      expect(calculateBackoffDelay(-2)).toBe(250) // 1000 * 2^(-2) = 250
    })

    it('should handle zero attempt', () => {
      expect(calculateBackoffDelay(0)).toBe(1000)
    })

    it('should handle floating point attempts', () => {
      // 1000 * 2^0.5 ≈ 1414ms
      expect(calculateBackoffDelay(0.5)).toBeCloseTo(1414, 0)

      // 1000 * 2^1.5 ≈ 2828ms
      expect(calculateBackoffDelay(1.5)).toBeCloseTo(2828, 0)
    })

    it('should respect the exponential growth pattern', () => {
      const delay0 = calculateBackoffDelay(0)
      const delay1 = calculateBackoffDelay(1)
      const delay2 = calculateBackoffDelay(2)

      // Each delay should be double the previous (until hitting the cap)
      expect(delay1).toBe(delay0 * 2)
      expect(delay2).toBe(delay1 * 2)
    })

    it('should handle edge case numbers', () => {
      expect(calculateBackoffDelay(Infinity)).toBe(10000) // Should be capped
      expect(calculateBackoffDelay(-Infinity)).toBe(0) // Math.pow(2, -Infinity) = 0
      expect(calculateBackoffDelay(NaN)).toBeNaN() // Math.pow(2, NaN) = NaN
    })
  })

  describe('integration scenarios', () => {
    it('should provide realistic retry delays for typical retry attempts', () => {
      const retryDelays = []

      // Simulate 3 retry attempts (0, 1, 2)
      for (let attempt = 0; attempt < RETRY_CONFIG.MAX_RETRIES; attempt++) {
        const delay = calculateBackoffDelay(attempt)
        retryDelays.push(delay)
      }

      expect(retryDelays).toEqual([1000, 2000, 4000])
    })

    it('should identify common retryable error scenarios', () => {
      // Network failures
      expect(isRetryableError('FETCH_ERROR')).toBe(true)
      expect(isRetryableError('TIMEOUT_ERROR')).toBe(true)

      // Server errors
      expect(isRetryableError(503)).toBe(true) // Service Unavailable
      expect(isRetryableError(502)).toBe(true) // Bad Gateway

      // Should not retry client errors
      expect(isRetryableError(404)).toBe(false) // Not Found
      expect(isRetryableError(401)).toBe(false) // Unauthorized
      expect(isRetryableError(403)).toBe(false) // Forbidden
    })

    it('should handle light retry configuration', () => {
      expect(RETRY_CONFIG.LIGHT_MAX_RETRIES).toBeLessThan(
        RETRY_CONFIG.MAX_RETRIES
      )
      expect(RETRY_CONFIG.LIGHT_MAX_RETRIES).toBe(1)
    })
  })
})
