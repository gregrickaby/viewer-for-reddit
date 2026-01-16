import {beforeEach, describe, expect, it, vi} from 'vitest'

// Mock logger BEFORE imports
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

import {logger} from '@/lib/utils/logger'
import {retryWithBackoff} from './retry'

const mockLogger = vi.mocked(logger)

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns result on first successful attempt', async () => {
    const mockFn = vi.fn(async () => 'success')

    const result = await retryWithBackoff(mockFn)

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockLogger.info).not.toHaveBeenCalled()
  })

  it('retries on 429 rate limit error', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Rate limit exceeded'))
      .mockResolvedValueOnce('success')

    const promise = retryWithBackoff(mockFn, 3, 1000)

    // First attempt fails, advance timer for retry delay
    await vi.advanceTimersByTimeAsync(1000)

    const result = await promise

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(2)
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Rate limited, retrying in 1000ms (attempt 1/3)',
      undefined,
      {context: 'retryWithBackoff'}
    )
  })

  it('retries on HTTP 429 status message', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('HTTP 429'))
      .mockResolvedValueOnce('success')

    const promise = retryWithBackoff(mockFn, 3, 1000)

    await vi.advanceTimersByTimeAsync(1000)

    const result = await promise

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(2)
  })

  it('uses exponential backoff delays', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Rate limit exceeded'))
      .mockRejectedValueOnce(new Error('Rate limit exceeded'))
      .mockResolvedValueOnce('success')

    const promise = retryWithBackoff(mockFn, 3, 1000)

    // First retry: 1000ms (1000 * 2^0)
    await vi.advanceTimersByTimeAsync(1000)
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Rate limited, retrying in 1000ms (attempt 1/3)',
      undefined,
      {context: 'retryWithBackoff'}
    )

    // Second retry: 2000ms (1000 * 2^1)
    await vi.advanceTimersByTimeAsync(2000)
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Rate limited, retrying in 2000ms (attempt 2/3)',
      undefined,
      {context: 'retryWithBackoff'}
    )

    const result = await promise

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  it('throws immediately for non-rate-limit errors', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Network error'))

    await expect(retryWithBackoff(mockFn)).rejects.toThrow('Network error')

    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockLogger.info).not.toHaveBeenCalled()
  })

  it('throws after max retries are exhausted', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Rate limit exceeded'))

    const promise = retryWithBackoff(mockFn, 3, 1000)

    // Advance through all retries and await the promise rejection
    const advanceAndReject = (async () => {
      await vi.advanceTimersByTimeAsync(1000) // First retry
      await vi.advanceTimersByTimeAsync(2000) // Second retry
      await vi.advanceTimersByTimeAsync(4000) // Third retry
    })()

    await Promise.all([promise.catch(() => {}), advanceAndReject])

    await expect(promise).rejects.toThrow('Rate limit exceeded')

    expect(mockFn).toHaveBeenCalledTimes(4) // Initial + 3 retries
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Max retries reached',
      expect.any(Error),
      {
        context: 'retryWithBackoff',
        attempts: 4
      }
    )
  })

  it('respects custom maxRetries parameter', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Rate limit exceeded'))

    const promise = retryWithBackoff(mockFn, 1, 500)

    // Advance timer and await the promise rejection
    const advancePromise = vi.advanceTimersByTimeAsync(500)
    await Promise.all([promise.catch(() => {}), advancePromise])

    await expect(promise).rejects.toThrow('Rate limit exceeded')

    expect(mockFn).toHaveBeenCalledTimes(2) // Initial + 1 retry
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Max retries reached',
      expect.any(Error),
      {
        context: 'retryWithBackoff',
        attempts: 2
      }
    )
  })

  it('respects custom baseDelay parameter', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Rate limit exceeded'))
      .mockResolvedValueOnce('success')

    const promise = retryWithBackoff(mockFn, 3, 500)

    await vi.advanceTimersByTimeAsync(500)

    const result = await promise

    expect(result).toBe('success')
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Rate limited, retrying in 500ms (attempt 1/3)',
      undefined,
      {context: 'retryWithBackoff'}
    )
  })

  it('handles async functions that throw', async () => {
    const mockFn = vi.fn(async () => {
      throw new Error('Async error')
    })

    await expect(retryWithBackoff(mockFn)).rejects.toThrow('Async error')

    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('handles functions that return promises that reject', async () => {
    const mockFn = vi.fn(() => Promise.reject(new Error('Promise rejection')))

    await expect(retryWithBackoff(mockFn)).rejects.toThrow('Promise rejection')

    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('returns different types correctly', async () => {
    const objectFn = vi.fn(async () => ({data: 'test'}))
    const numberFn = vi.fn(async () => 42)
    const booleanFn = vi.fn(async () => true)

    expect(await retryWithBackoff(objectFn)).toEqual({data: 'test'})
    expect(await retryWithBackoff(numberFn)).toBe(42)
    expect(await retryWithBackoff(booleanFn)).toBe(true)
  })

  it('handles rate limit error after several successful calls', async () => {
    let callCount = 0
    const mockFn = vi.fn(async () => {
      callCount++
      if (callCount === 1) {
        throw new Error('Rate limit exceeded')
      }
      return 'success'
    })

    const promise = retryWithBackoff(mockFn, 3, 1000)

    await vi.advanceTimersByTimeAsync(1000)

    const result = await promise

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(2)
  })

  it('does not retry when maxRetries is 0', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Rate limit exceeded'))

    await expect(retryWithBackoff(mockFn, 0, 1000)).rejects.toThrow(
      'Rate limit exceeded'
    )

    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockLogger.info).not.toHaveBeenCalled()
  })

  it('logs correct attempt numbers', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('429'))
      .mockRejectedValueOnce(new Error('429'))
      .mockRejectedValueOnce(new Error('429'))
      .mockResolvedValueOnce('success')

    const promise = retryWithBackoff(mockFn, 5, 100)

    await vi.advanceTimersByTimeAsync(100) // Attempt 1
    await vi.advanceTimersByTimeAsync(200) // Attempt 2
    await vi.advanceTimersByTimeAsync(400) // Attempt 3

    await promise

    expect(mockLogger.info).toHaveBeenNthCalledWith(
      1,
      'Rate limited, retrying in 100ms (attempt 1/5)',
      undefined,
      {context: 'retryWithBackoff'}
    )
    expect(mockLogger.info).toHaveBeenNthCalledWith(
      2,
      'Rate limited, retrying in 200ms (attempt 2/5)',
      undefined,
      {context: 'retryWithBackoff'}
    )
    expect(mockLogger.info).toHaveBeenNthCalledWith(
      3,
      'Rate limited, retrying in 400ms (attempt 3/5)',
      undefined,
      {context: 'retryWithBackoff'}
    )
  })

  it('handles error without message property', async () => {
    const mockFn = vi.fn().mockRejectedValue({error: 'object error'})

    await expect(retryWithBackoff(mockFn)).rejects.toEqual({
      error: 'object error'
    })

    expect(mockFn).toHaveBeenCalledTimes(1)
  })
})
