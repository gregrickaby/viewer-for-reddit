import {beforeEach, describe, expect, it, vi} from 'vitest'
import {clearExpiredSession, getAuthStatus, logout} from './auth'

// Mock dependencies BEFORE imports
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
  isSessionExpired: vi.fn()
}))

vi.mock('@/lib/utils/env', () => ({
  getEnvVar: vi.fn((key: string) => {
    if (key === 'REDDIT_CLIENT_ID') return 'test-client-id'
    if (key === 'REDDIT_CLIENT_SECRET') return 'test-client-secret'
    if (key === 'REDDIT_REDIRECT_URI')
      return 'http://localhost:3000/api/auth/callback/reddit'
    return 'test-value'
  })
}))

vi.mock('arctic', () => ({
  Reddit: vi.fn(function (this: any) {
    this.refreshAccessToken = vi.fn()
    return this
  })
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

// Import mocked modules
const {getSession, isSessionExpired} = await import('@/lib/auth/session')
const {logger} = await import('@/lib/utils/logger')

const mockGetSession = vi.mocked(getSession)
const mockIsSessionExpired = vi.mocked(isSessionExpired)
const mockLogger = vi.mocked(logger)

describe('auth actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('logout', () => {
    it('successfully destroys session and logs out user', async () => {
      const mockDestroy = vi.fn()
      mockGetSession.mockResolvedValue({
        destroy: mockDestroy
      } as any)

      const result = await logout()

      expect(mockDestroy).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledWith(
        'User logged out successfully'
      )
      expect(result).toEqual({success: true})
    })

    it('returns error when session destruction fails', async () => {
      const mockDestroy = vi.fn().mockImplementation(() => {
        throw new Error('Session destroy failed')
      })
      mockGetSession.mockResolvedValue({
        destroy: mockDestroy
      } as any)

      const result = await logout()

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Logout failed',
        expect.any(Error),
        {context: 'logout'}
      )
      expect(result).toEqual({
        success: false,
        error: 'Failed to logout. Please try again.'
      })
    })

    it('handles error when getSession fails', async () => {
      mockGetSession.mockRejectedValue(new Error('Session access failed'))

      const result = await logout()

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Logout failed',
        expect.any(Error),
        {context: 'logout'}
      )
      expect(result).toEqual({
        success: false,
        error: 'Failed to logout. Please try again.'
      })
    })
  })

  describe('getAuthStatus', () => {
    it('returns authenticated status when session is valid', async () => {
      const futureTimestamp = Date.now() + 3600000 // 1 hour from now
      mockGetSession.mockResolvedValue({
        accessToken: 'valid_token',
        expiresAt: futureTimestamp,
        username: 'testuser'
      } as any)

      const result = await getAuthStatus()

      expect(result).toEqual({
        isAuthenticated: true,
        username: 'testuser'
      })
    })

    it('returns unauthenticated when access token is missing', async () => {
      const futureTimestamp = Date.now() + 3600000
      mockGetSession.mockResolvedValue({
        accessToken: undefined,
        expiresAt: futureTimestamp,
        username: 'testuser'
      } as any)

      const result = await getAuthStatus()

      expect(result).toEqual({
        isAuthenticated: false,
        username: 'testuser'
      })
    })

    it('returns unauthenticated when expiresAt is missing', async () => {
      mockGetSession.mockResolvedValue({
        accessToken: 'valid_token',
        expiresAt: undefined,
        username: 'testuser'
      } as any)

      const result = await getAuthStatus()

      expect(result).toEqual({
        isAuthenticated: false,
        username: 'testuser'
      })
    })

    it('returns unauthenticated when session is expired', async () => {
      const pastTimestamp = Date.now() - 3600000 // 1 hour ago
      mockGetSession.mockResolvedValue({
        accessToken: 'expired_token',
        expiresAt: pastTimestamp,
        username: 'testuser'
      } as any)

      const result = await getAuthStatus()

      expect(result).toEqual({
        isAuthenticated: false,
        username: 'testuser'
      })
    })

    it('returns unauthenticated with no username when session is empty', async () => {
      mockGetSession.mockResolvedValue({
        accessToken: undefined,
        expiresAt: undefined,
        username: undefined
      } as any)

      const result = await getAuthStatus()

      expect(result).toEqual({
        isAuthenticated: false,
        username: undefined
      })
    })

    it('validates authentication status at exact expiration boundary', async () => {
      const currentTimestamp = Date.now()
      mockGetSession.mockResolvedValue({
        accessToken: 'valid_token',
        expiresAt: currentTimestamp,
        username: 'testuser'
      } as any)

      const result = await getAuthStatus()

      // At exact expiration time, token is considered expired
      expect(result).toEqual({
        isAuthenticated: false,
        username: 'testuser'
      })
    })

    it('returns authenticated when expiration is one millisecond in future', async () => {
      const futureTimestamp = Date.now() + 1
      mockGetSession.mockResolvedValue({
        accessToken: 'valid_token',
        expiresAt: futureTimestamp,
        username: 'testuser'
      } as any)

      const result = await getAuthStatus()

      expect(result).toEqual({
        isAuthenticated: true,
        username: 'testuser'
      })
    })

    it('handles null values in session', async () => {
      mockGetSession.mockResolvedValue({
        accessToken: null,
        expiresAt: null,
        username: null
      } as any)

      const result = await getAuthStatus()

      expect(result).toEqual({
        isAuthenticated: false,
        username: null
      })
    })

    describe('clearExpiredSession', () => {
      it('destroys session when it is expired', async () => {
        const mockDestroy = vi.fn()
        mockIsSessionExpired.mockResolvedValue(true)
        mockGetSession.mockResolvedValue({
          destroy: mockDestroy
        } as any)

        const result = await clearExpiredSession()

        expect(mockIsSessionExpired).toHaveBeenCalledTimes(1)
        expect(mockDestroy).toHaveBeenCalledTimes(1)
        expect(mockLogger.info).toHaveBeenCalledWith('Expired session cleared')
        expect(result).toEqual({success: true, wasExpired: true})
      })

      it('does not destroy session when it is not expired', async () => {
        const mockDestroy = vi.fn()
        mockIsSessionExpired.mockResolvedValue(false)
        mockGetSession.mockResolvedValue({
          destroy: mockDestroy
        } as any)

        const result = await clearExpiredSession()

        expect(mockIsSessionExpired).toHaveBeenCalledTimes(1)
        expect(mockDestroy).not.toHaveBeenCalled()
        expect(mockLogger.info).not.toHaveBeenCalled()
        expect(result).toEqual({success: true, wasExpired: false})
      })

      it('handles errors when checking session expiry', async () => {
        mockIsSessionExpired.mockRejectedValue(new Error('Check failed'))

        const result = await clearExpiredSession()

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to clear expired session',
          expect.any(Error),
          {context: 'clearExpiredSession'}
        )
        expect(result).toEqual({success: false, wasExpired: false})
      })

      it('handles errors when destroying session', async () => {
        const mockDestroy = vi.fn().mockImplementation(() => {
          throw new Error('Destroy failed')
        })
        mockIsSessionExpired.mockResolvedValue(true)
        mockGetSession.mockResolvedValue({
          destroy: mockDestroy
        } as any)

        const result = await clearExpiredSession()

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to clear expired session',
          expect.any(Error),
          {context: 'clearExpiredSession'}
        )
        expect(result).toEqual({success: false, wasExpired: false})
      })
    })
  })

  describe('refreshAccessToken', () => {
    it('successfully refreshes access token', async () => {
      const mockSave = vi.fn()
      const mockDestroy = vi.fn()
      const mockTokens = {
        accessToken: vi.fn(() => 'new-access-token'),
        refreshToken: vi.fn(() => 'new-refresh-token'),
        accessTokenExpiresAt: vi.fn(() => new Date(Date.now() + 3600000))
      }

      mockGetSession.mockResolvedValue({
        refreshToken: 'old-refresh-token',
        save: mockSave,
        destroy: mockDestroy
      } as any)

      // Mock Arctic refresh to succeed
      const {Reddit} = await import('arctic')
      const redditInstance = new (Reddit as any)()
      redditInstance.refreshAccessToken = vi.fn().mockResolvedValue(mockTokens)

      const {refreshAccessToken} = await import('./auth')
      const result = await refreshAccessToken()

      expect(mockSave).toHaveBeenCalled()
      expect(result).toEqual({success: true})
    })

    it('returns error when no refresh token available', async () => {
      const mockDestroy = vi.fn()
      mockGetSession.mockResolvedValue({
        refreshToken: '',
        destroy: mockDestroy
      } as any)

      const {refreshAccessToken} = await import('./auth')
      const result = await refreshAccessToken()

      expect(result).toEqual({
        success: false,
        error: 'No refresh token available'
      })
    })
  })

  describe('getValidAccessToken', () => {
    it('returns existing token if not expired', async () => {
      const futureTime = Date.now() + 600000 // 10 minutes from now
      mockGetSession.mockResolvedValue({
        accessToken: 'valid-token',
        expiresAt: futureTime
      } as any)

      const {getValidAccessToken} = await import('./auth')
      const token = await getValidAccessToken()

      expect(token).toBe('valid-token')
    })

    it('refreshes token when expiring soon', async () => {
      const soonTime = Date.now() + 60000 // 1 minute from now (within 5 min threshold)
      const mockSave = vi.fn()
      const mockDestroy = vi.fn()

      // First call: token expiring soon
      mockGetSession.mockResolvedValueOnce({
        accessToken: 'expiring-token',
        expiresAt: soonTime,
        refreshToken: 'refresh-token',
        save: mockSave,
        destroy: mockDestroy
      } as any)

      // Second call: after refresh
      mockGetSession.mockResolvedValueOnce({
        accessToken: 'new-token',
        expiresAt: Date.now() + 3600000
      } as any)

      const {getValidAccessToken} = await import('./auth')
      const token = await getValidAccessToken()

      expect(mockSave).toHaveBeenCalled()
      expect(token).toBe('new-token')
    })

    it('returns null when no access token', async () => {
      mockGetSession.mockResolvedValue({
        accessToken: ''
      } as any)

      const {getValidAccessToken} = await import('./auth')
      const token = await getValidAccessToken()

      expect(token).toBeNull()
    })
  })
})
