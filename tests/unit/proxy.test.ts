import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  sealAccess,
  sealRefresh,
  unsealAccess,
} from '@/lib/auth/cookies'
import { proxy } from '@/proxy'

const ORIGIN = 'https://localhost:3000'

async function cookieHeader({
  access,
  refresh,
}: {
  access?: 'fresh' | 'stale'
  refresh?: boolean
}) {
  const parts: string[] = []
  if (access) {
    const expiresAt = Date.now() + (access === 'fresh' ? 3_600_000 : 60_000)
    parts.push(`${ACCESS_COOKIE}=${await sealAccess({ accessToken: 'old-access', expiresAt })}`)
  }
  if (refresh) {
    parts.push(
      `${REFRESH_COOKIE}=${await sealRefresh({ v: 1, refreshToken: 'rt', username: 'spez', scope: 'read' })}`,
    )
  }
  return parts.join('; ')
}

function request(path: string, cookie = '', method = 'GET') {
  return new NextRequest(new URL(path, ORIGIN), { method, headers: cookie ? { cookie } : {} })
}

function mockTokenResponse(body: unknown, status = 200) {
  const fn = vi.fn(async () => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('proxy: auth gating', () => {
  it('redirects signed-out GETs of protected pages to the landing page with next', async () => {
    const response = await proxy(request('/r/nextjs?sort=top'))
    expect(response.status).toBe(307)
    const location = new URL(response.headers.get('location')!)
    expect(location.pathname).toBe('/')
    expect(location.searchParams.get('next')).toBe('/r/nextjs?sort=top')
  })

  it('shows signed-out visitors the 404 page for an address the site does not have', async () => {
    for (const path of ['/404', '/no-such-page', '/homes', '/about/team']) {
      const response = await proxy(request(path))
      expect(response.headers.get('location')).toBeNull()
    }
  })

  it('still sends signed-out readers of every signed-in route to sign in', async () => {
    for (const path of ['/home', '/r/pics', '/user/spez', '/m/me/feed', '/saved', '/settings']) {
      const response = await proxy(request(path))
      expect(new URL(response.headers.get('location')!).pathname).toBe('/')
    }
  })

  it('lets signed-out visitors reach public paths', async () => {
    for (const path of [
      '/',
      '/about',
      '/donate',
      '/manifest.webmanifest',
      '/api/auth/login',
      '/api/auth/callback/reddit?code=x',
    ]) {
      const response = await proxy(request(path))
      expect(response.headers.get('location')).toBeNull()
    }
  })

  it('passes signed-out non-GET requests through for the action to reject', async () => {
    const response = await proxy(request('/home', '', 'POST'))
    expect(response.headers.get('location')).toBeNull()
  })

  it('redirects signed-in visitors from / to /home', async () => {
    const response = await proxy(
      request('/', await cookieHeader({ access: 'fresh', refresh: true })),
    )
    expect(new URL(response.headers.get('location')!).pathname).toBe('/home')
  })

  it('passes signed-in requests with a fresh token through without refreshing', async () => {
    const fetchMock = mockTokenResponse({})
    const response = await proxy(
      request('/home', await cookieHeader({ access: 'fresh', refresh: true })),
    )
    expect(response.headers.get('location')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('proxy: token refresh', () => {
  it('refreshes a stale token and forwards it to this request and the browser', async () => {
    mockTokenResponse({
      access_token: 'new-access',
      token_type: 'bearer',
      expires_in: 86400,
      scope: 'read',
    })
    const response = await proxy(
      request('/home', await cookieHeader({ access: 'stale', refresh: true })),
    )

    expect(response.headers.get('location')).toBeNull()

    // Browser gets the new cookie…
    const setAccess = response.cookies.get(ACCESS_COOKIE)
    expect((await unsealAccess(setAccess?.value))?.accessToken).toBe('new-access')
    expect(setAccess).toMatchObject({ httpOnly: true, secure: true, sameSite: 'lax', path: '/' })
    expect(response.cookies.get(REFRESH_COOKIE)?.value).toBeTruthy()

    // …and downstream code sees it on the same request via the override headers.
    expect(response.headers.get('x-middleware-override-headers')).toContain('cookie')
    const forwarded = response.headers.get('x-middleware-request-cookie') ?? ''
    const sealed = /rv_at=([^;]+)/.exec(forwarded)?.[1]
    expect((await unsealAccess(sealed))?.accessToken).toBe('new-access')
  })

  it('refreshes when the access cookie is missing entirely', async () => {
    const fetchMock = mockTokenResponse({
      access_token: 'new',
      token_type: 'bearer',
      expires_in: 3600,
      scope: 'read',
    })
    await proxy(request('/saved', await cookieHeader({ refresh: true })))
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('clears the session and redirects when the grant was revoked', async () => {
    mockTokenResponse({ error: 'invalid_grant' })
    const response = await proxy(
      request('/home', await cookieHeader({ access: 'stale', refresh: true })),
    )
    const location = new URL(response.headers.get('location')!)
    expect(location.pathname).toBe('/')
    expect(location.searchParams.get('error')).toBe('session_expired')
    expect(response.cookies.get(ACCESS_COOKIE)?.value).toBe('')
    expect(response.cookies.get(REFRESH_COOKIE)?.value).toBe('')
  })

  it('falls through on a transient refresh failure', async () => {
    mockTokenResponse({ message: 'down' }, 503)
    const response = await proxy(
      request('/home', await cookieHeader({ access: 'stale', refresh: true })),
    )
    expect(response.headers.get('location')).toBeNull()
    expect(response.cookies.get(ACCESS_COOKIE)).toBeUndefined()
  })
})
