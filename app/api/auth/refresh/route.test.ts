import {NextRequest, NextResponse} from 'next/server'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {POST} from './route'

// Mock Reddit client
const mockReddit = {
  refreshAccessToken: vi.fn()
}

// Mock dependencies
vi.mock('@/lib/auth/arctic', () => ({
  getRedditClient: vi.fn(() => mockReddit)
}))

vi.mock('@/lib/auth/rateLimit', () => ({
  checkRateLimit: vi.fn()
}))

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
  updateSessionTokens: vi.fn()
}))

describe('POST /api/auth/refresh', () => {
  beforeEach(async () => {
    vi.clearAllMocks()

    const {checkRateLimit} = await import('@/lib/auth/rateLimit')
    vi.mocked(checkRateLimit).mockResolvedValue(null)
  })

  it('should refresh access token successfully', async () => {
    const {getSession, updateSessionTokens} = await import('@/lib/auth/session')

    const mockSession = {
      username: 'testuser',
      accessToken: 'old_token',
      refreshToken: 'refresh_token',
      expiresAt: Date.now() + 3600000,
      sessionVersion: 1234567890
    }

    const newExpiresAt = Date.now() + 7200000
    const mockTokens = {
      accessToken: () => 'new_access_token',
      refreshToken: () => 'new_refresh_token',
      hasRefreshToken: () => true,
      accessTokenExpiresAt: () => new Date(newExpiresAt)
    }

    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(mockReddit.refreshAccessToken).mockResolvedValue(
      mockTokens as any
    )

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST'
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toEqual({
      success: true,
      expiresAt: newExpiresAt
    })

    expect(updateSessionTokens).toHaveBeenCalledWith({
      accessToken: 'new_access_token',
      refreshToken: 'new_refresh_token',
      expiresAt: newExpiresAt
    })
  })

  it('should handle refresh without new refresh token', async () => {
    const {getSession, updateSessionTokens} = await import('@/lib/auth/session')

    const mockSession = {
      username: 'testuser',
      accessToken: 'old_token',
      refreshToken: 'refresh_token',
      expiresAt: Date.now() + 3600000,
      sessionVersion: 1234567890
    }

    const newExpiresAt = Date.now() + 7200000
    const mockTokens = {
      accessToken: () => 'new_access_token',
      hasRefreshToken: () => false,
      accessTokenExpiresAt: () => new Date(newExpiresAt)
    }

    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(mockReddit.refreshAccessToken).mockResolvedValue(
      mockTokens as any
    )

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST'
    })

    await POST(request)

    expect(updateSessionTokens).toHaveBeenCalledWith({
      accessToken: 'new_access_token',
      refreshToken: undefined,
      expiresAt: newExpiresAt
    })
  })

  it('should return 401 when no session exists', async () => {
    const {getSession} = await import('@/lib/auth/session')
    vi.mocked(getSession).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST'
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data).toEqual({
      error: 'no_session',
      message: 'No active session or refresh token'
    })
  })

  it('should return 401 when no refresh token exists', async () => {
    const {getSession} = await import('@/lib/auth/session')

    const mockSession = {
      username: 'testuser',
      accessToken: 'token',
      refreshToken: '',
      expiresAt: Date.now() + 3600000,
      sessionVersion: 1234567890
    }

    vi.mocked(getSession).mockResolvedValue(mockSession)

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST'
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data).toEqual({
      error: 'no_session',
      message: 'No active session or refresh token'
    })
  })

  it('should return 401 when token refresh fails', async () => {
    const {getSession} = await import('@/lib/auth/session')

    const mockSession = {
      username: 'testuser',
      accessToken: 'token',
      refreshToken: 'refresh_token',
      expiresAt: Date.now() + 3600000,
      sessionVersion: 1234567890
    }

    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(mockReddit.refreshAccessToken).mockRejectedValue(
      new Error('Invalid refresh token')
    )

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST'
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data).toEqual({
      error: 'refresh_failed',
      message: 'Failed to refresh token'
    })
  })

  it('should return rate limit response when rate limited', async () => {
    const {checkRateLimit} = await import('@/lib/auth/rateLimit')
    const rateLimitResponse = NextResponse.json(
      {error: 'rate_limited'},
      {status: 429}
    )
    vi.mocked(checkRateLimit).mockResolvedValue(rateLimitResponse)

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST'
    })

    const response = await POST(request)

    expect(response.status).toBe(429)
  })

  it('should log error when token refresh fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const {getSession} = await import('@/lib/auth/session')

    const mockSession = {
      username: 'testuser',
      accessToken: 'token',
      refreshToken: 'refresh_token',
      expiresAt: Date.now() + 3600000,
      sessionVersion: 1234567890
    }

    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(mockReddit.refreshAccessToken).mockRejectedValue(
      new Error('Network error')
    )

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST'
    })

    await POST(request)

    expect(consoleSpy).toHaveBeenCalledWith(
      'Token refresh failed:',
      expect.objectContaining({
        error: 'Network error',
        timestamp: expect.any(String)
      })
    )

    consoleSpy.mockRestore()
  })
})
