import {logError} from '@/lib/utils/logError'
import {tokenMock} from '@/test-utils/mocks/token'
import {server} from '@/test-utils/msw/server'
import {http, HttpResponse} from 'msw'
import {fetchToken, getRedditToken} from './redditToken'

import {
  getCachedToken,
  getRequestCount,
  resetTokenState,
  setTokenState,
  shouldFetchNewToken
} from '@/lib/utils/token'

vi.mock('@/lib/utils/logError', () => ({
  logError: vi.fn()
}))

describe('fetchToken', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    resetTokenState()
    vi.stubEnv('REDDIT_CLIENT_ID', 'test_id')
    vi.stubEnv('REDDIT_CLIENT_SECRET', 'test_secret')
  })

  it('returns a valid token on success', async () => {
    const token = await fetchToken()

    expect(token).toStrictEqual(tokenMock)
  })

  it('returns null when no token is cached', () => {
    expect(getCachedToken()).toBeNull()
  })

  it('returns the cached token when one is set', () => {
    setTokenState(tokenMock, 0)
    expect(getCachedToken()).toStrictEqual(tokenMock)
  })

  it('throws an error when ENV vars are missing', async () => {
    vi.unstubAllEnvs()

    const token = await fetchToken()

    expect(token).toBeNull()
    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Missing Reddit ENV variables'
      })
    )

    vi.stubEnv('REDDIT_CLIENT_ID', 'test_id')
    vi.stubEnv('REDDIT_CLIENT_SECRET', 'test_secret')
  })

  it('throws an error when the token request fails', async () => {
    server.use(
      http.post('https://www.reddit.com/api/v1/access_token', async () => {
        return HttpResponse.json(
          {
            message: 'Unauthorized'
          },
          {status: 401}
        )
      })
    )

    const token = await fetchToken()

    expect(token).toBeNull()
    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Failed to fetch Reddit OAuth token: Unauthorized'
      })
    )
  })

  it('throws an error when the token response is invalid', async () => {
    server.use(
      http.post('https://www.reddit.com/api/v1/access_token', async () => {
        return HttpResponse.json({
          access_token: '',
          expires_in: 0,
          scope: '',
          token_type: ''
        })
      })
    )

    const token = await fetchToken()

    expect(token).toBeNull()
    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Invalid token response'
      })
    )
  })
})

describe('getRedditToken', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    resetTokenState()
    vi.stubEnv('REDDIT_CLIENT_ID', 'test_id')
    vi.stubEnv('REDDIT_CLIENT_SECRET', 'test_secret')
  })

  it('fetches and caches a new token when no token exists', async () => {
    const token = await getRedditToken()
    expect(token).toStrictEqual(tokenMock)
    expect(getRequestCount()).toBe(0)
  })

  it('uses cached token if within request limit', async () => {
    setTokenState(tokenMock, 100)
    const token = await getRedditToken()
    expect(token).toStrictEqual(tokenMock)
    expect(getRequestCount()).toBe(101)
  })

  it('fetches new token if request limit is exceeded', async () => {
    setTokenState(tokenMock, 951)
    const token = await getRedditToken()
    expect(token).toStrictEqual(tokenMock)
    expect(getRequestCount()).toBe(0)
  })

  it('shouldFetchNewToken returns true with no token', () => {
    resetTokenState()
    expect(shouldFetchNewToken()).toBe(true)
  })

  it('shouldFetchNewToken returns true if request count is high', () => {
    setTokenState(tokenMock, 1000)
    expect(shouldFetchNewToken()).toBe(true)
  })

  it('shouldFetchNewToken returns false when token is cached and under limit', () => {
    setTokenState(tokenMock, 100)
    expect(shouldFetchNewToken()).toBe(false)
  })

  it('logs and returns null if token response is missing access_token', async () => {
    server.use(
      http.post('https://www.reddit.com/api/v1/access_token', () =>
        HttpResponse.json({
          access_token: '',
          token_type: 'bearer',
          expires_in: 86400,
          scope: '*',
          error: 'invalid_token'
        })
      )
    )

    const result = await getRedditToken()

    expect(result).toBeNull()
    expect(logError).toHaveBeenCalledWith('Failed to fetch Reddit OAuth token')
  })
})
