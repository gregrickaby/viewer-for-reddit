import {logError} from '@/lib/utils/logError'
import {server} from '@/test-utils/msw/server'
import {http, HttpResponse} from 'msw'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {getSubreddit} from './getSubreddit'
import {getRedditToken} from './redditToken'

// Mock dependencies
vi.mock('./redditToken')
vi.mock('@/lib/utils/logError')

const mockGetRedditToken = vi.mocked(getRedditToken)
const mockLogError = vi.mocked(logError)

describe('getSubreddit', () => {
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

  it('should fetch and return subreddit data successfully', async () => {
    // Override needed - global handler not reaching this endpoint
    server.use(
      http.get('https://oauth.reddit.com/r/:subreddit/about.json', () => {
        return HttpResponse.json({
          kind: 't5',
          data: {
            display_name: 'programming',
            public_description: 'Computer programming',
            subscribers: 1000000,
            icon_img: 'https://example.com/icon.png'
          }
        })
      })
    )

    const result = await getSubreddit('programming')

    expect(result).not.toBeNull()
    expect(result?.display_name).toBe('programming')
    expect(result?.public_description).toBe('Computer programming')
  })

  it('should return null when token is not available', async () => {
    mockGetRedditToken.mockResolvedValue(null)

    const result = await getSubreddit('programming')

    expect(result).toBeNull()
  })

  it('should return null when API response is not ok', async () => {
    // Override global handler for 404 edge case
    server.use(
      http.get('https://oauth.reddit.com/r/:subreddit/about.json', () => {
        return new HttpResponse(null, {status: 404})
      })
    )

    const result = await getSubreddit('notarealsubreddit')

    expect(result).toBeNull()
  })

  it('should return null when subreddit data is not in response', async () => {
    // Override global handler for empty response edge case
    server.use(
      http.get('https://oauth.reddit.com/r/:subreddit/about.json', () => {
        return HttpResponse.json({})
      })
    )

    const result = await getSubreddit('programming')

    expect(result).toBeNull()
  })

  it('should handle fetch errors and log them', async () => {
    // Override global handler for network error edge case
    server.use(
      http.get('https://oauth.reddit.com/r/:subreddit/about.json', () => {
        return HttpResponse.error()
      })
    )

    const result = await getSubreddit('programming')

    expect(result).toBeNull()
    expect(mockLogError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        context: 'getSubreddit',
        subreddit: 'programming'
      })
    )
  })
})
