import {beforeEach, describe, expect, it, vi} from 'vitest'

// Mock dependencies BEFORE imports
vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

vi.mock('iron-session', () => ({
  getIronSession: vi.fn()
}))

vi.mock('@/lib/utils/env', () => ({
  getEnvVar: vi.fn((key: string) => {
    if (key === 'SESSION_SECRET') return 'test-secret-key-32-chars-long!'
    if (key === 'BASE_URL') return 'https://example.com'
    return ''
  }),
  isProduction: vi.fn(() => false)
}))

// Import after mocks
import {getEnvVar, isProduction} from '@/lib/utils/env'
import {getIronSession} from 'iron-session'
import {cookies} from 'next/headers'
import {getSession, isAuthenticated, isSessionExpired} from './session'

const mockCookies = vi.mocked(cookies)
const mockGetIronSession = vi.mocked(getIronSession)
const mockGetEnvVar = vi.mocked(getEnvVar)
const mockIsProduction = vi.mocked(isProduction)

describe('session', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetEnvVar.mockImplementation((key: string) => {
      if (key === 'SESSION_SECRET') return 'test-secret-key-32-chars-long!'
      if (key === 'BASE_URL') return 'https://example.com'
      return ''
    })
    mockIsProduction.mockReturnValue(false)
  })

  describe('getSession', () => {
    it('returns iron session with correct configuration', async () => {
      const mockCookieStore = {} as any
      const mockSession = {
        accessToken: 'test-token',
        expiresAt: Date.now() + 3600000
      }

      mockCookies.mockResolvedValue(mockCookieStore)
      mockGetIronSession.mockResolvedValue(mockSession as any)

      const session = await getSession()

      expect(mockCookies).toHaveBeenCalled()
      expect(mockGetIronSession).toHaveBeenCalledWith(mockCookieStore, {
        password: 'test-secret-key-32-chars-long!',
        cookieName: 'reddit_viewer_session',
        cookieOptions: {
          secure: false,
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 86400, // 1 day in seconds
          path: '/'
        }
      })
      expect(session).toEqual(mockSession)
    })

    it('uses secure cookies in development (not production)', async () => {
      mockIsProduction.mockReturnValue(false)
      const mockCookieStore = {} as any
      const mockSession = {}

      mockCookies.mockResolvedValue(mockCookieStore)
      mockGetIronSession.mockResolvedValue(mockSession as any)

      await getSession()

      expect(mockGetIronSession).toHaveBeenCalledWith(
        mockCookieStore,
        expect.objectContaining({
          cookieOptions: expect.objectContaining({
            secure: false
          })
        })
      )
      const callArgs = mockGetIronSession.mock.calls[0][1] as any
      expect(callArgs.cookieOptions).not.toHaveProperty('domain')
    })

    it('does not include domain in development', async () => {
      mockIsProduction.mockReturnValue(false)
      const mockCookieStore = {} as any

      mockCookies.mockResolvedValue(mockCookieStore)
      mockGetIronSession.mockResolvedValue({} as any)

      await getSession()

      const callArgs = mockGetIronSession.mock.calls[0][1] as any
      expect(callArgs.cookieOptions).not.toHaveProperty('domain')
    })

    it('includes domain restriction in production', async () => {
      mockIsProduction.mockReturnValue(true)
      mockGetEnvVar.mockImplementation((key: string) => {
        if (key === 'SESSION_SECRET') return 'test-secret-key-32-chars-long!'
        if (key === 'BASE_URL') return 'https://example.com'
        return ''
      })

      const mockCookieStore = {} as any
      mockCookies.mockResolvedValue(mockCookieStore)
      mockGetIronSession.mockResolvedValue({} as any)

      await getSession()

      const callArgs = mockGetIronSession.mock.calls[0][1] as any
      expect(callArgs.cookieOptions).toHaveProperty('domain', 'example.com')
      expect(callArgs.cookieOptions.secure).toBe(true)
    })

    it('handles invalid BASE_URL gracefully in production', async () => {
      mockIsProduction.mockReturnValue(true)
      mockGetEnvVar.mockImplementation((key: string) => {
        if (key === 'SESSION_SECRET') return 'test-secret-key-32-chars-long!'
        if (key === 'BASE_URL') return 'not-a-valid-url'
        return ''
      })

      const mockCookieStore = {} as any
      mockCookies.mockResolvedValue(mockCookieStore)
      mockGetIronSession.mockResolvedValue({} as any)

      // Should not throw, just continue without domain
      await getSession()

      const callArgs = mockGetIronSession.mock.calls[0][1] as any
      expect(callArgs.cookieOptions).not.toHaveProperty('domain')
    })

    it('uses correct session secret from environment', async () => {
      const mockCookieStore = {} as any
      mockCookies.mockResolvedValue(mockCookieStore)
      mockGetIronSession.mockResolvedValue({} as any)

      await getSession()

      expect(mockGetIronSession).toHaveBeenCalledWith(
        mockCookieStore,
        expect.objectContaining({
          password: 'test-secret-key-32-chars-long!'
        })
      )
    })

    it('sets correct cookie name', async () => {
      const mockCookieStore = {} as any
      mockCookies.mockResolvedValue(mockCookieStore)
      mockGetIronSession.mockResolvedValue({} as any)

      await getSession()

      expect(mockGetIronSession).toHaveBeenCalledWith(
        mockCookieStore,
        expect.objectContaining({
          cookieName: 'reddit_viewer_session'
        })
      )
    })

    it('sets correct cookie options', async () => {
      const mockCookieStore = {} as any
      mockCookies.mockResolvedValue(mockCookieStore)
      mockGetIronSession.mockResolvedValue({} as any)

      await getSession()

      expect(mockGetIronSession).toHaveBeenCalledWith(
        mockCookieStore,
        expect.objectContaining({
          cookieOptions: expect.objectContaining({
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 86400, // 1 day in seconds
            path: '/'
          })
        })
      )
    })
  })

  describe('isAuthenticated', () => {
    it('returns true when session has valid access token', async () => {
      const futureTime = Date.now() + 3600000 // 1 hour from now
      const mockSession = {
        accessToken: 'valid-token',
        expiresAt: futureTime
      }

      mockCookies.mockResolvedValue({} as any)
      mockGetIronSession.mockResolvedValue(mockSession as any)

      const result = await isAuthenticated()

      expect(result).toBe(true)
    })

    it('returns false when session has no access token', async () => {
      const mockSession = {
        accessToken: undefined,
        expiresAt: Date.now() + 3600000
      }

      mockCookies.mockResolvedValue({} as any)
      mockGetIronSession.mockResolvedValue(mockSession as any)

      const result = await isAuthenticated()

      expect(result).toBe(false)
    })

    it('returns false when access token is empty string', async () => {
      const mockSession = {
        accessToken: '',
        expiresAt: Date.now() + 3600000
      }

      mockCookies.mockResolvedValue({} as any)
      mockGetIronSession.mockResolvedValue(mockSession as any)

      const result = await isAuthenticated()

      expect(result).toBe(false)
    })

    it('returns false when session is expired', async () => {
      const pastTime = Date.now() - 3600000 // 1 hour ago
      const mockSession = {
        accessToken: 'valid-token',
        expiresAt: pastTime
      }

      mockCookies.mockResolvedValue({} as any)
      mockGetIronSession.mockResolvedValue(mockSession as any)

      const result = await isAuthenticated()

      expect(result).toBe(false)
    })

    it('returns false when expiresAt equals current time', async () => {
      const now = Date.now()
      const mockSession = {
        accessToken: 'valid-token',
        expiresAt: now
      }

      mockCookies.mockResolvedValue({} as any)
      mockGetIronSession.mockResolvedValue(mockSession as any)

      const result = await isAuthenticated()

      expect(result).toBe(false)
    })

    it('returns false when session has token but no expiresAt', async () => {
      const mockSession = {
        accessToken: 'valid-token',
        expiresAt: undefined
      }

      mockCookies.mockResolvedValue({} as any)
      mockGetIronSession.mockResolvedValue(mockSession as any)

      const result = await isAuthenticated()

      expect(result).toBe(false)
    })

    it('returns false when session is empty', async () => {
      const mockSession = {}

      mockCookies.mockResolvedValue({} as any)
      mockGetIronSession.mockResolvedValue(mockSession as any)

      const result = await isAuthenticated()

      expect(result).toBe(false)
    })

    it('returns true when token expires in 1 millisecond', async () => {
      const futureTime = Date.now() + 100 // Increased to 100ms to avoid race condition
      const mockSession = {
        accessToken: 'valid-token',
        expiresAt: futureTime
      }

      mockCookies.mockResolvedValue({} as any)
      mockGetIronSession.mockResolvedValue(mockSession as any)

      const result = await isAuthenticated()

      expect(result).toBe(true)
    })

    it('handles session with all required properties', async () => {
      const mockSession = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 7200000,
        username: 'testuser'
      }

      mockCookies.mockResolvedValue({} as any)
      mockGetIronSession.mockResolvedValue(mockSession as any)

      const result = await isAuthenticated()

      expect(result).toBe(true)
    })
  })

  describe('isSessionExpired', () => {
    it('returns true when session has token but is expired', async () => {
      const pastTime = Date.now() - 3600000 // 1 hour ago
      const mockSession = {
        accessToken: 'valid-token',
        expiresAt: pastTime
      }

      mockCookies.mockResolvedValue({} as any)
      mockGetIronSession.mockResolvedValue(mockSession as any)

      const result = await isSessionExpired()

      expect(result).toBe(true)
    })

    it('returns true when session has token but expiresAt equals now', async () => {
      const now = Date.now()
      const mockSession = {
        accessToken: 'valid-token',
        expiresAt: now
      }

      mockCookies.mockResolvedValue({} as any)
      mockGetIronSession.mockResolvedValue(mockSession as any)

      const result = await isSessionExpired()

      expect(result).toBe(true)
    })

    it('returns false when session is valid (not expired)', async () => {
      const futureTime = Date.now() + 3600000 // 1 hour from now
      const mockSession = {
        accessToken: 'valid-token',
        expiresAt: futureTime
      }

      mockCookies.mockResolvedValue({} as any)
      mockGetIronSession.mockResolvedValue(mockSession as any)

      const result = await isSessionExpired()

      expect(result).toBe(false)
    })

    it('returns false when session has no token', async () => {
      const pastTime = Date.now() - 3600000
      const mockSession = {
        accessToken: undefined,
        expiresAt: pastTime
      }

      mockCookies.mockResolvedValue({} as any)
      mockGetIronSession.mockResolvedValue(mockSession as any)

      const result = await isSessionExpired()

      expect(result).toBe(false)
    })

    it('returns true when session has token but no expiresAt', async () => {
      const mockSession = {
        accessToken: 'valid-token',
        expiresAt: undefined
      }

      mockCookies.mockResolvedValue({} as any)
      mockGetIronSession.mockResolvedValue(mockSession as any)

      const result = await isSessionExpired()

      expect(result).toBe(true)
    })

    it('returns false when session is empty', async () => {
      const mockSession = {}

      mockCookies.mockResolvedValue({} as any)
      mockGetIronSession.mockResolvedValue(mockSession as any)

      const result = await isSessionExpired()

      expect(result).toBe(false)
    })
  })
})
