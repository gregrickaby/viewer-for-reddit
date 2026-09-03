import {beforeEach, describe, expect, it, vi} from 'vitest'

// Mock dependencies BEFORE module imports
vi.mock('@/lib/datadog/server', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

let mockHeaders: Record<string, string>
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({
    get: vi.fn((name: string) => mockHeaders[name] || null)
  }))
}))

import {resetCircuitBreakerForTests} from '@/lib/utils/circuit-breaker'
import {http, HttpResponse, server} from '@/test-utils'
import {
  assertRedditUrl,
  circuitProtectedFetch,
  excludePromoted,
  getRequestMetadata,
  UpstreamStatusError
} from './_helpers'

describe('excludePromoted', () => {
  it('returns an empty array when children is undefined', () => {
    expect(excludePromoted(undefined)).toEqual([])
  })

  it('filters out children flagged as promoted', () => {
    const children = [
      {data: {name: 'organic'}},
      {data: {name: 'ad', promoted: true}}
    ]

    expect(excludePromoted(children)).toEqual([{data: {name: 'organic'}}])
  })
})

describe('getRequestMetadata', () => {
  it('falls back to "unknown"/"none" when headers are missing', async () => {
    mockHeaders = {}

    const metadata = await getRequestMetadata()

    expect(metadata).toEqual({
      clientUserAgent: 'unknown',
      clientIp: 'unknown',
      referer: 'none'
    })
  })

  it('falls back to x-real-ip when x-forwarded-for is missing', async () => {
    mockHeaders = {'x-real-ip': '10.0.0.1'}

    const metadata = await getRequestMetadata()

    expect(metadata.clientIp).toBe('10.0.0.1')
  })

  it('prefers x-forwarded-for, user-agent, and referer when all present', async () => {
    mockHeaders = {
      'user-agent': 'Mozilla/5.0',
      'x-forwarded-for': '1.2.3.4',
      'x-real-ip': '10.0.0.1',
      referer: 'https://reddit.com'
    }

    const metadata = await getRequestMetadata()

    expect(metadata).toEqual({
      clientUserAgent: 'Mozilla/5.0',
      clientIp: '1.2.3.4',
      referer: 'https://reddit.com'
    })
  })
})

describe('assertRedditUrl', () => {
  it('accepts oauth.reddit.com URLs', () => {
    expect(() =>
      assertRedditUrl('https://oauth.reddit.com/r/popular/hot.json')
    ).not.toThrow()
  })

  it('accepts reddit.com URLs', () => {
    expect(() =>
      assertRedditUrl('https://reddit.com/r/popular/hot.json')
    ).not.toThrow()
  })

  it('rejects non-Reddit domains', () => {
    expect(() => assertRedditUrl('https://evil.com/steal-data')).toThrow(
      'Invalid request destination'
    )
  })

  it('rejects HTTP (non-HTTPS) URLs', () => {
    expect(() =>
      assertRedditUrl('http://oauth.reddit.com/r/popular/hot.json')
    ).toThrow('Invalid protocol - HTTPS required')
  })

  it('rejects malformed URLs', () => {
    expect(() => assertRedditUrl('not-a-url')).toThrow('Invalid URL format')
  })
})

describe('circuitProtectedFetch', () => {
  beforeEach(() => {
    resetCircuitBreakerForTests()
  })

  it('returns the response for a successful request', async () => {
    server.use(
      http.get('https://oauth.reddit.com/ok', () =>
        HttpResponse.json({ok: true})
      )
    )

    const response = await circuitProtectedFetch('https://oauth.reddit.com/ok')

    expect(response.ok).toBe(true)
  })

  it('returns the response as-is for 401/403/404 (not a breaker failure)', async () => {
    server.use(
      http.get(
        'https://oauth.reddit.com/missing',
        () => new HttpResponse(null, {status: 404})
      )
    )

    const response = await circuitProtectedFetch(
      'https://oauth.reddit.com/missing'
    )

    expect(response.status).toBe(404)
  })

  it('throws UpstreamStatusError carrying the response on 429', async () => {
    server.use(
      http.get(
        'https://oauth.reddit.com/limited',
        () => new HttpResponse(null, {status: 429})
      )
    )

    const error = await circuitProtectedFetch(
      'https://oauth.reddit.com/limited'
    ).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(UpstreamStatusError)
    expect((error as UpstreamStatusError).response.status).toBe(429)
  })

  it('throws UpstreamStatusError on 5xx', async () => {
    server.use(
      http.get(
        'https://oauth.reddit.com/down',
        () => new HttpResponse(null, {status: 503})
      )
    )

    await expect(
      circuitProtectedFetch('https://oauth.reddit.com/down')
    ).rejects.toThrow(UpstreamStatusError)
  })

  it('stops hitting the network once the circuit opens on repeated 5xx', async () => {
    let hitCount = 0
    server.use(
      http.get('https://oauth.reddit.com/flaky', () => {
        hitCount++
        return new HttpResponse(null, {status: 500})
      })
    )

    for (let i = 0; i < 5; i++) {
      await expect(
        circuitProtectedFetch('https://oauth.reddit.com/flaky')
      ).rejects.toThrow(UpstreamStatusError)
    }
    expect(hitCount).toBe(5)

    await expect(
      circuitProtectedFetch('https://oauth.reddit.com/flaky')
    ).rejects.toThrow('Reddit API circuit breaker is open')
    expect(hitCount).toBe(5) // unchanged, breaker short-circuited before fetch
  })
})
