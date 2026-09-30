import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  SCOPES,
  buildAuthorizeUrl,
  exchangeCode,
  fetchIdentity,
  refreshAccessToken,
  revokeToken,
} from '@/lib/auth/oauth'

function mockFetch(body: unknown, init: ResponseInit = { status: 200 }) {
  const fn = vi.fn(async () => new Response(JSON.stringify(body), init))
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('buildAuthorizeUrl', () => {
  it('requests every scope with a permanent grant', () => {
    const url = buildAuthorizeUrl('state-123')
    expect(url.origin).toBe('https://www.reddit.test')
    expect(url.pathname).toBe('/api/v1/authorize')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: 'test-client-id',
      response_type: 'code',
      state: 'state-123',
      redirect_uri: 'https://localhost:3000/api/auth/callback/reddit',
      duration: 'permanent',
      scope: SCOPES.join(' '),
    })
  })
})

describe('token endpoint', () => {
  it('exchanges a code with basic auth and a form body', async () => {
    const fetchMock = mockFetch({
      access_token: 'at',
      token_type: 'bearer',
      expires_in: 86400,
      scope: 'identity read',
      refresh_token: 'rt',
    })
    const before = Date.now()
    const result = await exchangeCode('the-code')

    expect(result).toMatchObject({
      kind: 'ok',
      accessToken: 'at',
      refreshToken: 'rt',
      scope: 'identity read',
    })
    expect(result.kind === 'ok' && result.expiresAt).toBeGreaterThanOrEqual(before + 86_400_000)

    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit]
    expect(String(url)).toBe('https://www.reddit.test/api/v1/access_token')
    const headers = new Headers(init.headers)
    expect(headers.get('authorization')).toBe(
      `Basic ${Buffer.from('test-client-id:test-client-secret').toString('base64')}`,
    )
    expect(headers.get('user-agent')).toBe('web-app:viewer-for-reddit:test (by u/test)')
    expect(Object.fromEntries(init.body as URLSearchParams)).toEqual({
      grant_type: 'authorization_code',
      code: 'the-code',
      redirect_uri: 'https://localhost:3000/api/auth/callback/reddit',
    })
  })

  it.each([200, 400])('maps invalid_grant with HTTP %i', async (status) => {
    mockFetch({ error: 'invalid_grant' }, { status })
    expect(await refreshAccessToken('rt')).toEqual({ kind: 'invalid_grant' })
  })

  it('reports other errors without throwing', async () => {
    mockFetch({ message: 'Internal Server Error' }, { status: 500 })
    expect(await refreshAccessToken('rt')).toEqual({
      kind: 'error',
      status: 500,
      error: 'unexpected_response',
    })
  })

  it('reports network failures without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('ECONNRESET'))),
    )
    expect(await refreshAccessToken('rt')).toEqual({
      kind: 'error',
      status: 0,
      error: 'ECONNRESET',
    })
  })

  it('rejects a malformed success body', async () => {
    mockFetch({ access_token: 'at', token_type: 'mac', expires_in: 1, scope: '' })
    expect((await refreshAccessToken('rt')).kind).toBe('error')
  })
})

describe('revokeToken', () => {
  it('reports success', async () => {
    mockFetch({})
    expect(await revokeToken('rt')).toBe(true)
  })

  it('returns false instead of throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('down'))),
    )
    expect(await revokeToken('rt')).toBe(false)
  })
})

describe('fetchIdentity', () => {
  it('returns the username', async () => {
    mockFetch({ name: 'spez', id: 'x' })
    expect(await fetchIdentity('at')).toEqual({ name: 'spez' })
  })

  it('returns null on failure', async () => {
    mockFetch({}, { status: 401 })
    expect(await fetchIdentity('at')).toBeNull()
  })

  it('returns null on a malformed body or network failure', async () => {
    mockFetch({ id: 'no-name' })
    expect(await fetchIdentity('at')).toBeNull()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('offline'))),
    )
    expect(await fetchIdentity('at')).toBeNull()
  })

  it('treats a non-Error network rejection as a network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject('nope')),
    )
    expect(await refreshAccessToken('rt')).toEqual({ kind: 'error', status: 0, error: 'network' })
  })

  it('reports a non-grant error body', async () => {
    mockFetch({ error: 'unsupported_grant_type' }, { status: 400 })
    expect(await refreshAccessToken('rt')).toEqual({
      kind: 'error',
      status: 400,
      error: 'unsupported_grant_type',
    })
  })
})
