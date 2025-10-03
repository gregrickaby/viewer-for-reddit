import type {IronSession} from 'iron-session'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {SessionData} from './session'

// Mock iron-session
vi.mock('iron-session', () => ({
  getIronSession: vi.fn()
}))

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

describe('session', () => {
  let mockSession: Partial<IronSession<SessionData>>
  let mockCookies: unknown

  beforeEach(async () => {
    vi.resetModules()
    vi.useFakeTimers()

    // Mock session object with save and destroy methods
    mockSession = {
      save: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn()
    }

    // Mock cookies
    mockCookies = {}

    // Setup default mocks
    const {cookies} = await import('next/headers')
    const {getIronSession} = await import('iron-session')

    vi.mocked(cookies).mockResolvedValue(mockCookies as never)
    vi.mocked(getIronSession).mockResolvedValue(
      mockSession as IronSession<SessionData>
    )

    // Set required environment variables (re-stub after resetModules)
    vi.stubEnv('SESSION_SECRET', 'a'.repeat(32))
    vi.stubEnv('SESSION_DOMAIN', '')
    vi.stubEnv('AUTH_URL', 'http://localhost:3000')
  })

  afterEach(() => {
    vi.useRealTimers()
    // Don't unstub all envs - required config values need to persist
    vi.clearAllMocks()
  })

  describe('getSessionConfig validation', () => {
    it('should return null when SESSION_SECRET is not set', async () => {
      vi.unstubAllEnvs()
      vi.stubEnv('SESSION_SECRET', '')

      const {getSession} = await import('./session')
      const result = await getSession()

      // getSession catches errors and returns null
      expect(result).toBeNull()
    })

    it('should return null when SESSION_SECRET is too short', async () => {
      vi.stubEnv('SESSION_SECRET', 'short')

      const {getSession} = await import('./session')
      const result = await getSession()

      // getSession catches errors and returns null
      expect(result).toBeNull()
    })

    it('should accept SESSION_SECRET with exactly 32 characters', async () => {
      vi.stubEnv('SESSION_SECRET', 'a'.repeat(32))

      mockSession.username = 'testuser'
      mockSession.accessToken = 'token123'
      mockSession.refreshToken = 'refresh123'
      mockSession.expiresAt = Date.now() + 3600000

      const {getSession} = await import('./session')
      const result = await getSession()

      expect(result).not.toBeNull()
    })

    it('should use secure cookies in production', async () => {
      vi.stubEnv('NODE_ENV', 'production')

      mockSession.username = 'testuser'
      mockSession.accessToken = 'token'
      mockSession.refreshToken = 'refresh'
      mockSession.expiresAt = Date.now() + 3600000

      const {getSession} = await import('./session')
      await getSession()

      const {getIronSession} = await import('iron-session')
      expect(getIronSession).toHaveBeenCalledWith(
        mockCookies,
        expect.objectContaining({
          cookieOptions: expect.objectContaining({
            secure: true
          })
        })
      )
    })

    it('should not use secure cookies in development', async () => {
      vi.stubEnv('NODE_ENV', 'development')

      mockSession.username = 'testuser'
      mockSession.accessToken = 'token'
      mockSession.refreshToken = 'refresh'
      mockSession.expiresAt = Date.now() + 3600000

      const {getSession} = await import('./session')
      await getSession()

      const {getIronSession} = await import('iron-session')
      expect(getIronSession).toHaveBeenCalledWith(
        mockCookies,
        expect.objectContaining({
          cookieOptions: expect.objectContaining({
            secure: false
          })
        })
      )
    })
  })

  describe('getSession', () => {
    it('should return session data when valid', async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      mockSession.username = 'testuser'
      mockSession.accessToken = 'access_token_123'
      mockSession.refreshToken = 'refresh_token_456'
      mockSession.expiresAt = now + 3600000 // 1 hour from now
      mockSession.sessionVersion = 1
      mockSession.avatarUrl = 'https://example.com/avatar.jpg'

      const {getSession} = await import('./session')
      const result = await getSession()

      expect(result).toEqual({
        username: 'testuser',
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_456',
        expiresAt: now + 3600000,
        sessionVersion: 1,
        avatarUrl: 'https://example.com/avatar.jpg'
      })
    })

    it('should return null when username is missing', async () => {
      mockSession.username = undefined
      mockSession.accessToken = 'token'

      const {getSession} = await import('./session')
      const result = await getSession()

      expect(result).toBeNull()
    })

    it('should return null when accessToken is missing', async () => {
      mockSession.username = 'testuser'
      mockSession.accessToken = undefined

      const {getSession} = await import('./session')
      const result = await getSession()

      expect(result).toBeNull()
    })

    it('should return null when token is expired', async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      mockSession.username = 'testuser'
      mockSession.accessToken = 'token'
      mockSession.refreshToken = 'refresh'
      mockSession.expiresAt = now - 1000 // Expired 1 second ago

      const {getSession} = await import('./session')
      const result = await getSession()

      expect(result).toBeNull()
    })

    it('should return null when token expires within 5 minute buffer', async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      mockSession.username = 'testuser'
      mockSession.accessToken = 'token'
      mockSession.refreshToken = 'refresh'
      mockSession.expiresAt = now + 4 * 60 * 1000 // Expires in 4 minutes

      const {getSession} = await import('./session')
      const result = await getSession()

      expect(result).toBeNull()
    })

    it('should return session when token expires after 5 minute buffer', async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      mockSession.username = 'testuser'
      mockSession.accessToken = 'token'
      mockSession.refreshToken = 'refresh'
      mockSession.expiresAt = now + 6 * 60 * 1000 // Expires in 6 minutes

      const {getSession} = await import('./session')
      const result = await getSession()

      expect(result).not.toBeNull()
      expect(result?.username).toBe('testuser')
    })

    it('should default sessionVersion to 1 if not set', async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      mockSession.username = 'testuser'
      mockSession.accessToken = 'token'
      mockSession.refreshToken = 'refresh'
      mockSession.expiresAt = now + 3600000
      mockSession.sessionVersion = undefined

      const {getSession} = await import('./session')
      const result = await getSession()

      expect(result?.sessionVersion).toBe(1)
    })

    it('should return null on error', async () => {
      const {getIronSession} = await import('iron-session')
      vi.mocked(getIronSession).mockRejectedValueOnce(
        new Error('Session error')
      )

      const {getSession} = await import('./session')
      const result = await getSession()

      expect(result).toBeNull()
    })

    it('should handle missing expiresAt field', async () => {
      mockSession.username = 'testuser'
      mockSession.accessToken = 'token'
      mockSession.refreshToken = 'refresh'
      mockSession.expiresAt = undefined

      const {getSession} = await import('./session')
      const result = await getSession()

      expect(result).not.toBeNull()
    })
  })

  describe('getClientSession', () => {
    it('should return client-safe session data', async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      mockSession.username = 'testuser'
      mockSession.accessToken = 'token'
      mockSession.refreshToken = 'refresh'
      mockSession.expiresAt = now + 3600000
      mockSession.avatarUrl = 'https://example.com/avatar.jpg'

      const {getClientSession} = await import('./session')
      const result = await getClientSession()

      expect(result).toEqual({
        username: 'testuser',
        expiresAt: now + 3600000,
        isAuthenticated: true,
        avatarUrl: 'https://example.com/avatar.jpg'
      })
    })

    it('should not include tokens in client session', async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      mockSession.username = 'testuser'
      mockSession.accessToken = 'secret_token'
      mockSession.refreshToken = 'secret_refresh'
      mockSession.expiresAt = now + 3600000

      const {getClientSession} = await import('./session')
      const result = await getClientSession()

      expect(result).not.toHaveProperty('accessToken')
      expect(result).not.toHaveProperty('refreshToken')
    })

    it('should return null when no session exists', async () => {
      mockSession.username = undefined
      mockSession.accessToken = undefined

      const {getClientSession} = await import('./session')
      const result = await getClientSession()

      expect(result).toBeNull()
    })

    it('should return null when session is expired', async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      mockSession.username = 'testuser'
      mockSession.accessToken = 'token'
      mockSession.refreshToken = 'refresh'
      mockSession.expiresAt = now - 1000

      const {getClientSession} = await import('./session')
      const result = await getClientSession()

      expect(result).toBeNull()
    })
  })

  describe('setSession', () => {
    it('should save session data', async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      const {setSession} = await import('./session')
      await setSession({
        username: 'newuser',
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        expiresAt: now + 3600000,
        avatarUrl: 'https://example.com/new-avatar.jpg'
      })

      expect(mockSession.username).toBe('newuser')
      expect(mockSession.accessToken).toBe('new_access_token')
      expect(mockSession.refreshToken).toBe('new_refresh_token')
      expect(mockSession.expiresAt).toBe(now + 3600000)
      expect(mockSession.sessionVersion).toBe(now)
      expect(mockSession.avatarUrl).toBe('https://example.com/new-avatar.jpg')
      expect(mockSession.save).toHaveBeenCalled()
    })

    it('should set sessionVersion to current timestamp', async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      const {setSession} = await import('./session')
      await setSession({
        username: 'user',
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: now + 3600000
      })

      expect(mockSession.sessionVersion).toBe(now)
    })

    it('should handle optional avatarUrl', async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      const {setSession} = await import('./session')
      await setSession({
        username: 'user',
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: now + 3600000
      })

      expect(mockSession.username).toBe('user')
      expect(mockSession.avatarUrl).toBeUndefined()
    })
  })

  describe('updateSessionTokens', () => {
    it('should update access token and expiresAt', async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      mockSession.username = 'existinguser'
      mockSession.accessToken = 'old_token'
      mockSession.refreshToken = 'old_refresh'

      const {updateSessionTokens} = await import('./session')
      await updateSessionTokens({
        accessToken: 'new_access_token',
        expiresAt: now + 7200000
      })

      expect(mockSession.accessToken).toBe('new_access_token')
      expect(mockSession.expiresAt).toBe(now + 7200000)
      expect(mockSession.save).toHaveBeenCalled()
    })

    it('should update refresh token when provided', async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      mockSession.username = 'existinguser'
      mockSession.accessToken = 'old_token'
      mockSession.refreshToken = 'old_refresh'

      const {updateSessionTokens} = await import('./session')
      await updateSessionTokens({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        expiresAt: now + 7200000
      })

      expect(mockSession.refreshToken).toBe('new_refresh_token')
    })

    it('should not update refresh token when not provided', async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      mockSession.username = 'existinguser'
      mockSession.accessToken = 'old_token'
      mockSession.refreshToken = 'old_refresh'

      const {updateSessionTokens} = await import('./session')
      await updateSessionTokens({
        accessToken: 'new_access_token',
        expiresAt: now + 7200000
      })

      expect(mockSession.refreshToken).toBe('old_refresh')
    })

    it('should throw error when no active session exists', async () => {
      mockSession.username = undefined

      const {updateSessionTokens} = await import('./session')

      await expect(
        updateSessionTokens({
          accessToken: 'token',
          expiresAt: Date.now()
        })
      ).rejects.toThrow('No active session to update')
    })

    it('should preserve username when updating tokens', async () => {
      mockSession.username = 'preserveduser'
      mockSession.accessToken = 'old_token'

      const {updateSessionTokens} = await import('./session')
      await updateSessionTokens({
        accessToken: 'new_token',
        expiresAt: Date.now() + 3600000
      })

      expect(mockSession.username).toBe('preserveduser')
    })
  })

  describe('deleteSession', () => {
    it('should destroy the session', async () => {
      const {deleteSession} = await import('./session')
      await deleteSession()

      expect(mockSession.destroy).toHaveBeenCalled()
    })

    it('should call destroy on iron-session instance', async () => {
      mockSession.username = 'testuser'
      mockSession.accessToken = 'token'

      const {deleteSession} = await import('./session')
      await deleteSession()

      expect(mockSession.destroy).toHaveBeenCalledTimes(1)
    })
  })

  describe('invalidateAllSessions', () => {
    it('should delete the current session', async () => {
      const {invalidateAllSessions} = await import('./session')
      await invalidateAllSessions()

      expect(mockSession.destroy).toHaveBeenCalled()
    })

    it('should call destroy on iron-session instance', async () => {
      mockSession.username = 'testuser'
      mockSession.accessToken = 'token'

      const {invalidateAllSessions} = await import('./session')
      await invalidateAllSessions()

      expect(mockSession.destroy).toHaveBeenCalledTimes(1)
    })
  })

  describe('session configuration', () => {
    it('should use correct cookie name', async () => {
      mockSession.username = 'testuser'
      mockSession.accessToken = 'token'
      mockSession.refreshToken = 'refresh'
      mockSession.expiresAt = Date.now() + 3600000

      const {getSession} = await import('./session')
      await getSession()

      const {getIronSession} = await import('iron-session')
      expect(getIronSession).toHaveBeenCalledWith(
        mockCookies,
        expect.objectContaining({
          cookieName: 'reddit_session'
        })
      )
    })

    it('should set httpOnly to true', async () => {
      mockSession.username = 'testuser'
      mockSession.accessToken = 'token'
      mockSession.refreshToken = 'refresh'
      mockSession.expiresAt = Date.now() + 3600000

      const {getSession} = await import('./session')
      await getSession()

      const {getIronSession} = await import('iron-session')
      expect(getIronSession).toHaveBeenCalledWith(
        mockCookies,
        expect.objectContaining({
          cookieOptions: expect.objectContaining({
            httpOnly: true
          })
        })
      )
    })

    it('should set sameSite to lax', async () => {
      mockSession.username = 'testuser'
      mockSession.accessToken = 'token'
      mockSession.refreshToken = 'refresh'
      mockSession.expiresAt = Date.now() + 3600000

      const {getSession} = await import('./session')
      await getSession()

      const {getIronSession} = await import('iron-session')
      expect(getIronSession).toHaveBeenCalledWith(
        mockCookies,
        expect.objectContaining({
          cookieOptions: expect.objectContaining({
            sameSite: 'lax'
          })
        })
      )
    })

    it('should set maxAge to 14 days', async () => {
      mockSession.username = 'testuser'
      mockSession.accessToken = 'token'
      mockSession.refreshToken = 'refresh'
      mockSession.expiresAt = Date.now() + 3600000

      const {getSession} = await import('./session')
      await getSession()

      const {getIronSession} = await import('iron-session')
      expect(getIronSession).toHaveBeenCalledWith(
        mockCookies,
        expect.objectContaining({
          cookieOptions: expect.objectContaining({
            maxAge: 14 * 24 * 60 * 60
          })
        })
      )
    })

    it('should set path to /', async () => {
      mockSession.username = 'testuser'
      mockSession.accessToken = 'token'
      mockSession.refreshToken = 'refresh'
      mockSession.expiresAt = Date.now() + 3600000

      const {getSession} = await import('./session')
      await getSession()

      const {getIronSession} = await import('iron-session')
      expect(getIronSession).toHaveBeenCalledWith(
        mockCookies,
        expect.objectContaining({
          cookieOptions: expect.objectContaining({
            path: '/'
          })
        })
      )
    })
  })

  describe('edge cases', () => {
    it('should handle empty username string', async () => {
      mockSession.username = ''
      mockSession.accessToken = 'token'

      const {getSession} = await import('./session')
      const result = await getSession()

      expect(result).toBeNull()
    })

    it('should handle empty accessToken string', async () => {
      mockSession.username = 'testuser'
      mockSession.accessToken = ''

      const {getSession} = await import('./session')
      const result = await getSession()

      expect(result).toBeNull()
    })

    it('should handle exact 5 minute buffer boundary', async () => {
      const now = Date.now()
      vi.setSystemTime(now)

      mockSession.username = 'testuser'
      mockSession.accessToken = 'token'
      mockSession.refreshToken = 'refresh'
      mockSession.expiresAt = now + 5 * 60 * 1000 // Exactly 5 minutes

      const {getSession} = await import('./session')
      const result = await getSession()

      // The check is "expiresAt - bufferMs < now", which means:
      // (now + 5 minutes) - 5 minutes = now, and now < now is false
      // So this should NOT be null
      expect(result).not.toBeNull()
    })
  })
})
