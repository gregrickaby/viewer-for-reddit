import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {
  checkRateLimit,
  getBucketCountForTests,
  getClientIp,
  resetRateLimitsForTests,
  runSweepForTests
} from './rate-limit'

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetRateLimitsForTests()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows requests up to the limit', () => {
    for (let i = 0; i < 3; i++) {
      const result = checkRateLimit('key', {limit: 3, windowMs: 1000})
      expect(result.allowed).toBe(true)
      expect(result.retryAfterSeconds).toBe(0)
    }
  })

  it('blocks requests once the limit is exceeded', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('key', {limit: 3, windowMs: 1000})
    }

    const result = checkRateLimit('key', {limit: 3, windowMs: 1000})

    expect(result.allowed).toBe(false)
    expect(result.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('tracks separate buckets per key', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('key-a', {limit: 3, windowMs: 1000})
    }

    const resultA = checkRateLimit('key-a', {limit: 3, windowMs: 1000})
    const resultB = checkRateLimit('key-b', {limit: 3, windowMs: 1000})

    expect(resultA.allowed).toBe(false)
    expect(resultB.allowed).toBe(true)
  })

  it('resets the count after the window elapses', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('key', {limit: 3, windowMs: 1000})
    }
    expect(checkRateLimit('key', {limit: 3, windowMs: 1000}).allowed).toBe(
      false
    )

    vi.advanceTimersByTime(1001)

    expect(checkRateLimit('key', {limit: 3, windowMs: 1000}).allowed).toBe(true)
  })

  it('sweeps expired buckets but keeps active ones', () => {
    checkRateLimit('expired', {limit: 3, windowMs: 1000})
    vi.advanceTimersByTime(1001)
    checkRateLimit('active', {limit: 3, windowMs: 1000})

    expect(getBucketCountForTests()).toBe(2)

    runSweepForTests()

    expect(getBucketCountForTests()).toBe(1)
  })
})

describe('getClientIp', () => {
  it('returns the first IP from X-Forwarded-For', () => {
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.1, 10.0.0.1, 10.0.0.2'
    })

    expect(getClientIp(headers)).toBe('203.0.113.1')
  })

  it('falls back to X-Real-Ip when X-Forwarded-For is absent', () => {
    const headers = new Headers({'x-real-ip': '203.0.113.5'})

    expect(getClientIp(headers)).toBe('203.0.113.5')
  })

  it('returns "unknown" when neither header is present', () => {
    const headers = new Headers()

    expect(getClientIp(headers)).toBe('unknown')
  })

  it('returns "unknown" when the first X-Forwarded-For segment is blank', () => {
    const headers = new Headers({'x-forwarded-for': ',10.0.0.1'})

    expect(getClientIp(headers)).toBe('unknown')
  })
})
