vi.mock('@/lib/datadog/server', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

import {CircuitOpenError} from '@/lib/utils/errors'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {
  resetCircuitBreakerForTests,
  withCircuitBreaker
} from './circuit-breaker'

describe('withCircuitBreaker', () => {
  beforeEach(() => {
    resetCircuitBreakerForTests()
  })

  it('returns the action result when the circuit is closed', async () => {
    const result = await withCircuitBreaker(async () => 'ok')

    expect(result).toBe('ok')
  })

  it('propagates the action error when the circuit is closed', async () => {
    await expect(
      withCircuitBreaker(async () => {
        throw new Error('upstream boom')
      })
    ).rejects.toThrow('upstream boom')
  })

  it('opens after repeated failures and rejects with CircuitOpenError without calling the action', async () => {
    const failingAction = vi.fn(async () => {
      throw new Error('upstream boom')
    })

    // volumeThreshold=5, errorThresholdPercentage=50: five failures at 100%
    // trips the breaker open.
    for (let i = 0; i < 5; i++) {
      await expect(withCircuitBreaker(failingAction)).rejects.toThrow(
        'upstream boom'
      )
    }
    expect(failingAction).toHaveBeenCalledTimes(5)

    const blockedAction = vi.fn(async () => 'should not run')
    await expect(withCircuitBreaker(blockedAction)).rejects.toThrow(
      CircuitOpenError
    )
    expect(blockedAction).not.toHaveBeenCalled()
  })

  describe('recovery', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('goes half-open after resetTimeout and closes again on a successful trial', async () => {
      const failingAction = vi.fn(async () => {
        throw new Error('upstream boom')
      })

      for (let i = 0; i < 5; i++) {
        await expect(withCircuitBreaker(failingAction)).rejects.toThrow(
          'upstream boom'
        )
      }

      const blockedAction = vi.fn(async () => 'should not run')
      await expect(withCircuitBreaker(blockedAction)).rejects.toThrow(
        CircuitOpenError
      )

      // resetTimeout is 30_000ms
      await vi.advanceTimersByTimeAsync(30_000)

      const recoveredAction = vi.fn(async () => 'recovered')
      const result = await withCircuitBreaker(recoveredAction)

      expect(result).toBe('recovered')
      expect(recoveredAction).toHaveBeenCalledTimes(1)
    })
  })
})
