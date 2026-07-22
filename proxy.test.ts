import {beforeEach, describe, expect, it, vi} from 'vitest'

const {redirectMock, nextMock} = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  nextMock: vi.fn(() => ({
    headers: new Headers()
  }))
}))

vi.mock('@/lib/axiom/server', () => ({
  logger: {
    info: vi.fn(),
    flush: vi.fn(() => Promise.resolve())
  }
}))

vi.mock('@axiomhq/nextjs', () => ({
  transformMiddlewareRequest: vi.fn(() => [
    'request',
    {path: '/test', method: 'GET'}
  ])
}))

vi.mock('iron-session', () => ({
  getIronSession: vi.fn()
}))

vi.mock('next/server', async () => {
  const actual = (await vi.importActual('next/server')) as Record<
    string,
    unknown
  >
  return {
    ...actual,
    NextResponse: {
      ...(actual.NextResponse as Record<string, unknown>),
      redirect: redirectMock,
      next: nextMock
    }
  }
})

import {NextRequest} from 'next/server'
import {proxy} from './proxy'

describe('proxy middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('auth enforcement', () => {
    it('redirects unauthenticated users to /api/auth/login for protected routes', async () => {
      const {getIronSession} = await import('iron-session')
      const mockGetIronSession = vi.mocked(getIronSession)
      mockGetIronSession.mockResolvedValue({accessToken: ''} as never)

      const request = new NextRequest(
        new URL('https://example.com/r/programming')
      )
      await proxy(request)

      expect(redirectMock).toHaveBeenCalledWith(
        expect.objectContaining({pathname: '/api/auth/login'})
      )
    })

    it('allows authenticated users through protected routes', async () => {
      const {getIronSession} = await import('iron-session')
      const mockGetIronSession = vi.mocked(getIronSession)
      mockGetIronSession.mockResolvedValue({
        accessToken: 'valid-token'
      } as never)

      const request = new NextRequest(
        new URL('https://example.com/r/programming')
      )
      const response = await proxy(request)

      expect(redirectMock).not.toHaveBeenCalled()
      expect(response).toBeDefined()
    })

    it('allows unauthenticated access to /about', async () => {
      const {getIronSession} = await import('iron-session')
      const mockGetIronSession = vi.mocked(getIronSession)
      mockGetIronSession.mockResolvedValue({accessToken: ''} as never)

      const request = new NextRequest(new URL('https://example.com/about'))
      const response = await proxy(request)

      expect(redirectMock).not.toHaveBeenCalled()
      expect(response).toBeDefined()
    })

    it('allows unauthenticated access to /donate', async () => {
      const {getIronSession} = await import('iron-session')
      const mockGetIronSession = vi.mocked(getIronSession)
      mockGetIronSession.mockResolvedValue({accessToken: ''} as never)

      const request = new NextRequest(new URL('https://example.com/donate'))
      const response = await proxy(request)

      expect(redirectMock).not.toHaveBeenCalled()
      expect(response).toBeDefined()
    })

    it('allows unauthenticated access to /api/* routes', async () => {
      const {getIronSession} = await import('iron-session')
      const mockGetIronSession = vi.mocked(getIronSession)
      mockGetIronSession.mockResolvedValue({accessToken: ''} as never)

      const request = new NextRequest(
        new URL('https://example.com/api/auth/login')
      )
      const response = await proxy(request)

      expect(redirectMock).not.toHaveBeenCalled()
      expect(response).toBeDefined()
    })

    it('allows unauthenticated access to homepage', async () => {
      const {getIronSession} = await import('iron-session')
      const mockGetIronSession = vi.mocked(getIronSession)
      mockGetIronSession.mockResolvedValue({accessToken: ''} as never)

      const request = new NextRequest(new URL('https://example.com/'))
      const response = await proxy(request)

      expect(redirectMock).not.toHaveBeenCalled()
      expect(response).toBeDefined()
    })

    it('allows unauthenticated access to /sitemap.xml', async () => {
      const {getIronSession} = await import('iron-session')
      const mockGetIronSession = vi.mocked(getIronSession)
      mockGetIronSession.mockResolvedValue({accessToken: ''} as never)

      const request = new NextRequest(
        new URL('https://example.com/sitemap.xml')
      )
      const response = await proxy(request)

      expect(redirectMock).not.toHaveBeenCalled()
      expect(response).toBeDefined()
    })

    it('allows unauthenticated access to /robots.txt', async () => {
      const {getIronSession} = await import('iron-session')
      const mockGetIronSession = vi.mocked(getIronSession)
      mockGetIronSession.mockResolvedValue({accessToken: ''} as never)

      const request = new NextRequest(new URL('https://example.com/robots.txt'))
      const response = await proxy(request)

      expect(redirectMock).not.toHaveBeenCalled()
      expect(response).toBeDefined()
    })

    it('allows unauthenticated access to /favicon.ico', async () => {
      const {getIronSession} = await import('iron-session')
      const mockGetIronSession = vi.mocked(getIronSession)
      mockGetIronSession.mockResolvedValue({accessToken: ''} as never)

      const request = new NextRequest(
        new URL('https://example.com/favicon.ico')
      )
      const response = await proxy(request)

      expect(redirectMock).not.toHaveBeenCalled()
      expect(response).toBeDefined()
    })

    it('redirects unauthenticated users on /user/* routes', async () => {
      const {getIronSession} = await import('iron-session')
      const mockGetIronSession = vi.mocked(getIronSession)
      mockGetIronSession.mockResolvedValue({accessToken: ''} as never)

      const request = new NextRequest(
        new URL('https://example.com/user/spez/saved')
      )
      await proxy(request)

      expect(redirectMock).toHaveBeenCalledWith(
        expect.objectContaining({pathname: '/api/auth/login'})
      )
    })

    it('redirects unauthenticated users on /search/* routes', async () => {
      const {getIronSession} = await import('iron-session')
      const mockGetIronSession = vi.mocked(getIronSession)
      mockGetIronSession.mockResolvedValue({accessToken: ''} as never)

      const request = new NextRequest(
        new URL('https://example.com/search/test')
      )
      await proxy(request)

      expect(redirectMock).toHaveBeenCalledWith(
        expect.objectContaining({pathname: '/api/auth/login'})
      )
    })

    it('redirects unauthenticated users on /u/* routes', async () => {
      const {getIronSession} = await import('iron-session')
      const mockGetIronSession = vi.mocked(getIronSession)
      mockGetIronSession.mockResolvedValue({accessToken: ''} as never)

      const request = new NextRequest(new URL('https://example.com/u/spez'))
      await proxy(request)

      expect(redirectMock).toHaveBeenCalledWith(
        expect.objectContaining({pathname: '/api/auth/login'})
      )
    })
  })

  describe('routes that should be blocked from indexing', () => {
    it('adds X-Robots-Tag header to /r/ routes', async () => {
      const {getIronSession} = await import('iron-session')
      vi.mocked(getIronSession).mockResolvedValue({
        accessToken: 'valid-token'
      } as never)

      const request = new NextRequest(
        new URL('https://example.com/r/programming')
      )
      const response = await proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('adds X-Robots-Tag header to /u/ routes', async () => {
      const {getIronSession} = await import('iron-session')
      vi.mocked(getIronSession).mockResolvedValue({
        accessToken: 'valid-token'
      } as never)

      const request = new NextRequest(new URL('https://example.com/u/spez'))
      const response = await proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('adds X-Robots-Tag header to /user/ routes', async () => {
      const {getIronSession} = await import('iron-session')
      vi.mocked(getIronSession).mockResolvedValue({
        accessToken: 'valid-token'
      } as never)

      const request = new NextRequest(
        new URL('https://example.com/user/spez/saved')
      )
      const response = await proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('adds X-Robots-Tag header to /search/ routes', async () => {
      const {getIronSession} = await import('iron-session')
      vi.mocked(getIronSession).mockResolvedValue({
        accessToken: 'valid-token'
      } as never)

      const request = new NextRequest(
        new URL('https://example.com/search/test')
      )
      const response = await proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('adds X-Robots-Tag header to /api/ routes', async () => {
      const request = new NextRequest(
        new URL('https://example.com/api/auth/login')
      )
      const response = await proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('adds X-Robots-Tag header to nested subreddit routes', async () => {
      const {getIronSession} = await import('iron-session')
      vi.mocked(getIronSession).mockResolvedValue({
        accessToken: 'valid-token'
      } as never)

      const request = new NextRequest(
        new URL('https://example.com/r/javascript/comments/abc123/title')
      )
      const response = await proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('adds X-Robots-Tag header to user profile routes', async () => {
      const {getIronSession} = await import('iron-session')
      vi.mocked(getIronSession).mockResolvedValue({
        accessToken: 'valid-token'
      } as never)

      const request = new NextRequest(
        new URL('https://example.com/u/testuser?tab=posts')
      )
      const response = await proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('adds X-Robots-Tag header to multireddit routes', async () => {
      const {getIronSession} = await import('iron-session')
      vi.mocked(getIronSession).mockResolvedValue({
        accessToken: 'valid-token'
      } as never)

      const request = new NextRequest(
        new URL('https://example.com/user/testuser/m/tech')
      )
      const response = await proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('adds X-Robots-Tag header to search results with query params', async () => {
      const {getIronSession} = await import('iron-session')
      vi.mocked(getIronSession).mockResolvedValue({
        accessToken: 'valid-token'
      } as never)

      const request = new NextRequest(
        new URL('https://example.com/search/javascript?sort=relevance')
      )
      const response = await proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })
  })

  describe('routes that should be allowed for indexing', () => {
    it('does not add X-Robots-Tag header to /about page', async () => {
      const request = new NextRequest(new URL('https://example.com/about'))
      const response = await proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBeNull()
    })

    it('does not add X-Robots-Tag header to /donate page', async () => {
      const request = new NextRequest(new URL('https://example.com/donate'))
      const response = await proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBeNull()
    })
  })

  describe('response behavior', () => {
    it('calls NextResponse.next() for blocked routes', async () => {
      const {getIronSession} = await import('iron-session')
      vi.mocked(getIronSession).mockResolvedValue({
        accessToken: 'valid-token'
      } as never)

      const request = new NextRequest(
        new URL('https://example.com/r/programming')
      )
      await proxy(request)

      expect(nextMock).toHaveBeenCalled()
    })

    it('calls NextResponse.next() for allowed routes', async () => {
      const request = new NextRequest(new URL('https://example.com/about'))
      await proxy(request)

      expect(nextMock).toHaveBeenCalled()
    })
  })

  describe('logging behavior', () => {
    it('skips logging for /api/healthcheck requests', async () => {
      const {logger} = await import('@/lib/axiom/server')
      const request = new NextRequest(
        new URL('https://example.com/api/healthcheck')
      )
      await proxy(request)

      expect(logger.info).not.toHaveBeenCalled()
      expect(logger.flush).not.toHaveBeenCalled()
    })

    it('skips logging for /api/axiom requests', async () => {
      const {logger} = await import('@/lib/axiom/server')
      const request = new NextRequest(new URL('https://example.com/api/axiom'))
      await proxy(request)

      expect(logger.info).not.toHaveBeenCalled()
      expect(logger.flush).not.toHaveBeenCalled()
    })

    it('logs non-healthcheck requests', async () => {
      const {getIronSession} = await import('iron-session')
      vi.mocked(getIronSession).mockResolvedValue({
        accessToken: 'valid-token'
      } as never)

      const {logger} = await import('@/lib/axiom/server')
      const request = new NextRequest(new URL('https://example.com/r/popular'))
      await proxy(request)

      expect(logger.info).toHaveBeenCalledWith('request', expect.anything())
      expect(logger.flush).toHaveBeenCalled()
    })

    it('uses waitUntil when NextFetchEvent is provided', async () => {
      const {getIronSession} = await import('iron-session')
      vi.mocked(getIronSession).mockResolvedValue({
        accessToken: 'valid-token'
      } as never)

      const {logger} = await import('@/lib/axiom/server')
      const request = new NextRequest(new URL('https://example.com/r/popular'))
      const mockEvent = {waitUntil: vi.fn()}
      await proxy(request, mockEvent as never)

      expect(mockEvent.waitUntil).toHaveBeenCalled()
      expect(logger.info).toHaveBeenCalled()
    })
  })
})
