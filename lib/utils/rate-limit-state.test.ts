import {beforeEach, describe, expect, it, vi} from 'vitest'
import {
  getRateLimitState,
  getRetryAfterMs,
  isRateLimited,
  recordRateLimit,
  resetRateLimit,
  waitForRateLimit
} from './rate-limit-state'

describe('rate-limit-state', () => {
  beforeEach(() => {
    // Reset state before each test
    resetRateLimit()
    vi.clearAllMocks()
  })

  describe('recordRateLimit', () => {
    it('records rate limit with provided retry-after seconds', () => {
      const retryAfterSeconds = 60

      recordRateLimit(retryAfterSeconds)

      const state = getRateLimitState()
      expect(state.isLimited).toBe(true)
      expect(state.limitCount).toBe(1)
      expect(state.retryAfter).toBeGreaterThan(Date.now())
    })

    it('uses exponential backoff when retry-after is 0', () => {
      recordRateLimit(0)

      const state = getRateLimitState()
      expect(state.isLimited).toBe(true)
      expect(state.limitCount).toBe(1)
      // First backoff: 30 seconds
      expect(state.retryAfter).toBeGreaterThan(Date.now() + 29000)
      expect(state.retryAfter).toBeLessThan(Date.now() + 31000)
    })

    it('uses exponential backoff when retry-after is undefined', () => {
      recordRateLimit()

      const state = getRateLimitState()
      expect(state.isLimited).toBe(true)
      expect(state.limitCount).toBe(1)
    })

    it('increases backoff time with consecutive rate limits', () => {
      // First limit: 30 seconds
      recordRateLimit()
      const firstState = getRateLimitState()
      const firstRetryAfter = firstState.retryAfter!

      // Second limit: 60 seconds
      recordRateLimit()
      const secondState = getRateLimitState()
      const secondRetryAfter = secondState.retryAfter!

      expect(secondState.limitCount).toBe(2)
      expect(secondRetryAfter).toBeGreaterThan(firstRetryAfter)
    })

    it('caps backoff at 300 seconds (5 minutes)', () => {
      // Record many consecutive rate limits
      for (let i = 0; i < 10; i++) {
        recordRateLimit()
      }

      const state = getRateLimitState()
      const waitTime = state.retryAfter! - Date.now()

      // Should not exceed 300 seconds (plus small buffer for timing)
      expect(waitTime).toBeLessThan(301000)
    })
  })

  describe('isRateLimited', () => {
    it('returns false when not rate limited', () => {
      expect(isRateLimited()).toBe(false)
    })

    it('returns true when rate limited and retry time not elapsed', () => {
      recordRateLimit(60)
      expect(isRateLimited()).toBe(true)
    })
  })

  describe('getRetryAfterMs', () => {
    it('returns 0 when not rate limited', () => {
      expect(getRetryAfterMs()).toBe(0)
    })

    it('returns remaining milliseconds when rate limited', () => {
      recordRateLimit(60) // 60 seconds

      const remaining = getRetryAfterMs()

      expect(remaining).toBeGreaterThan(59000) // At least 59 seconds
      expect(remaining).toBeLessThan(61000) // At most 61 seconds
    })
  })

  describe('resetRateLimit', () => {
    it('resets all rate limit state', () => {
      recordRateLimit(60)
      expect(getRateLimitState().isLimited).toBe(true)

      resetRateLimit()

      const state = getRateLimitState()
      expect(state.isLimited).toBe(false)
      expect(state.retryAfter).toBe(null)
      expect(state.limitCount).toBe(0)
    })

    it('can be called multiple times safely', () => {
      resetRateLimit()
      resetRateLimit()

      expect(getRateLimitState().isLimited).toBe(false)
    })
  })

  describe('waitForRateLimit', () => {
    it('returns immediately when not rate limited', async () => {
      const startTime = Date.now()

      await waitForRateLimit()

      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(100) // Should be nearly instant
    })

    it('throws error when wait time exceeds maxWaitMs', async () => {
      recordRateLimit(60) // 60 seconds

      await expect(waitForRateLimit(5000)).rejects.toThrow(
        /Reddit is experiencing high traffic/
      )
    })

    it('respects custom maxWaitMs', async () => {
      recordRateLimit(30) // 30 seconds

      // Should throw with low maxWaitMs
      await expect(waitForRateLimit(1000)).rejects.toThrow(
        /Reddit is experiencing high traffic/
      )
    })

    it('includes wait time in error message', async () => {
      recordRateLimit(65) // 65 seconds

      try {
        await waitForRateLimit(5000)
        expect.fail('Should have thrown error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toMatch(/65 seconds/)
      }
    })
  })

  describe('getRateLimitState', () => {
    it('returns current state as readonly copy', () => {
      recordRateLimit(60)

      const state1 = getRateLimitState()
      const state2 = getRateLimitState()

      // Returns a copy, not the same object
      expect(state1).not.toBe(state2)
      expect(state1).toEqual(state2)
    })

    it('reflects state changes', () => {
      const initialState = getRateLimitState()
      expect(initialState.isLimited).toBe(false)

      recordRateLimit(60)

      const afterRecordState = getRateLimitState()
      expect(afterRecordState.isLimited).toBe(true)
      expect(afterRecordState.limitCount).toBe(1)
    })
  })

  describe('exponential backoff calculation', () => {
    it('follows exponential backoff pattern', () => {
      const backoffs: number[] = []

      // Don't reset between calls - we want to see consecutive increases
      for (let i = 0; i < 5; i++) {
        const beforeTime = Date.now()
        recordRateLimit()
        const state = getRateLimitState()
        const waitTime = state.retryAfter! - beforeTime
        backoffs.push(waitTime)
      }

      // Each backoff should be roughly double the previous (30, 60, 120, 240, 300)
      // Note: Because we call recordRateLimit consecutively, each one extends the wait time
      // So backoff[0] = 30s, backoff[1] = 60s total (from new start), etc.

      // First: 30 seconds
      expect(backoffs[0]).toBeGreaterThan(29000)
      expect(backoffs[0]).toBeLessThan(31000)

      // Second: 60 seconds
      expect(backoffs[1]).toBeGreaterThan(59000)
      expect(backoffs[1]).toBeLessThan(61000)

      // Third: 120 seconds
      expect(backoffs[2]).toBeGreaterThan(119000)
      expect(backoffs[2]).toBeLessThan(121000)

      // Fourth: 240 seconds
      expect(backoffs[3]).toBeGreaterThan(239000)
      expect(backoffs[3]).toBeLessThan(241000)

      // Fifth: Should cap at 300 seconds
      expect(backoffs[4]).toBeGreaterThan(299000)
      expect(backoffs[4]).toBeLessThan(301000)
    })

    it('maintains exponential increase across consecutive limits', () => {
      // First limit
      recordRateLimit()
      const first = getRetryAfterMs()

      // Second limit (without reset)
      recordRateLimit()
      const second = getRetryAfterMs()

      // Third limit (without reset)
      recordRateLimit()
      const third = getRetryAfterMs()

      // Each should be roughly double, accounting for elapsed time
      expect(second).toBeGreaterThan(first * 1.8) // Allow some timing variance
      expect(third).toBeGreaterThan(second * 1.8)
    })
  })
})
