import {POST} from '@/app/api/reddit/comment/route'
import * as rateLimit from '@/lib/auth/rateLimit'
import * as session from '@/lib/auth/session'
import {http, HttpResponse, server} from '@/test-utils'
import {NextRequest} from 'next/server'
import {describe, expect, it, vi} from 'vitest'

// Mock session module
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn()
}))

// Mock rate limit module
vi.mock('@/lib/auth/rateLimit', () => ({
  checkRateLimit: vi.fn()
}))

describe('POST /api/reddit/comment', () => {
  const mockAccessToken = 'test-access-token'
  const validRequest = {
    thing_id: 't1_abc123',
    text: 'This is a test comment'
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

  it('should successfully submit comment with valid auth and input', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment',
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
      http.post('https://oauth.reddit.com/api/comment', async ({request}) => {
        const body = await request.text()
        const params = new URLSearchParams(body)

        expect(params.get('thing_id')).toBe('t1_abc123')
        expect(params.get('text')).toBe('This is a test comment')
        expect(params.get('api_type')).toBe('json')

        return HttpResponse.json({
          json: {
            errors: [],
            data: {
              things: [
                {
                  kind: 't1',
                  data: {
                    id: 'new_comment_id',
                    name: 't1_new_comment_id',
                    author: 'testuser',
                    body: 'This is a test comment',
                    body_html:
                      '<div class="md"><p>This is a test comment</p></div>',
                    created_utc: 1234567890
                  }
                }
              ]
            }
          }
        })
      })
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      comment: {
        id: 'new_comment_id',
        name: 't1_new_comment_id',
        author: 'testuser',
        body: 'This is a test comment',
        created_utc: 1234567890
      }
    })
  })

  it('should return 403 when origin validation fails', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment',
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

  it('should return rate limit response when rate limited', async () => {
    const rateLimitResponse = new Response(
      JSON.stringify({error: 'Rate limit exceeded'}),
      {
        status: 429,
        headers: {'Content-Type': 'application/json'}
      }
    ) as unknown as ReturnType<typeof rateLimit.checkRateLimit> extends Promise<
      infer T
    >
      ? T
      : never

    vi.mocked(rateLimit.checkRateLimit).mockResolvedValue(rateLimitResponse)

    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment',
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

    expect(response.status).toBe(429)
  })

  it('should return 401 when not authenticated', async () => {
    vi.mocked(session.getSession).mockResolvedValue(null)

    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment',
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
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Authentication required')
  })

  it('should return 400 for missing thing_id', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000'
        },
        body: JSON.stringify({text: 'Test comment'})
      }
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('thing_id is required')
  })

  it('should return 400 for invalid thing_id format', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000'
        },
        body: JSON.stringify({thing_id: 'invalid', text: 'Test'})
      }
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('t1_xxx or t3_xxx')
  })

  it('should return 400 for missing text', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000'
        },
        body: JSON.stringify({thing_id: 't1_abc123'})
      }
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('text is required')
  })

  it('should return 400 for empty text after sanitization', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000'
        },
        body: JSON.stringify({thing_id: 't1_abc123', text: '   '})
      }
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Comment text cannot be empty')
  })

  it('should return 400 for text exceeding max length', async () => {
    const longText = 'a'.repeat(10001)
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000'
        },
        body: JSON.stringify({thing_id: 't1_abc123', text: longText})
      }
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('10,000 characters')
  })

  it('should sanitize text input properly', async () => {
    const maliciousText = '<script>alert("xss")</script>Safe text'

    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000'
        },
        body: JSON.stringify({thing_id: 't1_abc123', text: maliciousText})
      }
    )

    server.use(
      http.post('https://oauth.reddit.com/api/comment', async ({request}) => {
        const body = await request.text()
        const params = new URLSearchParams(body)
        const sanitizedText = params.get('text')

        // Text should be sanitized (script tag removed)
        expect(sanitizedText).not.toContain('<script>')
        expect(sanitizedText).toContain('Safe text')

        return HttpResponse.json({
          json: {
            errors: [],
            data: {
              things: [
                {
                  data: {
                    id: 'test',
                    name: 't1_test',
                    body: sanitizedText,
                    author: 'testuser',
                    created_utc: 1234567890
                  }
                }
              ]
            }
          }
        })
      })
    )

    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  it('should return 403 with helpful message for missing scope', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment',
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
      http.post('https://oauth.reddit.com/api/comment', () => {
        return new HttpResponse(null, {status: 403})
      })
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Missing required scope')
    expect(data.scope_required).toBe('submit')
    expect(data.message).toContain('log out and log back in')
  })

  it('should return 429 with user-friendly message for rate limiting', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment',
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
      http.post('https://oauth.reddit.com/api/comment', () => {
        return new HttpResponse(JSON.stringify({error: 'RATELIMIT'}), {
          status: 429
        })
      })
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toBe('Rate limit exceeded')
    expect(data.message).toContain('too quickly')
  })

  it('should handle Reddit API errors gracefully', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment',
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
      http.post('https://oauth.reddit.com/api/comment', () => {
        return HttpResponse.json({
          json: {
            errors: [['BAD_REQUEST', 'Invalid request']],
            data: {}
          }
        })
      })
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid request')
  })

  it('should accept t3_xxx format for top-level post comments', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000'
        },
        body: JSON.stringify({thing_id: 't3_xyz789', text: 'Top level comment'})
      }
    )

    server.use(
      http.post('https://oauth.reddit.com/api/comment', () => {
        return HttpResponse.json({
          json: {
            errors: [],
            data: {
              things: [
                {
                  data: {
                    id: 'test',
                    name: 't1_test',
                    body: 'Top level comment',
                    author: 'testuser',
                    created_utc: 1234567890
                  }
                }
              ]
            }
          }
        })
      })
    )

    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  it('should return 500 for unexpected errors', async () => {
    vi.mocked(session.getSession).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest(
      'http://localhost:3000/api/reddit/comment',
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
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })
})
