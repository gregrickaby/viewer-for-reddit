import {beforeEach, describe, expect, it, vi, type Mock} from 'vitest'

// Declare globals for TypeScript
declare global {
  var mockArcticCreateAuthorizationURL: Mock
  var mockArcticValidateAuthorizationCode: Mock
  var mockArcticRefreshAccessToken: Mock
  var mockArcticGenerateState: Mock
}

// Mutable mock implementations — accessible across tests without hoisting issues
globalThis.mockArcticCreateAuthorizationURL = vi.fn(
  (state: string, scopes: string[]) =>
    new URL(
      `https://reddit.com/api/v1/authorize?state=${state}&scope=${scopes.join('+')}`
    )
)
globalThis.mockArcticValidateAuthorizationCode = vi.fn()
globalThis.mockArcticRefreshAccessToken = vi.fn()
globalThis.mockArcticGenerateState = vi.fn(() => 'mock-state-abc123')

// Mock arctic BEFORE imports so the singleton picks up the mocked class
vi.mock('arctic', () => ({
  Reddit: class {
    createAuthorizationURL(state: string, scopes: string[]) {
      return globalThis.mockArcticCreateAuthorizationURL(state, scopes)
    }
    validateAuthorizationCode(code: string) {
      return globalThis.mockArcticValidateAuthorizationCode(code)
    }
    refreshAccessToken(token: string) {
      return globalThis.mockArcticRefreshAccessToken(token)
    }
  },
  generateState: () => globalThis.mockArcticGenerateState()
}))

vi.mock('@/lib/utils/env', () => ({
  getEnvVar: vi.fn((key: string) => {
    if (key === 'REDDIT_CLIENT_ID') return 'test-client-id'
    if (key === 'REDDIT_CLIENT_SECRET') return 'test-client-secret'
    if (key === 'REDDIT_REDIRECT_URI')
      return 'https://example.com/api/auth/callback/reddit'
    return ''
  })
}))

// Import after mocks
import {createLoginUrl, exchangeCode, refreshToken} from './reddit-auth'

describe('lib/reddit-auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.mockArcticGenerateState.mockReturnValue('mock-state-abc123')
    globalThis.mockArcticCreateAuthorizationURL.mockImplementation(
      (state: string, scopes: string[]) =>
        new URL(
          `https://reddit.com/api/v1/authorize?state=${state}&scope=${scopes.join('+')}`
        )
    )
  })

  describe('createLoginUrl', () => {
    it('returns a URL pointing to Reddit authorization endpoint', async () => {
      const {url} = await createLoginUrl()

      expect(url.hostname).toBe('reddit.com')
      expect(url.pathname).toBe('/api/v1/authorize')
    })

    it('returns a non-empty state string', async () => {
      const {state} = await createLoginUrl()

      expect(typeof state).toBe('string')
      expect(state.length).toBeGreaterThan(0)
      expect(state).toBe('mock-state-abc123')
    })

    it('embeds the state in the authorization URL', async () => {
      const {url, state} = await createLoginUrl()

      expect(url.searchParams.get('state')).toBe(state)
    })

    it('includes all required OAuth scopes', async () => {
      const {url} = await createLoginUrl()

      // The mock joins scopes with '+', which URLSearchParams decodes as spaces
      const scopeParam = url.searchParams.get('scope') ?? ''
      const scopes = scopeParam.split(' ')

      for (const expected of [
        'identity',
        'read',
        'vote',
        'subscribe',
        'mysubreddits',
        'save',
        'submit',
        'edit',
        'history'
      ]) {
        expect(scopes).toContain(expected)
      }
    })

    it('adds duration=permanent to the URL', async () => {
      const {url} = await createLoginUrl()

      expect(url.searchParams.get('duration')).toBe('permanent')
    })

    it('propagates errors thrown by Arctic', async () => {
      globalThis.mockArcticCreateAuthorizationURL.mockImplementation(() => {
        throw new Error('Arctic initialization failed')
      })

      await expect(createLoginUrl()).rejects.toThrow(
        'Arctic initialization failed'
      )
    })
  })

  describe('exchangeCode', () => {
    it('calls Arctic validateAuthorizationCode with the supplied code', async () => {
      const mockTokens = {
        accessToken: vi.fn(() => 'access-token-xyz'),
        refreshToken: vi.fn(() => 'refresh-token-xyz'),
        accessTokenExpiresAt: vi.fn(() => new Date(Date.now() + 3600000))
      }
      globalThis.mockArcticValidateAuthorizationCode.mockResolvedValue(
        mockTokens
      )

      const tokens = await exchangeCode('auth-code-123')

      expect(
        globalThis.mockArcticValidateAuthorizationCode
      ).toHaveBeenCalledWith('auth-code-123')
      expect(tokens.accessToken()).toBe('access-token-xyz')
      expect(tokens.refreshToken()).toBe('refresh-token-xyz')
      expect(tokens.accessTokenExpiresAt()).toBeInstanceOf(Date)
    })

    it('returns tokens in AuthTokens shape', async () => {
      const expiry = new Date(Date.now() + 3600000)
      const mockTokens = {
        accessToken: vi.fn(() => 'tok'),
        refreshToken: vi.fn(() => 'ref'),
        accessTokenExpiresAt: vi.fn(() => expiry)
      }
      globalThis.mockArcticValidateAuthorizationCode.mockResolvedValue(
        mockTokens
      )

      const tokens = await exchangeCode('code')

      expect(typeof tokens.accessToken()).toBe('string')
      expect(typeof tokens.refreshToken()).toBe('string')
      expect(tokens.accessTokenExpiresAt()).toBe(expiry)
    })

    it('propagates errors thrown by Arctic', async () => {
      globalThis.mockArcticValidateAuthorizationCode.mockRejectedValue(
        new Error('invalid_grant')
      )

      await expect(exchangeCode('bad-code')).rejects.toThrow('invalid_grant')
    })
  })

  describe('refreshToken', () => {
    it('calls Arctic refreshAccessToken with the supplied token', async () => {
      const mockTokens = {
        accessToken: vi.fn(() => 'new-access'),
        refreshToken: vi.fn(() => 'new-refresh'),
        accessTokenExpiresAt: vi.fn(() => new Date(Date.now() + 3600000))
      }
      globalThis.mockArcticRefreshAccessToken.mockResolvedValue(mockTokens)

      const tokens = await refreshToken('old-refresh-token')

      expect(globalThis.mockArcticRefreshAccessToken).toHaveBeenCalledWith(
        'old-refresh-token'
      )
      expect(tokens.accessToken()).toBe('new-access')
      expect(tokens.refreshToken()).toBe('new-refresh')
    })

    it('returns tokens in AuthTokens shape', async () => {
      const expiry = new Date(Date.now() + 3600000)
      const mockTokens = {
        accessToken: vi.fn(() => 'a'),
        refreshToken: vi.fn(() => 'r'),
        accessTokenExpiresAt: vi.fn(() => expiry)
      }
      globalThis.mockArcticRefreshAccessToken.mockResolvedValue(mockTokens)

      const tokens = await refreshToken('rt')

      expect(typeof tokens.accessToken()).toBe('string')
      expect(tokens.accessTokenExpiresAt()).toBe(expiry)
    })

    it('propagates errors thrown by Arctic', async () => {
      globalThis.mockArcticRefreshAccessToken.mockRejectedValue(
        new Error('token_expired')
      )

      await expect(refreshToken('stale-token')).rejects.toThrow('token_expired')
    })
  })
})
