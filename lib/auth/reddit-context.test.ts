/**
 * Tests for the Reddit auth context module (ports-and-adapters).
 *
 * Uses {@link configureRedditContext} to inject stub adapters,
 * avoiding any vi.mock() path-string fragility.
 */

// Mock the Axiom logger to avoid side-effects
vi.mock('@/lib/axiom/server', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

import type {AuthTokens} from '@/lib/types/auth'
import type {SessionData} from '@/lib/types/reddit'
import {TOKEN_REFRESH_BUFFER} from '@/lib/utils/constants'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {
  type RedditContextAdapters,
  type SessionSnapshot,
  configureRedditContext,
  contextFromToken,
  getAnonymousContext,
  getRedditContext,
  resetRedditContext
} from './reddit-context'

// ---------------------------------------------------------------------------
// Stub adapter factory
// ---------------------------------------------------------------------------

function emptySnapshot(): SessionSnapshot {
  return {
    accessToken: undefined,
    refreshToken: undefined,
    expiresAt: undefined,
    username: undefined,
    userId: undefined
  }
}

function authenticatedSnapshot(
  overrides: Partial<SessionSnapshot> = {}
): SessionSnapshot {
  return {
    accessToken: 'valid-access-token',
    refreshToken: 'valid-refresh-token',
    expiresAt: Date.now() + 3600000, // 1 hour from now
    username: 'testuser',
    userId: 't2_abc123',
    ...overrides
  }
}

function createMockTokens(
  overrides: Partial<{
    accessToken: string
    refreshToken: string | undefined
    expiresAt: Date
  }> = {}
): AuthTokens {
  return {
    accessToken: () => overrides.accessToken ?? 'refreshed-access-token',
    refreshToken: () => overrides.refreshToken ?? 'refreshed-refresh-token',
    accessTokenExpiresAt: () =>
      overrides.expiresAt ?? new Date(Date.now() + 3600000)
  }
}

function createStubAdapters(
  overrides: Partial<RedditContextAdapters> = {}
): RedditContextAdapters {
  return {
    readSession: vi.fn(async () => emptySnapshot()),
    writeSession: vi.fn(async () => {}),
    refreshAccessToken: vi.fn(async () => createMockTokens()),
    now: () => Date.now(),
    ...overrides
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('reddit-context', () => {
  afterEach(() => {
    resetRedditContext()
  })

  // -------------------------------------------------------------------------
  // getAnonymousContext
  // -------------------------------------------------------------------------

  describe('getAnonymousContext', () => {
    it('returns unauthenticated context with public base URL', () => {
      const ctx = getAnonymousContext()

      expect(ctx.isAuthenticated).toBe(false)
      expect(ctx.username).toBeNull()
      expect(ctx.baseUrl).toBe('https://www.reddit.com')
      expect(ctx.headers).toEqual({
        'User-Agent': 'test-user-agent'
      })
    })
  })

  // -------------------------------------------------------------------------
  // contextFromToken
  // -------------------------------------------------------------------------

  describe('contextFromToken', () => {
    it('returns authenticated context with null username', () => {
      const ctx = contextFromToken('some-token')

      expect(ctx.isAuthenticated).toBe(true)
      expect(ctx.username).toBeNull()
      expect(ctx.baseUrl).toBe('https://oauth.reddit.com')
      expect(ctx.headers).toEqual({
        'User-Agent': 'test-user-agent',
        Authorization: 'Bearer some-token'
      })
    })
  })

  // -------------------------------------------------------------------------
  // getRedditContext — anonymous
  // -------------------------------------------------------------------------

  describe('getRedditContext — anonymous', () => {
    it('returns anonymous context when session has no access token', async () => {
      const adapters = createStubAdapters()
      configureRedditContext(adapters)

      const ctx = await getRedditContext()

      expect(ctx.isAuthenticated).toBe(false)
      expect(ctx.baseUrl).toBe('https://www.reddit.com')
      expect(adapters.readSession).toHaveBeenCalledOnce()
    })
  })

  // -------------------------------------------------------------------------
  // getRedditContext — authenticated, token still valid
  // -------------------------------------------------------------------------

  describe('getRedditContext — valid token', () => {
    it('returns authenticated context without refreshing', async () => {
      const now = Date.now()
      const adapters = createStubAdapters({
        readSession: vi.fn(async () =>
          authenticatedSnapshot({
            expiresAt: now + TOKEN_REFRESH_BUFFER + 60000 // well beyond buffer
          })
        ),
        now: () => now
      })
      configureRedditContext(adapters)

      const ctx = await getRedditContext()

      expect(ctx.isAuthenticated).toBe(true)
      expect(ctx.username).toBe('testuser')
      expect(ctx.baseUrl).toBe('https://oauth.reddit.com')
      expect(ctx.headers).toEqual({
        'User-Agent': 'test-user-agent',
        Authorization: 'Bearer valid-access-token'
      })
      // Should NOT have attempted a refresh
      expect(adapters.refreshAccessToken).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // getRedditContext — expired token, refresh succeeds
  // -------------------------------------------------------------------------

  describe('getRedditContext — refresh succeeds', () => {
    it('refreshes and returns new authenticated context', async () => {
      const now = Date.now()
      const adapters = createStubAdapters({
        readSession: vi.fn(async () =>
          authenticatedSnapshot({
            expiresAt: now - 1000 // already expired
          })
        ),
        refreshAccessToken: vi.fn(async () => createMockTokens()),
        now: () => now
      })
      configureRedditContext(adapters)

      const ctx = await getRedditContext()

      expect(ctx.isAuthenticated).toBe(true)
      expect(ctx.headers).toEqual({
        'User-Agent': 'test-user-agent',
        Authorization: 'Bearer refreshed-access-token'
      })
      expect(adapters.refreshAccessToken).toHaveBeenCalledWith(
        'valid-refresh-token'
      )
      expect(adapters.writeSession).toHaveBeenCalledOnce()

      // Verify session was persisted with correct data
      const writtenData = vi.mocked(adapters.writeSession).mock
        .calls[0][0] as SessionData
      expect(writtenData.accessToken).toBe('refreshed-access-token')
      expect(writtenData.refreshToken).toBe('refreshed-refresh-token')
      expect(writtenData.username).toBe('testuser')
    })

    it('refreshes when token expires within buffer window', async () => {
      const now = Date.now()
      const adapters = createStubAdapters({
        readSession: vi.fn(async () =>
          authenticatedSnapshot({
            // Expires in 2 minutes (within the 5-minute buffer)
            expiresAt: now + 2 * 60 * 1000
          })
        ),
        refreshAccessToken: vi.fn(async () => createMockTokens()),
        now: () => now
      })
      configureRedditContext(adapters)

      const ctx = await getRedditContext()

      expect(ctx.isAuthenticated).toBe(true)
      expect(adapters.refreshAccessToken).toHaveBeenCalledOnce()
    })

    it('refreshes when expiresAt is undefined', async () => {
      const adapters = createStubAdapters({
        readSession: vi.fn(async () =>
          authenticatedSnapshot({expiresAt: undefined})
        ),
        refreshAccessToken: vi.fn(async () => createMockTokens())
      })
      configureRedditContext(adapters)

      const ctx = await getRedditContext()

      expect(ctx.isAuthenticated).toBe(true)
      expect(adapters.refreshAccessToken).toHaveBeenCalledOnce()
    })
  })

  // -------------------------------------------------------------------------
  // getRedditContext — refresh fails
  // -------------------------------------------------------------------------

  describe('getRedditContext — refresh fails', () => {
    it('falls back to anonymous context', async () => {
      const now = Date.now()
      const adapters = createStubAdapters({
        readSession: vi.fn(async () =>
          authenticatedSnapshot({expiresAt: now - 1000})
        ),
        refreshAccessToken: vi.fn(async () => {
          throw new Error('Network error')
        }),
        now: () => now
      })
      configureRedditContext(adapters)

      const ctx = await getRedditContext()

      expect(ctx.isAuthenticated).toBe(false)
      expect(ctx.baseUrl).toBe('https://www.reddit.com')
      expect(ctx.username).toBeNull()
    })

    it('falls back to anonymous when no refresh token exists', async () => {
      const now = Date.now()
      const adapters = createStubAdapters({
        readSession: vi.fn(async () =>
          authenticatedSnapshot({
            refreshToken: undefined,
            expiresAt: now - 1000
          })
        ),
        now: () => now
      })
      configureRedditContext(adapters)

      const ctx = await getRedditContext()

      expect(ctx.isAuthenticated).toBe(false)
      expect(adapters.refreshAccessToken).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // getRedditContext — concurrent refresh coalescing
  // -------------------------------------------------------------------------

  describe('getRedditContext — concurrent refresh coalescing', () => {
    it('coalesces concurrent refresh calls into one', async () => {
      const now = Date.now()
      let resolveRefresh!: (value: AuthTokens) => void
      const refreshPromise = new Promise<AuthTokens>((resolve) => {
        resolveRefresh = resolve
      })

      const adapters = createStubAdapters({
        readSession: vi.fn(async () =>
          authenticatedSnapshot({expiresAt: now - 1000})
        ),
        refreshAccessToken: vi.fn(() => refreshPromise),
        now: () => now
      })
      configureRedditContext(adapters)

      // Fire two concurrent calls
      const promise1 = getRedditContext()
      const promise2 = getRedditContext()

      // Resolve the single shared refresh
      resolveRefresh(createMockTokens())

      const [ctx1, ctx2] = await Promise.all([promise1, promise2])

      // Both should succeed
      expect(ctx1.isAuthenticated).toBe(true)
      expect(ctx2.isAuthenticated).toBe(true)
      expect(ctx1.headers).toEqual(ctx2.headers)

      // Only one refresh call
      expect(adapters.refreshAccessToken).toHaveBeenCalledOnce()
      expect(adapters.writeSession).toHaveBeenCalledOnce()
    })
  })

  // -------------------------------------------------------------------------
  // Token rotation handling
  // -------------------------------------------------------------------------

  describe('token rotation', () => {
    it('persists new refresh token when provider rotates it', async () => {
      const now = Date.now()
      const adapters = createStubAdapters({
        readSession: vi.fn(async () =>
          authenticatedSnapshot({
            refreshToken: 'old-refresh-token',
            expiresAt: now - 1000
          })
        ),
        refreshAccessToken: vi.fn(async () =>
          createMockTokens({refreshToken: 'new-rotated-refresh-token'})
        ),
        now: () => now
      })
      configureRedditContext(adapters)

      await getRedditContext()

      const writtenData = vi.mocked(adapters.writeSession).mock
        .calls[0][0] as SessionData
      expect(writtenData.refreshToken).toBe('new-rotated-refresh-token')
    })

    it('keeps existing refresh token when provider does not rotate', async () => {
      const now = Date.now()
      const adapters = createStubAdapters({
        readSession: vi.fn(async () =>
          authenticatedSnapshot({
            refreshToken: 'original-token',
            expiresAt: now - 1000
          })
        ),
        refreshAccessToken: vi.fn(async () =>
          createMockTokens({refreshToken: 'original-token'})
        ),
        now: () => now
      })
      configureRedditContext(adapters)

      await getRedditContext()

      const writtenData = vi.mocked(adapters.writeSession).mock
        .calls[0][0] as SessionData
      // Same token returned means no rotation detected
      expect(writtenData.refreshToken).toBe('original-token')
    })

    it('keeps existing refresh token when refreshToken() throws', async () => {
      const now = Date.now()
      const adapters = createStubAdapters({
        readSession: vi.fn(async () =>
          authenticatedSnapshot({
            refreshToken: 'original-token',
            expiresAt: now - 1000
          })
        ),
        refreshAccessToken: vi.fn(async () => ({
          accessToken: () => 'refreshed-access-token',
          refreshToken: () => {
            throw new Error('not provided')
          },
          accessTokenExpiresAt: () => new Date(now + 3600000)
        })),
        now: () => now
      })
      configureRedditContext(adapters)

      await getRedditContext()

      const writtenData = vi.mocked(adapters.writeSession).mock
        .calls[0][0] as SessionData
      expect(writtenData.refreshToken).toBe('original-token')
    })
  })

  // -------------------------------------------------------------------------
  // configureRedditContext / resetRedditContext
  // -------------------------------------------------------------------------

  describe('configureRedditContext / resetRedditContext', () => {
    it('uses custom adapters after configure', async () => {
      const readSession = vi.fn(async () =>
        authenticatedSnapshot({
          expiresAt: Date.now() + 3600000
        })
      )
      configureRedditContext(createStubAdapters({readSession}))

      await getRedditContext()

      expect(readSession).toHaveBeenCalledOnce()
    })

    it('clears custom adapters and inflight refresh on reset', async () => {
      const readSession = vi.fn(async () => emptySnapshot())
      configureRedditContext(createStubAdapters({readSession}))

      resetRedditContext()

      // After reset, calling getRedditContext would use default adapters.
      // We cannot easily assert defaults without a real session, but we
      // can verify the custom adapter is no longer called by configuring
      // a new one.
      const readSession2 = vi.fn(async () => emptySnapshot())
      configureRedditContext(createStubAdapters({readSession: readSession2}))

      await getRedditContext()

      expect(readSession).not.toHaveBeenCalled()
      expect(readSession2).toHaveBeenCalledOnce()
    })
  })

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe('edge cases', () => {
    it('handles snapshot with empty username gracefully', async () => {
      const now = Date.now()
      const adapters = createStubAdapters({
        readSession: vi.fn(async () =>
          authenticatedSnapshot({
            username: undefined,
            expiresAt: now + TOKEN_REFRESH_BUFFER + 60000
          })
        ),
        now: () => now
      })
      configureRedditContext(adapters)

      const ctx = await getRedditContext()

      expect(ctx.isAuthenticated).toBe(true)
      expect(ctx.username).toBeNull()
    })

    it('uses fallback expiration when accessTokenExpiresAt returns null', async () => {
      const now = 1700000000000
      const adapters = createStubAdapters({
        readSession: vi.fn(async () =>
          authenticatedSnapshot({expiresAt: now - 1000})
        ),
        refreshAccessToken: vi.fn(async () => ({
          accessToken: () => 'new-token',
          refreshToken: () => 'new-refresh',
          accessTokenExpiresAt: () => null as unknown as Date
        })),
        now: () => now
      })
      configureRedditContext(adapters)

      await getRedditContext()

      const writtenData = vi.mocked(adapters.writeSession).mock
        .calls[0][0] as SessionData
      // Fallback: now + 1 hour
      expect(writtenData.expiresAt).toBe(now + 3600000)
    })
  })
})
