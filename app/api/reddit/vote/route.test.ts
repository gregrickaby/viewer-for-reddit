import {POST} from '@/app/api/reddit/vote/route'
import {getSession} from '@/lib/auth/session'
import {validateOrigin} from '@/lib/utils/validateOrigin'
import {http, HttpResponse, server} from '@/test-utils'
import {NextRequest} from 'next/server'
import {type Mock} from 'vitest'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/utils/validateOrigin')
vi.mock('@/lib/utils/logError')

describe('POST /api/reddit/vote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(validateOrigin as Mock).mockReturnValue(true)
    ;(getSession as Mock).mockResolvedValue({
      accessToken: 'test-token',
      username: 'testuser'
    })
  })

  it('should return 403 if origin validation fails', async () => {
    ;(validateOrigin as Mock).mockReturnValue(false)

    const request = new NextRequest('http://localhost:3000/api/reddit/vote', {
      method: 'POST',
      body: JSON.stringify({id: 't3_abc123', dir: 1})
    })

    const response = await POST(request)
    expect(response.status).toBe(403)
  })

  it('should return 400 if id is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/reddit/vote', {
      method: 'POST',
      body: JSON.stringify({dir: 1})
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toContain('id is required')
  })

  it('should return 400 if dir is invalid', async () => {
    const request = new NextRequest('http://localhost:3000/api/reddit/vote', {
      method: 'POST',
      body: JSON.stringify({id: 't3_abc123', dir: 5})
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toContain('dir must be 1, 0, or -1')
  })

  it('should return 400 if id format is invalid', async () => {
    const request = new NextRequest('http://localhost:3000/api/reddit/vote', {
      method: 'POST',
      body: JSON.stringify({id: 'invalid_id', dir: 1})
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toContain('id must be in format t1_xxx or t3_xxx')
  })

  it('should return 401 if user is not authenticated', async () => {
    ;(getSession as Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/reddit/vote', {
      method: 'POST',
      body: JSON.stringify({id: 't3_abc123', dir: 1})
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('should successfully submit vote to Reddit API', async () => {
    server.use(
      http.post('https://oauth.reddit.com/api/vote', () => {
        return HttpResponse.json({})
      })
    )

    const request = new NextRequest('http://localhost:3000/api/reddit/vote', {
      method: 'POST',
      body: JSON.stringify({id: 't3_abc123', dir: 1})
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
  })

  it('should handle Reddit API errors', async () => {
    server.use(
      http.post('https://oauth.reddit.com/api/vote', () => {
        return HttpResponse.text('Internal Server Error', {status: 500})
      })
    )

    const request = new NextRequest('http://localhost:3000/api/reddit/vote', {
      method: 'POST',
      body: JSON.stringify({id: 't3_abc123', dir: 1})
    })

    const response = await POST(request)
    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data.error).toBe('Failed to submit vote to Reddit')
  })

  it('should accept valid comment id (t1_xxx)', async () => {
    server.use(
      http.post('https://oauth.reddit.com/api/vote', () => {
        return HttpResponse.json({})
      })
    )

    const request = new NextRequest('http://localhost:3000/api/reddit/vote', {
      method: 'POST',
      body: JSON.stringify({id: 't1_xyz789', dir: -1})
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  it('should accept dir=0 for unvoting', async () => {
    server.use(
      http.post('https://oauth.reddit.com/api/vote', () => {
        return HttpResponse.json({})
      })
    )

    const request = new NextRequest('http://localhost:3000/api/reddit/vote', {
      method: 'POST',
      body: JSON.stringify({id: 't3_abc123', dir: 0})
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
  })
})
