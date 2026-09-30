import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { redditFetch } from '@/lib/reddit/client'
import {
  RedditApiError,
  RedditAuthError,
  RedditForbiddenError,
  RedditNotFoundError,
  RedditRateLimitError,
  RedditSchemaError,
} from '@/lib/reddit/errors'
import { MIN_REMAINING, resetRateLimit } from '@/lib/reddit/rate-limit'

function respond(body: string, init: ResponseInit = { status: 200 }) {
  const fn = vi.fn(async () => new Response(body, init))
  vi.stubGlobal('fetch', fn)
  return fn
}

beforeEach(() => resetRateLimit())
afterEach(() => vi.unstubAllGlobals())

describe('redditFetch', () => {
  it('sends auth, user agent, and raw_json=1, and drops empty query values', async () => {
    const fetchMock = respond('{"ok":true}')
    await expect(
      redditFetch('/r/pics/hot', { token: 'tok', query: { limit: 25, after: undefined, t: null } }),
    ).resolves.toEqual({ ok: true })

    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit]
    expect(url.href).toBe('https://oauth.reddit.test/r/pics/hot?limit=25&raw_json=1')
    const headers = new Headers(init.headers)
    expect(headers.get('authorization')).toBe('Bearer tok')
    expect(headers.get('user-agent')).toBe('web-app:viewer-for-reddit:test (by u/test)')
    expect(init.method).toBe('GET')
  })

  it('posts forms url-encoded', async () => {
    const fetchMock = respond('{}')
    await redditFetch('/api/vote', { token: 't', method: 'POST', form: { id: 't3_abc', dir: 1 } })
    const [, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit]
    expect(new Headers(init.headers).get('content-type')).toBe('application/x-www-form-urlencoded')
    expect(String(init.body)).toBe('id=t3_abc&dir=1')
  })

  it('treats an empty body as {}', async () => {
    respond('')
    await expect(redditFetch('/api/save', { token: 't', method: 'POST' })).resolves.toEqual({})
  })

  it.each([
    [401, RedditAuthError],
    [404, RedditNotFoundError],
    [500, RedditApiError],
  ])('maps HTTP %i to its error type', async (status, ErrorType) => {
    respond('{}', { status })
    await expect(redditFetch('/x', { token: 't' })).rejects.toBeInstanceOf(ErrorType)
  })

  it.each([
    ['private', 'private'],
    ['quarantined', 'quarantined'],
    ['banned', 'banned'],
    ['something-new', 'unknown'],
  ])('maps a 403 with reason %s', async (reason, expected) => {
    respond(JSON.stringify({ reason, message: 'Forbidden' }), { status: 403 })
    await expect(redditFetch('/r/x/about', { token: 't' })).rejects.toMatchObject({
      reason: expected,
    })
  })

  it('treats a redirect or HTML response to a GET as not found', async () => {
    respond('', { status: 302, headers: { location: '/subreddits/search' } })
    await expect(redditFetch('/r/gone/about', { token: 't' })).rejects.toBeInstanceOf(
      RedditNotFoundError,
    )
    respond('<html>banned</html>')
    await expect(redditFetch('/r/gone/about', { token: 't' })).rejects.toBeInstanceOf(
      RedditNotFoundError,
    )
  })

  it('reports redirects and non-JSON bodies on writes as API errors', async () => {
    respond('', { status: 302, headers: { location: '/login' } })
    await expect(redditFetch('/api/vote', { token: 't', method: 'POST' })).rejects.toBeInstanceOf(
      RedditApiError,
    )
    respond('<html>oops</html>')
    await expect(redditFetch('/api/vote', { token: 't', method: 'POST' })).rejects.toThrow(
      /Non-JSON response/,
    )
  })

  it('maps a 403 with an unreadable body to an unknown reason', async () => {
    respond('not json', { status: 403 })
    await expect(redditFetch('/r/x/about', { token: 't' })).rejects.toMatchObject({
      reason: 'unknown',
    })
  })

  it('defaults the 429 retry window when Reddit omits it', async () => {
    respond('{}', { status: 429 })
    await expect(redditFetch('/x', { token: 't' })).rejects.toMatchObject({ resetSeconds: 60 })
  })

  it('surfaces 429 with the reset time', async () => {
    respond('{}', { status: 429, headers: { 'x-ratelimit-reset': '12.4' } })
    await expect(redditFetch('/x', { token: 't' })).rejects.toMatchObject({ resetSeconds: 13 })
  })

  it('fails fast once the reported budget is nearly spent', async () => {
    const fetchMock = respond('{}', {
      status: 200,
      headers: { 'x-ratelimit-remaining': String(MIN_REMAINING - 1), 'x-ratelimit-reset': '30' },
    })
    await redditFetch('/x', { token: 't' })
    await expect(redditFetch('/x', { token: 't' })).rejects.toBeInstanceOf(RedditRateLimitError)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('keeps sending while the budget is healthy', async () => {
    const fetchMock = respond('{}', {
      status: 200,
      headers: { 'x-ratelimit-remaining': '80', 'x-ratelimit-reset': '30' },
    })
    await redditFetch('/x', { token: 't' })
    await redditFetch('/x', { token: 't' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('error classes', () => {
  it('carry their own names and details', () => {
    expect(new RedditForbiddenError('private').name).toBe('RedditForbiddenError')
    expect(new RedditRateLimitError(3).message).toContain('3s')
    const api = new RedditApiError('Thread locked', 200, 'THREAD_LOCKED', 'parent')
    expect(api).toMatchObject({ status: 200, code: 'THREAD_LOCKED', field: 'parent' })
    const schema = new RedditSchemaError('/best', [{ path: ['data'] }])
    expect(schema).toMatchObject({ name: 'RedditSchemaError', status: 502, endpoint: '/best' })
    expect(schema.message).toContain('/best')
  })
})
