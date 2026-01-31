import {NextRequest, NextResponse} from 'next/server'
import {describe, expect, it, vi, beforeEach} from 'vitest'
import {proxy} from './proxy'

// Mock NextResponse.next()
vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server')
  return {
    ...actual,
    NextResponse: {
      next: vi.fn(() => ({
        headers: new Headers()
      }))
    }
  }
})

describe('proxy middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('routes that should be blocked from indexing', () => {
    it('adds X-Robots-Tag header to /r/ routes', () => {
      const request = new NextRequest(
        new URL('https://example.com/r/programming')
      )
      const response = proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('adds X-Robots-Tag header to /u/ routes', () => {
      const request = new NextRequest(new URL('https://example.com/u/spez'))
      const response = proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('adds X-Robots-Tag header to /user/ routes', () => {
      const request = new NextRequest(
        new URL('https://example.com/user/spez/saved')
      )
      const response = proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('adds X-Robots-Tag header to /search/ routes', () => {
      const request = new NextRequest(
        new URL('https://example.com/search/test')
      )
      const response = proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('adds X-Robots-Tag header to /api/ routes', () => {
      const request = new NextRequest(
        new URL('https://example.com/api/auth/login')
      )
      const response = proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('adds X-Robots-Tag header to nested subreddit routes', () => {
      const request = new NextRequest(
        new URL('https://example.com/r/javascript/comments/abc123/title')
      )
      const response = proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('adds X-Robots-Tag header to user profile routes', () => {
      const request = new NextRequest(
        new URL('https://example.com/u/testuser?tab=posts')
      )
      const response = proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('adds X-Robots-Tag header to multireddit routes', () => {
      const request = new NextRequest(
        new URL('https://example.com/user/testuser/m/tech')
      )
      const response = proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('adds X-Robots-Tag header to search results with query params', () => {
      const request = new NextRequest(
        new URL('https://example.com/search/javascript?sort=relevance')
      )
      const response = proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })
  })

  describe('routes that should be allowed for indexing', () => {
    it('does not add X-Robots-Tag header to homepage', () => {
      const request = new NextRequest(new URL('https://example.com/'))
      const response = proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBeNull()
    })

    it('does not add X-Robots-Tag header to /about page', () => {
      const request = new NextRequest(new URL('https://example.com/about'))
      const response = proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBeNull()
    })

    it('does not add X-Robots-Tag header to /donate page', () => {
      const request = new NextRequest(new URL('https://example.com/donate'))
      const response = proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBeNull()
    })

    it('does not add X-Robots-Tag header to custom routes', () => {
      const request = new NextRequest(
        new URL('https://example.com/some-custom-page')
      )
      const response = proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('handles routes that start with blocked prefixes but are different', () => {
      // Routes like /random or /update should not be blocked just because they start with 'r' or 'u'
      const request1 = new NextRequest(
        new URL('https://example.com/random-page')
      )
      const response1 = proxy(request1)
      expect(response1.headers.get('X-Robots-Tag')).toBeNull()

      const request2 = new NextRequest(
        new URL('https://example.com/update-log')
      )
      const response2 = proxy(request2)
      expect(response2.headers.get('X-Robots-Tag')).toBeNull()
    })

    it('blocks exactly /r/ at the start of pathname', () => {
      const request = new NextRequest(new URL('https://example.com/r/'))
      const response = proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('blocks exactly /u/ at the start of pathname', () => {
      const request = new NextRequest(new URL('https://example.com/u/'))
      const response = proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('blocks exactly /user/ at the start of pathname', () => {
      const request = new NextRequest(new URL('https://example.com/user/'))
      const response = proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('blocks exactly /search/ at the start of pathname', () => {
      const request = new NextRequest(new URL('https://example.com/search/'))
      const response = proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('blocks exactly /api/ at the start of pathname', () => {
      const request = new NextRequest(new URL('https://example.com/api/'))
      const response = proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('handles URLs with hash fragments', () => {
      const request = new NextRequest(
        new URL('https://example.com/r/programming#top')
      )
      const response = proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('handles URLs with multiple query parameters', () => {
      const request = new NextRequest(
        new URL('https://example.com/r/popular?sort=hot&time=day&limit=25')
      )
      const response = proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('handles URLs with special characters in path', () => {
      const request = new NextRequest(
        new URL('https://example.com/search/hello%20world')
      )
      const response = proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('handles deeply nested paths', () => {
      const request = new NextRequest(
        new URL(
          'https://example.com/r/programming/comments/abc123/title/xyz789'
        )
      )
      const response = proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('handles case-sensitive paths correctly', () => {
      // /R/ is different from /r/, should not be blocked
      const request = new NextRequest(
        new URL('https://example.com/R/programming')
      )
      const response = proxy(request)

      expect(response.headers.get('X-Robots-Tag')).toBeNull()
    })
  })

  describe('response behavior', () => {
    it('calls NextResponse.next() for blocked routes', () => {
      const request = new NextRequest(
        new URL('https://example.com/r/programming')
      )
      proxy(request)

      expect(NextResponse.next).toHaveBeenCalled()
    })

    it('calls NextResponse.next() for allowed routes', () => {
      const request = new NextRequest(new URL('https://example.com/about'))
      proxy(request)

      expect(NextResponse.next).toHaveBeenCalled()
    })

    it('returns a NextResponse object', () => {
      const request = new NextRequest(
        new URL('https://example.com/r/programming')
      )
      const response = proxy(request)

      expect(response).toBeDefined()
      expect(response.headers).toBeDefined()
    })
  })

  describe('security implications', () => {
    it('prevents indexing of user-generated content routes', () => {
      const routes = [
        '/r/test',
        '/u/user',
        '/search/query',
        '/r/sub/comments/123/title'
      ]

      routes.forEach((path) => {
        const request = new NextRequest(new URL(`https://example.com${path}`))
        const response = proxy(request)
        expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
      })
    })

    it('prevents indexing of API routes', () => {
      const apiRoutes = [
        '/api/auth/login',
        '/api/auth/callback/reddit',
        '/api/some-endpoint'
      ]

      apiRoutes.forEach((path) => {
        const request = new NextRequest(new URL(`https://example.com${path}`))
        const response = proxy(request)
        expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
      })
    })

    it('allows indexing of static pages that should be in search results', () => {
      const allowedRoutes = ['/', '/about', '/donate', '/privacy']

      allowedRoutes.forEach((path) => {
        const request = new NextRequest(new URL(`https://example.com${path}`))
        const response = proxy(request)
        expect(response.headers.get('X-Robots-Tag')).toBeNull()
      })
    })
  })
})
