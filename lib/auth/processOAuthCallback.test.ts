/**
 * Tests for the OAuth callback processor.
 *
 * Mocks {@link exchangeCode} from reddit-auth and uses MSW for the
 * Reddit identity endpoint (/api/v1/me).
 */

import type {AuthTokens} from '@/lib/types/auth'

// Mock reddit-auth BEFORE imports
vi.mock('@/lib/utils/reddit-auth', () => ({
  exchangeCode: vi.fn(),
  refreshToken: vi.fn()
}))

// Mock Axiom logger
vi.mock('@/lib/axiom/server', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

import {exchangeCode} from '@/lib/utils/reddit-auth'
import {http, HttpResponse, server} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {processOAuthCallback} from './processOAuthCallback'

const mockExchangeCode = vi.mocked(exchangeCode)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockTokens(
  overrides: Partial<{
    accessToken: string
    refreshToken: string | undefined
    expiresAt: Date
  }> = {}
): AuthTokens {
  return {
    accessToken: () => overrides.accessToken ?? 'test-access-token',
    refreshToken: () =>
      'refreshToken' in overrides
        ? (overrides.refreshToken ?? '')
        : 'test-refresh-token',
    accessTokenExpiresAt: () =>
      overrides.expiresAt ?? new Date(Date.now() + 3600000)
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('processOAuthCallback', () => {
  beforeEach(() => {
    mockExchangeCode.mockReset()
  })

  // -------------------------------------------------------------------------
  // Success path
  // -------------------------------------------------------------------------

  describe('success path', () => {
    it('exchanges code and fetches identity, returning sessionData', async () => {
      mockExchangeCode.mockResolvedValue(createMockTokens())

      server.use(
        http.get('https://oauth.reddit.com/api/v1/me', () => {
          return HttpResponse.json({name: 'testuser', id: 't2_abc123'})
        })
      )

      const result = await processOAuthCallback('valid-auth-code')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.sessionData.accessToken).toBe('test-access-token')
        expect(result.sessionData.refreshToken).toBe('test-refresh-token')
        expect(result.sessionData.username).toBe('testuser')
        expect(result.sessionData.userId).toBe('t2_abc123')
        expect(result.sessionData.expiresAt).toBeGreaterThan(Date.now() - 1000)
      }

      expect(mockExchangeCode).toHaveBeenCalledWith('valid-auth-code')
    })
  })

  // -------------------------------------------------------------------------
  // Exchange failure
  // -------------------------------------------------------------------------

  describe('exchange failure', () => {
    it('returns failure with exchange_failed reason', async () => {
      mockExchangeCode.mockRejectedValue(new Error('invalid_grant'))

      const result = await processOAuthCallback('bad-code')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toBe('exchange_failed')
        expect(result.message).toBe('invalid_grant')
      }
    })

    it('handles non-Error throws during exchange', async () => {
      mockExchangeCode.mockRejectedValue('string error')

      const result = await processOAuthCallback('bad-code')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toBe('exchange_failed')
        expect(result.message).toBe('Token exchange failed')
      }
    })
  })

  // -------------------------------------------------------------------------
  // Identity fetch failure
  // -------------------------------------------------------------------------

  describe('identity failure', () => {
    it('returns failure with identity_failed reason on 401', async () => {
      mockExchangeCode.mockResolvedValue(createMockTokens())

      server.use(
        http.get('https://oauth.reddit.com/api/v1/me', () => {
          return new HttpResponse('Unauthorized', {status: 401})
        })
      )

      const result = await processOAuthCallback('valid-code')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toBe('identity_failed')
        expect(result.message).toContain('401')
      }
    })

    it('returns failure with identity_failed reason on 500', async () => {
      mockExchangeCode.mockResolvedValue(createMockTokens())

      server.use(
        http.get('https://oauth.reddit.com/api/v1/me', () => {
          return new HttpResponse('Internal Server Error', {status: 500})
        })
      )

      const result = await processOAuthCallback('valid-code')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toBe('identity_failed')
        expect(result.message).toContain('500')
      }
    })

    it('returns failure on network error during identity fetch', async () => {
      mockExchangeCode.mockResolvedValue(createMockTokens())

      server.use(
        http.get('https://oauth.reddit.com/api/v1/me', () => {
          return HttpResponse.error()
        })
      )

      const result = await processOAuthCallback('valid-code')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toBe('identity_failed')
      }
    })
  })

  // -------------------------------------------------------------------------
  // Missing refresh token
  // -------------------------------------------------------------------------

  describe('missing refresh token', () => {
    it('sets refreshToken to empty string when not provided', async () => {
      mockExchangeCode.mockResolvedValue(
        createMockTokens({refreshToken: undefined})
      )

      server.use(
        http.get('https://oauth.reddit.com/api/v1/me', () => {
          return HttpResponse.json({name: 'testuser', id: 't2_abc123'})
        })
      )

      const result = await processOAuthCallback('valid-code')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.sessionData.refreshToken).toBe('')
      }
    })

    it('sets refreshToken to empty string when refreshToken() throws', async () => {
      const tokensWithThrowingRefresh: AuthTokens = {
        accessToken: () => 'test-access-token',
        refreshToken: () => {
          throw new Error('not provided')
        },
        accessTokenExpiresAt: () => new Date(Date.now() + 3600000)
      }
      mockExchangeCode.mockResolvedValue(tokensWithThrowingRefresh)

      server.use(
        http.get('https://oauth.reddit.com/api/v1/me', () => {
          return HttpResponse.json({name: 'testuser', id: 't2_abc123'})
        })
      )

      const result = await processOAuthCallback('valid-code')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.sessionData.refreshToken).toBe('')
      }
    })
  })

  // -------------------------------------------------------------------------
  // Expiry fallback
  // -------------------------------------------------------------------------

  describe('expiry fallback', () => {
    it('uses fallback when accessTokenExpiresAt returns null', async () => {
      const now = Date.now()
      const tokensWithNullExpiry: AuthTokens = {
        accessToken: () => 'test-access-token',
        refreshToken: () => 'test-refresh-token',
        accessTokenExpiresAt: () => null as unknown as Date
      }
      mockExchangeCode.mockResolvedValue(tokensWithNullExpiry)

      server.use(
        http.get('https://oauth.reddit.com/api/v1/me', () => {
          return HttpResponse.json({name: 'testuser', id: 't2_abc123'})
        })
      )

      const result = await processOAuthCallback('valid-code')

      expect(result.ok).toBe(true)
      if (result.ok) {
        // Fallback: Date.now() + 3600000 (1 hour)
        expect(result.sessionData.expiresAt).toBeGreaterThanOrEqual(
          now + 3600000 - 1000
        )
      }
    })
  })
})
