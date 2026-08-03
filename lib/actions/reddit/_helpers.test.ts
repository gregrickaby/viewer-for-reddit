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

import {resetCircuitBreakerForTests} from '@/lib/utils/circuit-breaker'
import {http, HttpResponse, server} from '@/test-utils'
import {
  assertRedditUrl,
  circuitProtectedFetch,
  UpstreamStatusError
} from './_helpers'

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
