import {beforeEach, describe, expect, it, vi} from 'vitest'
import {cleanupOAuthCookies, extractRefreshToken} from './oauthHelpers'

// Mock logError
vi.mock('@/lib/utils/logging/logError', () => ({
  logError: vi.fn()
}))

describe('extractRefreshToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return refresh token when available', async () => {
    const mockTokens = {
      refreshToken: () => 'refresh_token_123'
    }

    const result = await extractRefreshToken(mockTokens, 'testuser')

    expect(result).toBe('refresh_token_123')
  })

  it('should return empty string and log when refresh token is null', async () => {
    const {logError} = await import('@/lib/utils/logging/logError')
    const mockTokens = {
      refreshToken: () => null
    }

    const result = await extractRefreshToken(mockTokens, 'testuser')

    expect(result).toBe('')
    expect(logError).toHaveBeenCalledWith(
      'Refresh token not provided by Reddit OAuth',
      expect.objectContaining({
        component: 'OAuthHelpers',
        action: 'extractRefreshToken',
        username: 'testuser',
        note: 'User will need to re-login when access token expires'
      })
    )
  })

  it('should return empty string and log when refreshToken throws error', async () => {
    const {logError} = await import('@/lib/utils/logging/logError')
    const mockTokens = {
      refreshToken: () => {
        throw new Error('Refresh token not provided')
      }
    }

    const result = await extractRefreshToken(mockTokens, 'testuser')

    expect(result).toBe('')
    expect(logError).toHaveBeenCalledWith(
      'Error extracting refresh token',
      expect.objectContaining({
        component: 'OAuthHelpers',
        action: 'extractRefreshToken',
        username: 'testuser',
        errorType: 'Error',
        message: 'Refresh token not provided'
      })
    )
  })

  it('should handle non-Error exceptions', async () => {
    const {logError} = await import('@/lib/utils/logging/logError')
    const mockTokens = {
      refreshToken: () => {
        throw 'String error' // eslint-disable-line no-throw-literal
      }
    }

    const result = await extractRefreshToken(mockTokens, 'testuser')

    expect(result).toBe('')
    expect(logError).toHaveBeenCalledWith(
      'Error extracting refresh token',
      expect.objectContaining({
        component: 'OAuthHelpers',
        action: 'extractRefreshToken',
        username: 'testuser',
        errorType: 'Unknown',
        message: 'Unknown error'
      })
    )
  })

  it('should include username in error log', async () => {
    const {logError} = await import('@/lib/utils/logging/logError')
    const mockTokens = {
      refreshToken: () => {
        throw new Error('Token error')
      }
    }

    await extractRefreshToken(mockTokens, 'john_doe')

    expect(logError).toHaveBeenCalledWith(
      'Error extracting refresh token',
      expect.objectContaining({
        username: 'john_doe'
      })
    )
  })
})

describe('cleanupOAuthCookies', () => {
  it('should delete all OAuth-related cookies', async () => {
    const mockCookieStore = {
      delete: vi.fn()
    }

    await cleanupOAuthCookies(mockCookieStore)

    expect(mockCookieStore.delete).toHaveBeenCalledWith('reddit_oauth_state')
    expect(mockCookieStore.delete).toHaveBeenCalledWith('authjs.callback-url')
    expect(mockCookieStore.delete).toHaveBeenCalledWith('authjs.session-token')
    expect(mockCookieStore.delete).toHaveBeenCalledTimes(3)
  })

  it('should handle cookie store errors gracefully', async () => {
    const mockCookieStore = {
      delete: vi.fn(() => {
        throw new Error('Cookie delete failed')
      })
    }

    // Should not throw
    await expect(cleanupOAuthCookies(mockCookieStore)).rejects.toThrow(
      'Cookie delete failed'
    )
  })

  it('should call delete in correct order', async () => {
    const deleteCalls: string[] = []
    const mockCookieStore = {
      delete: vi.fn((name: string) => {
        deleteCalls.push(name)
      })
    }

    await cleanupOAuthCookies(mockCookieStore)

    expect(deleteCalls).toEqual([
      'reddit_oauth_state',
      'authjs.callback-url',
      'authjs.session-token'
    ])
  })
})
