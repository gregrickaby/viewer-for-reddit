import {NextRequest, NextResponse} from 'next/server'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {POST} from './route'

// Mock session module
vi.mock('@/lib/auth/session', () => ({
  deleteSession: vi.fn()
}))

// Mock audit log module
vi.mock('@/lib/auth/auditLog', () => ({
  logAuditEvent: vi.fn(),
  getClientInfo: vi.fn(() => ({
    ip: '127.0.0.1',
    userAgent: 'test-agent'
  }))
}))

// Mock rate limit module
vi.mock('@/lib/auth/rateLimit', () => ({
  checkRateLimit: vi.fn()
}))

// Mock error logging
const mockLogError = vi.hoisted(() => vi.fn())
vi.mock('@/lib/utils/logError', () => ({
  logError: mockLogError
}))

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should delete session and return success', async () => {
    const {deleteSession} = await import('@/lib/auth/session')
    const {logAuditEvent} = await import('@/lib/auth/auditLog')
    const {checkRateLimit} = await import('@/lib/auth/rateLimit')
    vi.mocked(checkRateLimit).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST'
    })

    const response = await POST(request)

    expect(checkRateLimit).toHaveBeenCalledWith(request)
    expect(deleteSession).toHaveBeenCalledTimes(1)
    expect(logAuditEvent).toHaveBeenCalledWith({
      type: 'logout',
      ip: '127.0.0.1',
      userAgent: 'test-agent'
    })
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data).toEqual({success: true})
  })

  it('should set cache control headers to prevent caching', async () => {
    const {checkRateLimit} = await import('@/lib/auth/rateLimit')
    vi.mocked(checkRateLimit).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST'
    })

    const response = await POST(request)

    expect(response.headers.get('Cache-Control')).toBe(
      'private, no-cache, no-store, must-revalidate'
    )
    expect(response.headers.get('Pragma')).toBe('no-cache')
    expect(response.headers.get('Expires')).toBe('0')
  })

  it('should return rate limit response when rate limited', async () => {
    const {checkRateLimit} = await import('@/lib/auth/rateLimit')
    const rateLimitResponse = NextResponse.json(
      {error: 'rate_limited'},
      {status: 429}
    )
    vi.mocked(checkRateLimit).mockResolvedValue(rateLimitResponse)

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST'
    })

    const response = await POST(request)

    expect(response.status).toBe(429)
  })

  it('should handle session deletion errors gracefully', async () => {
    const {deleteSession} = await import('@/lib/auth/session')
    const {checkRateLimit} = await import('@/lib/auth/rateLimit')
    vi.mocked(checkRateLimit).mockResolvedValue(null)
    vi.mocked(deleteSession).mockRejectedValue(new Error('Session error'))

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST'
    })

    const response = await POST(request)

    // Should return 500 error instead of throwing
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data).toEqual({error: 'Failed to logout. Please try again.'})

    // Should log error for debugging
    expect(mockLogError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        component: 'LogoutRoute',
        action: 'deleteSession',
        ip: '127.0.0.1',
        userAgent: 'test-agent'
      })
    )
  })
})
