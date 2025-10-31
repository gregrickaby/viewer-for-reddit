import * as rateLimit from '@/lib/auth/rateLimit'
import * as session from '@/lib/auth/session'
import {http, HttpResponse} from '@/test-utils'
import {server} from '@/test-utils/msw/server'
import {NextRequest} from 'next/server'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {POST} from './route'

// Mock session module
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn()
}))

// Mock rate limit module
vi.mock('@/lib/auth/rateLimit', () => ({
  checkRateLimit: vi.fn()
}))

describe('DELETE /api/reddit/comment/delete', () => {
  const mockAccessToken = 'test-access-token'
  const validRequest = {
    id: 't1_test123'
  }

  beforeEach(() => {
    vi.mocked(session.getSession).mockResolvedValue({
      username: 'testuser',
      accessToken: mockAccessToken,
      refreshToken: 'test-refresh-token',
      expiresAt: Date.now() + 3600000,
      sessionVersion: 1
    })
    vi.mocked(rateLimit.checkRateLimit).mockResolvedValue(null)
  })

  it('should delete comment successfully', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment/delete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000'
        },
        body: JSON.stringify(validRequest)
      }
    )

    server.use(
      http.post('https://oauth.reddit.com/api/del', () => {
        return new HttpResponse(null, {status: 200})
      })
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({success: true})
  })

  it('should return 403 when origin validation fails', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment/delete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://evil.com'
        },
        body: JSON.stringify(validRequest)
      }
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
  })

  it('should return 401 when user is not authenticated', async () => {
    // Mock unauthenticated session
    vi.mocked(session.getSession).mockResolvedValueOnce(null)

    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment/delete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000',
          Cookie: '' // No session cookie
        },
        body: JSON.stringify(validRequest)
      }
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Authentication required')
  })

  it('should return 400 when id is missing', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment/delete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000'
        },
        body: JSON.stringify({})
      }
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('id is required')
  })

  it('should return 400 when id is not a string', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment/delete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000'
        },
        body: JSON.stringify({id: 12345})
      }
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('id is required and must be a string')
  })

  it('should return 400 when id has invalid format', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment/delete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000'
        },
        body: JSON.stringify({id: 'invalid_id'})
      }
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('must be in format t1_xxx')
  })

  it('should return 400 for post ID instead of comment ID', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment/delete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000'
        },
        body: JSON.stringify({id: 't3_test123'})
      }
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('must be in format t1_xxx')
  })

  it('should return 403 with helpful message for missing scope', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment/delete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000'
        },
        body: JSON.stringify(validRequest)
      }
    )

    server.use(
      http.post('https://oauth.reddit.com/api/del', () => {
        return new HttpResponse(null, {status: 403})
      })
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Missing required scope')
    expect(data.scope_required).toBe('edit')
    expect(data.message).toContain('log out and log back in')
  })

  it('should return 404 when comment not found', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment/delete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000'
        },
        body: JSON.stringify(validRequest)
      }
    )

    server.use(
      http.post('https://oauth.reddit.com/api/del', () => {
        return new HttpResponse(null, {status: 404})
      })
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Comment not found')
  })

  it('should return 429 with user-friendly message for rate limiting', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment/delete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000'
        },
        body: JSON.stringify(validRequest)
      }
    )

    server.use(
      http.post('https://oauth.reddit.com/api/del', () => {
        return new HttpResponse(null, {status: 429})
      })
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toBe('Rate limit exceeded')
    expect(data.message).toContain('too quickly')
  })

  it('should return 500 for Reddit server errors', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment/delete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000'
        },
        body: JSON.stringify(validRequest)
      }
    )

    server.use(
      http.post('https://oauth.reddit.com/api/del', () => {
        return new HttpResponse(null, {status: 500})
      })
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to delete comment')
  })

  it('should return 500 when request parsing fails', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment/delete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000'
        },
        body: 'invalid json'
      }
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })

  it('should include cache-control headers in all responses', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment/delete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000'
        },
        body: JSON.stringify(validRequest)
      }
    )

    const response = await POST(request)
    const cacheControl = response.headers.get('Cache-Control')

    expect(cacheControl).toBe('no-store, max-age=0')
  })

  it('should send correct request format to Reddit API', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment/delete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000'
        },
        body: JSON.stringify(validRequest)
      }
    )

    let capturedBody: string | null = null

    server.use(
      http.post('https://oauth.reddit.com/api/del', async ({request}) => {
        capturedBody = await request.text()
        return new HttpResponse(null, {status: 200})
      })
    )

    await POST(request)

    expect(capturedBody).toBe('id=t1_test123')
  })

  it('should include authorization header in Reddit API request', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment/delete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000'
        },
        body: JSON.stringify(validRequest)
      }
    )

    let authHeader: string | null = null
    let userAgentHeader: string | null = null

    server.use(
      http.post('https://oauth.reddit.com/api/del', ({request}) => {
        authHeader = request.headers.get('Authorization')
        userAgentHeader = request.headers.get('User-Agent')
        return new HttpResponse(null, {status: 200})
      })
    )

    await POST(request)

    expect(authHeader).toContain('Bearer')
    expect(userAgentHeader).toBeTruthy()
  })
})
