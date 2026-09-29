import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET as callback } from '@/app/api/auth/callback/reddit/route'
import { GET as login } from '@/app/api/auth/login/route'
import { GET as signout } from '@/app/api/auth/signout/route'
import {
  ACCESS_COOKIE,
  OAUTH_COOKIE,
  REFRESH_COOKIE,
  sealOAuthState,
  unsealAccess,
  unsealOAuthState,
  unsealRefresh,
} from '@/lib/auth/cookies'

const ORIGIN = 'https://localhost:3000'
const STATE = 's'.repeat(43)

const get = (path: string, cookie?: string) =>
  new NextRequest(new URL(path, ORIGIN), { headers: cookie ? { cookie } : {} })

const location = (response: Response) => new URL(response.headers.get('location')!)

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('GET /api/auth/login', () => {
  it('redirects to Reddit with a fresh state stored in a short-lived cookie', async () => {
    const response = await login(get('/api/auth/login?next=/saved'))
    const url = location(response)
    expect(url.origin + url.pathname).toBe('https://www.reddit.test/api/v1/authorize')

    const cookie = response.cookies.get(OAUTH_COOKIE)
    expect(cookie).toMatchObject({ path: '/api/auth', maxAge: 600, httpOnly: true, secure: true })
    const saved = await unsealOAuthState(cookie?.value)
    expect(saved).toEqual({ state: url.searchParams.get('state'), next: '/saved' })
  })

  it('sanitizes the post-login target', async () => {
    const response = await login(get('/api/auth/login?next=//evil.com'))
    expect((await unsealOAuthState(response.cookies.get(OAUTH_COOKIE)?.value))?.next).toBe('/home')
  })
})

describe('GET /api/auth/callback/reddit', () => {
  async function stateCookie(next = '/saved') {
    return `${OAUTH_COOKIE}=${await sealOAuthState({ state: STATE, next })}`
  }

  function mockReddit({ token = true, identity = true } = {}) {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: URL) => {
        if (String(url).endsWith('/api/v1/access_token')) {
          return Response.json(
            token
              ? {
                  access_token: 'at',
                  token_type: 'bearer',
                  expires_in: 86400,
                  scope: 'read',
                  refresh_token: 'rt',
                }
              : { error: 'invalid_grant' },
          )
        }
        return identity ? Response.json({ name: 'spez' }) : new Response('{}', { status: 500 })
      }),
    )
  }

  it('establishes the session and returns to `next`', async () => {
    mockReddit()
    const response = await callback(
      get(`/api/auth/callback/reddit?code=c&state=${STATE}`, await stateCookie()),
    )

    expect(location(response).pathname).toBe('/saved')
    expect((await unsealAccess(response.cookies.get(ACCESS_COOKIE)?.value))?.accessToken).toBe('at')
    expect(await unsealRefresh(response.cookies.get(REFRESH_COOKIE)?.value)).toEqual({
      v: 1,
      refreshToken: 'rt',
      username: 'spez',
      scope: 'read',
    })
    expect(response.cookies.get(OAUTH_COOKIE)?.value).toBe('')
  })

  it('reports a declined consent', async () => {
    const response = await callback(get('/api/auth/callback/reddit?error=access_denied'))
    expect(location(response).searchParams.get('error')).toBe('denied')
  })

  it.each([
    ['a missing code', `?state=${STATE}`],
    ['a missing state', '?code=c'],
    ['a mismatched state', `?code=c&state=${'x'.repeat(43)}`],
    ['a different-length state', '?code=c&state=short'],
  ])('rejects %s', async (_label, query) => {
    const response = await callback(get(`/api/auth/callback/reddit${query}`, await stateCookie()))
    expect(location(response).searchParams.get('error')).toBe('state')
  })

  it('rejects a callback with no state cookie', async () => {
    const response = await callback(get(`/api/auth/callback/reddit?code=c&state=${STATE}`))
    expect(location(response).searchParams.get('error')).toBe('state')
  })

  it('reports a failed code exchange', async () => {
    mockReddit({ token: false })
    const response = await callback(
      get(`/api/auth/callback/reddit?code=c&state=${STATE}`, await stateCookie()),
    )
    expect(location(response).searchParams.get('error')).toBe('exchange')
  })

  it('reports a failed identity lookup', async () => {
    mockReddit({ identity: false })
    const response = await callback(
      get(`/api/auth/callback/reddit?code=c&state=${STATE}`, await stateCookie()),
    )
    expect(location(response).searchParams.get('error')).toBe('exchange')
  })
})

describe('GET /api/auth/signout', () => {
  it('clears the session and explains an expiry', async () => {
    const response = signout(get('/api/auth/signout?reason=expired&next=/r/pics'))
    const url = location(response)
    expect(url.pathname).toBe('/')
    expect(url.searchParams.get('error')).toBe('session_expired')
    expect(url.searchParams.get('next')).toBe('/r/pics')
    expect(response.cookies.get(ACCESS_COOKIE)?.value).toBe('')
    expect(response.cookies.get(REFRESH_COOKIE)?.value).toBe('')
  })

  it('redirects plainly without a reason', async () => {
    const url = location(signout(get('/api/auth/signout')))
    expect(url.search).toBe('')
  })
})
