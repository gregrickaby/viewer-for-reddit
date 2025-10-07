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

// Mock audit log module
vi.mock('@/lib/auth/auditLog', () => ({
  logAuditEvent: vi.fn(),
  getClientInfo: vi.fn(() => ({
    ip: '127.0.0.1',
    userAgent: 'test-agent'
  }))
}))

// Mock error logging
const mockLogError = vi.hoisted(() => vi.fn())
vi.mock('@/lib/utils/logging/logError', () => ({
  logError: mockLogError
}))

describe('POST /api/auth/refresh', () => {
  beforeEach(async () => {
    vi.clearAllMocks()

    const {checkRateLimit} = await import('@/lib/auth/rateLimit')
    vi.mocked(checkRateLimit).mockResolvedValue(null)
  })

  it('should refresh access token successfully', async () => {
    const {getSession, updateSessionTokens} = await import('@/lib/auth/session')
    const {logAuditEvent} = await import('@/lib/auth/auditLog')

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

    expect(logAuditEvent).toHaveBeenCalledWith({
      type: 'token_refresh_success',
      username: 'testuser',
      ip: '127.0.0.1',
      userAgent: 'test-agent'
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

  it('should set cache control headers on success', async () => {
    const {getSession} = await import('@/lib/auth/session')

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

    expect(response.headers.get('Cache-Control')).toBe(
      'private, no-cache, no-store, must-revalidate'
    )
    expect(response.headers.get('Pragma')).toBe('no-cache')
    expect(response.headers.get('Expires')).toBe('0')
  })

  it('should return 401 when no session exists', async () => {
    const {getSession} = await import('@/lib/auth/session')
    const {logAuditEvent} = await import('@/lib/auth/auditLog')
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

    expect(logAuditEvent).toHaveBeenCalledWith({
      type: 'token_refresh_failed',
      username: undefined,
      ip: '127.0.0.1',
      userAgent: 'test-agent'
    })
  })

  it('should return 401 when no refresh token exists', async () => {
    const {getSession} = await import('@/lib/auth/session')
    const {logAuditEvent} = await import('@/lib/auth/auditLog')

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

    expect(logAuditEvent).toHaveBeenCalledWith({
      type: 'token_refresh_failed',
      username: 'testuser',
      ip: '127.0.0.1',
      userAgent: 'test-agent'
    })
  })

  it('should return 401 when token refresh fails', async () => {
    const {getSession} = await import('@/lib/auth/session')
    const {logAuditEvent} = await import('@/lib/auth/auditLog')

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

    expect(logAuditEvent).toHaveBeenCalledWith({
      type: 'token_refresh_failed',
      username: 'testuser',
      ip: '127.0.0.1',
      userAgent: 'test-agent'
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

    // Should use centralized error logging
    expect(mockLogError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        component: 'RefreshRoute',
        action: 'refreshToken',
        username: 'testuser',
        ip: '127.0.0.1',
        userAgent: 'test-agent'
      })
    )
  })

  it('should set cache control headers on error', async () => {
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

    const response = await POST(request)

    expect(response.headers.get('Cache-Control')).toBe(
      'private, no-cache, no-store, must-revalidate'
    )
    expect(response.headers.get('Pragma')).toBe('no-cache')
    expect(response.headers.get('Expires')).toBe('0')
  })
})
