import {logError} from '@/lib/utils/logError'
import {server} from '@/test-utils/msw/server'
import {http, HttpResponse} from 'msw'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {getUserProfile} from './getUserProfile'
import {getRedditToken} from './redditToken'

// Mock dependencies
vi.mock('./redditToken')
vi.mock('@/lib/utils/logError')

const mockGetRedditToken = vi.mocked(getRedditToken)
const mockLogError = vi.mocked(logError)

describe('getUserProfile', () => {
  const mockToken = {
    access_token: 'test-token',
    token_type: 'bearer',
    expires_in: 3600,
    scope: '*'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetRedditToken.mockResolvedValue(mockToken)
  })

  it('should fetch and return user profile data successfully', async () => {
    // Override needed - using test data
    server.use(
      http.get('https://oauth.reddit.com/user/:username/about.json', () => {
        return HttpResponse.json({
          kind: 't2',
          data: {
            name: 'testuser',
            icon_img: 'https://example.com/avatar.png',
            link_karma: 1000,
            comment_karma: 500,
            created_utc: 1234567890
          }
        })
      })
    )

    const result = await getUserProfile('testuser')

    expect(result).not.toBeNull()
    expect(result?.name).toBe('testuser')
    expect(result?.link_karma).toBe(1000)
  })

  it('should return null when token is not available', async () => {
    mockGetRedditToken.mockResolvedValue(null)

    const result = await getUserProfile('testuser')

    expect(result).toBeNull()
  })

  it('should return null when API response is not ok', async () => {
    // Override global handler for 404 edge case
    server.use(
      http.get('https://oauth.reddit.com/user/:username/about.json', () => {
        return new HttpResponse(null, {status: 404})
      })
    )

    const result = await getUserProfile('deleteduser')

    expect(result).toBeNull()
  })

  it('should return null when user data is not in response', async () => {
    // Override global handler for empty response edge case
    server.use(
      http.get('https://oauth.reddit.com/user/:username/about.json', () => {
        return HttpResponse.json({})
      })
    )

    const result = await getUserProfile('testuser')

    expect(result).toBeNull()
  })

  it('should handle fetch errors and log them', async () => {
    // Override global handler for network error edge case
    server.use(
      http.get('https://oauth.reddit.com/user/:username/about.json', () => {
        return HttpResponse.error()
      })
    )

    const result = await getUserProfile('testuser')

    expect(result).toBeNull()
    expect(mockLogError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        context: 'getUserProfile',
        username: 'testuser'
      })
    )
  })
})
