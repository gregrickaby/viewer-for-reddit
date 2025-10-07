import {server} from '@/test-utils/msw/server'
import {http, HttpResponse} from 'msw'
import {beforeEach, describe, expect, it, vi} from 'vitest'

// Mock session module
const mockSession = {
  username: 'testuser',
  accessToken: 'mock_access_token',
  refreshToken: 'mock_refresh_token',
  expiresAt: Date.now() + 3600000,
  sessionVersion: 1
}

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn()
}))

vi.mock('@/lib/utils/logging/logError', () => ({
  logError: vi.fn()
}))

describe('getUserData', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    // Default: user is authenticated
    const {getSession} = await import('@/lib/auth/session')
    vi.mocked(getSession).mockResolvedValue(mockSession)
  })

  it('should fetch and return current user data successfully', async () => {
    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', () => {
        return HttpResponse.json({
          name: 'testuser',
          id: 't2_abc123',
          icon_img: 'https://example.com/avatar.png',
          snoovatar_img: 'https://example.com/snoovatar.png',
          link_karma: 5000,
          comment_karma: 3000,
          created_utc: 1609459200
        })
      })
    )

    const {getUserData} = await import('./getUserData')
    const result = await getUserData()

    expect(result).not.toBeNull()
    expect(result?.name).toBe('testuser')
    expect(result?.id).toBe('t2_abc123')
    expect(result?.link_karma).toBe(5000)
    expect(result?.comment_karma).toBe(3000)
  })

  it('should return null when user is not authenticated', async () => {
    const {getSession} = await import('@/lib/auth/session')
    vi.mocked(getSession).mockResolvedValue(null)

    const {getUserData} = await import('./getUserData')
    const result = await getUserData()

    expect(result).toBeNull()
  })

  it('should return null when API returns error', async () => {
    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', () => {
        return new HttpResponse(null, {status: 401})
      })
    )

    const {getUserData} = await import('./getUserData')
    const result = await getUserData()

    expect(result).toBeNull()
  })

  it('should handle user data without optional fields', async () => {
    server.use(
      http.get('https://oauth.reddit.com/api/v1/me', () => {
        return HttpResponse.json({
          name: 'testuser',
          id: 't2_xyz789',
          link_karma: 100,
          comment_karma: 50,
          created_utc: 1609459200
        })
      })
    )

    const {getUserData} = await import('./getUserData')
    const result = await getUserData()

    expect(result).not.toBeNull()
    expect(result?.name).toBe('testuser')
    expect(result?.icon_img).toBeUndefined()
    expect(result?.snoovatar_img).toBeUndefined()
  })
})

describe('getUserSubscriptions', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    // Default: user is authenticated
    const {getSession} = await import('@/lib/auth/session')
    vi.mocked(getSession).mockResolvedValue(mockSession)
  })

  it('should fetch and return user subscriptions successfully', async () => {
    server.use(
      http.get('https://oauth.reddit.com/subreddits/mine/subscriber', () => {
        return HttpResponse.json({
          data: {
            children: [
              {
                data: {
                  display_name: 'javascript',
                  icon_img: 'https://example.com/js.png',
                  subscribers: 100000
                }
              },
              {
                data: {
                  display_name: 'typescript',
                  icon_img: 'https://example.com/ts.png',
                  subscribers: 50000
                }
              }
            ]
          }
        })
      })
    )

    const {getUserSubscriptions} = await import('./getUserData')
    const result = await getUserSubscriptions()

    expect(result).toHaveLength(2)
    expect(result[0].data.display_name).toBe('javascript')
    expect(result[1].data.display_name).toBe('typescript')
  })

  it('should return empty array when user is not authenticated', async () => {
    const {getSession} = await import('@/lib/auth/session')
    vi.mocked(getSession).mockResolvedValue(null)

    const {getUserSubscriptions} = await import('./getUserData')
    const result = await getUserSubscriptions()

    expect(result).toEqual([])
  })

  it('should return empty array when API returns error', async () => {
    server.use(
      http.get('https://oauth.reddit.com/subreddits/mine/subscriber', () => {
        return new HttpResponse(null, {status: 500})
      })
    )

    const {getUserSubscriptions} = await import('./getUserData')
    const result = await getUserSubscriptions()

    expect(result).toEqual([])
  })

  it('should return empty array when API response is missing data', async () => {
    server.use(
      http.get('https://oauth.reddit.com/subreddits/mine/subscriber', () => {
        return HttpResponse.json({})
      })
    )

    const {getUserSubscriptions} = await import('./getUserData')
    const result = await getUserSubscriptions()

    expect(result).toEqual([])
  })

  it('should return empty array when children is missing', async () => {
    server.use(
      http.get('https://oauth.reddit.com/subreddits/mine/subscriber', () => {
        return HttpResponse.json({
          data: {}
        })
      })
    )

    const {getUserSubscriptions} = await import('./getUserData')
    const result = await getUserSubscriptions()

    expect(result).toEqual([])
  })

  it('should handle subscriptions without optional fields', async () => {
    server.use(
      http.get('https://oauth.reddit.com/subreddits/mine/subscriber', () => {
        return HttpResponse.json({
          data: {
            children: [
              {
                data: {
                  display_name: 'programming',
                  subscribers: 10000
                }
              }
            ]
          }
        })
      })
    )

    const {getUserSubscriptions} = await import('./getUserData')
    const result = await getUserSubscriptions()

    expect(result).toHaveLength(1)
    expect(result[0].data.display_name).toBe('programming')
    expect(result[0].data.icon_img).toBeUndefined()
  })
})

describe('getUserHomeFeed', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    // Default: user is authenticated
    const {getSession} = await import('@/lib/auth/session')
    vi.mocked(getSession).mockResolvedValue(mockSession)
  })

  it('should fetch and return user home feed successfully', async () => {
    server.use(
      http.get('https://oauth.reddit.com/best', () => {
        return HttpResponse.json({
          data: {
            children: [
              {kind: 't3', data: {id: 'post1', title: 'Test Post 1'}},
              {kind: 't3', data: {id: 'post2', title: 'Test Post 2'}}
            ],
            after: 't3_next_page'
          }
        })
      })
    )

    const {getUserHomeFeed} = await import('./getUserData')
    const result = await getUserHomeFeed()

    expect(result.children).toHaveLength(2)
    expect(result.after).toBe('t3_next_page')
    expect(result.children[0].data.title).toBe('Test Post 1')
  })

  it('should handle pagination with after parameter', async () => {
    server.use(
      http.get('https://oauth.reddit.com/best', ({request}) => {
        const url = new URL(request.url)
        const after = url.searchParams.get('after')

        expect(after).toBe('t3_page2')

        return HttpResponse.json({
          data: {
            children: [{kind: 't3', data: {id: 'post3'}}],
            after: 't3_page3'
          }
        })
      })
    )

    const {getUserHomeFeed} = await import('./getUserData')
    const result = await getUserHomeFeed({after: 't3_page2'})

    expect(result.children).toHaveLength(1)
    expect(result.after).toBe('t3_page3')
  })

  it('should handle custom limit parameter', async () => {
    server.use(
      http.get('https://oauth.reddit.com/best', ({request}) => {
        const url = new URL(request.url)
        const limit = url.searchParams.get('limit')

        expect(limit).toBe('50')

        return HttpResponse.json({
          data: {
            children: [],
            after: null
          }
        })
      })
    )

    const {getUserHomeFeed} = await import('./getUserData')
    await getUserHomeFeed({limit: 50})
  })

  it('should handle both after and limit parameters', async () => {
    server.use(
      http.get('https://oauth.reddit.com/best', ({request}) => {
        const url = new URL(request.url)
        const after = url.searchParams.get('after')
        const limit = url.searchParams.get('limit')

        expect(after).toBe('t3_page2')
        expect(limit).toBe('25')

        return HttpResponse.json({
          data: {
            children: [],
            after: null
          }
        })
      })
    )

    const {getUserHomeFeed} = await import('./getUserData')
    await getUserHomeFeed({after: 't3_page2', limit: 25})
  })

  it('should return empty feed when user is not authenticated', async () => {
    const {getSession} = await import('@/lib/auth/session')
    vi.mocked(getSession).mockResolvedValue(null)

    const {getUserHomeFeed} = await import('./getUserData')
    const result = await getUserHomeFeed()

    expect(result).toEqual({children: [], after: null})
  })

  it('should return empty feed when API returns error', async () => {
    server.use(
      http.get('https://oauth.reddit.com/best', () => {
        return new HttpResponse(null, {status: 500})
      })
    )

    const {getUserHomeFeed} = await import('./getUserData')
    const result = await getUserHomeFeed()

    expect(result).toEqual({children: [], after: null})
  })

  it('should return empty feed when API response is missing data', async () => {
    server.use(
      http.get('https://oauth.reddit.com/best', () => {
        return HttpResponse.json({})
      })
    )

    const {getUserHomeFeed} = await import('./getUserData')
    const result = await getUserHomeFeed()

    expect(result).toEqual({children: [], after: null})
  })

  it('should handle last page (after is null)', async () => {
    server.use(
      http.get('https://oauth.reddit.com/best', () => {
        return HttpResponse.json({
          data: {
            children: [{kind: 't3', data: {id: 'final_post'}}],
            after: null
          }
        })
      })
    )

    const {getUserHomeFeed} = await import('./getUserData')
    const result = await getUserHomeFeed()

    expect(result.children).toHaveLength(1)
    expect(result.after).toBeNull()
  })
})
