import {logError} from '@/lib/utils/logError'
import {server} from '@/test-utils/msw/server'
import {http, HttpResponse} from 'msw'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {getSinglePost} from './getSinglePost'
import {getRedditToken} from './redditToken'

// Mock dependencies
vi.mock('./redditToken')
vi.mock('@/lib/utils/logError')

const mockGetRedditToken = vi.mocked(getRedditToken)
const mockLogError = vi.mocked(logError)

describe('getSinglePost', () => {
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

  it('should fetch and return post data successfully', async () => {
    const result = await getSinglePost('programming', 'abc123')

    expect(result).not.toBeNull()
    expect(result?.id).toBe('abc123')
    expect(result?.subreddit).toBe('programming')
  })

  it('should return null when token is not available', async () => {
    mockGetRedditToken.mockResolvedValue(null)

    const result = await getSinglePost('programming', 'abc123')

    expect(result).toBeNull()
  })

  it('should return null when API response is not ok', async () => {
    server.use(
      http.get(
        'https://oauth.reddit.com/r/:subreddit/comments/:postId.json',
        () => {
          return new HttpResponse(null, {status: 404})
        }
      )
    )

    const result = await getSinglePost('programming', 'abc123')

    expect(result).toBeNull()
  })

  it('should return null when post data is not in response', async () => {
    server.use(
      http.get(
        'https://oauth.reddit.com/r/:subreddit/comments/:postId.json',
        () => {
          return HttpResponse.json([])
        }
      )
    )

    const result = await getSinglePost('programming', 'abc123')

    expect(result).toBeNull()
  })

  it('should handle fetch errors and log them', async () => {
    server.use(
      http.get(
        'https://oauth.reddit.com/r/:subreddit/comments/:postId.json',
        () => {
          return HttpResponse.error()
        }
      )
    )

    const result = await getSinglePost('programming', 'abc123')

    expect(result).toBeNull()
    expect(mockLogError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        context: 'getSinglePost',
        subreddit: 'programming',
        postId: 'abc123'
      })
    )
  })
})
