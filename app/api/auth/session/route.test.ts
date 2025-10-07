import {NextRequest} from 'next/server'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {GET} from './route'

// Mock dependencies
const mockLogError = vi.hoisted(() => vi.fn())
const mockGetClientInfo = vi.hoisted(() =>
  vi.fn(() => ({ip: '127.0.0.1', userAgent: 'test-agent'}))
)
const mockCheckRateLimit = vi.hoisted(() => vi.fn())

vi.mock('@/lib/auth/session', () => ({
  getClientSession: vi.fn()
}))

vi.mock('@/lib/utils/logging/logError', () => ({
  logError: mockLogError
}))

vi.mock('@/lib/auth/auditLog', () => ({
  getClientInfo: mockGetClientInfo
}))

vi.mock('@/lib/auth/rateLimit', () => ({
  checkRateLimit: mockCheckRateLimit
}))

describe('GET /api/auth/session', () => {
  const mockRequest = new NextRequest('http://localhost/api/auth/session')

  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckRateLimit.mockResolvedValue(null) // No rate limit by default
  })

  it('should return client session when user is authenticated', async () => {
    const {getClientSession} = await import('@/lib/auth/session')
    const mockSession = {
      username: 'testuser',
      expiresAt: Date.now() + 3600000,
      isAuthenticated: true,
      avatarUrl: 'https://example.com/avatar.png'
    }
    vi.mocked(getClientSession).mockResolvedValue(mockSession)

    const response = await GET(mockRequest)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toEqual(mockSession)
  })

  it('should return null when no session exists', async () => {
    const {getClientSession} = await import('@/lib/auth/session')
    vi.mocked(getClientSession).mockResolvedValue(null)

    const response = await GET(mockRequest)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toBeNull()
  })

  it('should not include tokens in response', async () => {
    const {getClientSession} = await import('@/lib/auth/session')
    const mockSession = {
      username: 'testuser',
      expiresAt: Date.now() + 3600000,
      isAuthenticated: true,
      avatarUrl: 'https://example.com/avatar.png'
    }
    vi.mocked(getClientSession).mockResolvedValue(mockSession)

    const response = await GET(mockRequest)

    const data = await response.json()
    expect(data).not.toHaveProperty('accessToken')
    expect(data).not.toHaveProperty('refreshToken')
  })

  it('should apply rate limiting', async () => {
    const rateLimitResponse = new Response('Rate limited', {status: 429})
    mockCheckRateLimit.mockResolvedValue(rateLimitResponse)

    const response = await GET(mockRequest)

    expect(response).toBe(rateLimitResponse)
    expect(mockCheckRateLimit).toHaveBeenCalledWith(mockRequest)
  })

  it('should handle errors with centralized logging', async () => {
    const {getClientSession} = await import('@/lib/auth/session')
    const error = new Error('Session retrieval failed')
    vi.mocked(getClientSession).mockRejectedValue(error)

    const response = await GET(mockRequest)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data).toBeNull()

    // Verify centralized error logging
    expect(mockLogError).toHaveBeenCalledWith(error, {
      component: 'SessionRoute',
      action: 'getSession',
      ip: '127.0.0.1',
      userAgent: 'test-agent'
    })
  })

  it('should set cache prevention headers on success', async () => {
    const {getClientSession} = await import('@/lib/auth/session')
    const mockSession = {
      username: 'testuser',
      expiresAt: Date.now() + 3600000,
      isAuthenticated: true,
      avatarUrl: 'https://example.com/avatar.png'
    }
    vi.mocked(getClientSession).mockResolvedValue(mockSession)

    const response = await GET(mockRequest)

    expect(response.headers.get('Cache-Control')).toBe(
      'private, no-cache, no-store, must-revalidate'
    )
    expect(response.headers.get('Pragma')).toBe('no-cache')
    expect(response.headers.get('Expires')).toBe('0')
  })

  it('should set cache prevention headers on error', async () => {
    const {getClientSession} = await import('@/lib/auth/session')
    vi.mocked(getClientSession).mockRejectedValue(new Error('Test error'))

    const response = await GET(mockRequest)

    expect(response.headers.get('Cache-Control')).toBe(
      'private, no-cache, no-store, must-revalidate'
    )
    expect(response.headers.get('Pragma')).toBe('no-cache')
    expect(response.headers.get('Expires')).toBe('0')
  })
})
