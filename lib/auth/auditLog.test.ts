import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {getClientInfo, logAuditEvent} from './auditLog'

vi.mock('@/lib/utils/logError', () => ({
  logError: vi.fn()
}))

import {logError} from '@/lib/utils/logError'

describe('logAuditEvent', () => {
  let mockLogError: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockLogError = vi.mocked(logError)
    mockLogError.mockClear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should log audit event with timestamp using logError', () => {
    const fixedDate = new Date('2025-10-01T12:00:00.000Z')
    vi.setSystemTime(fixedDate)

    logAuditEvent({
      type: 'login_success',
      username: 'testuser',
      ip: '192.168.1.1'
    })

    expect(mockLogError).toHaveBeenCalledWith(
      '[AUDIT] login_success',
      expect.objectContaining({
        component: 'AuditLog',
        action: 'login_success',
        username: 'testuser',
        ip: '192.168.1.1',
        timestamp: '2025-10-01T12:00:00.000Z'
      })
    )
  })

  it('should log login_initiated event', () => {
    logAuditEvent({
      type: 'login_initiated',
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0'
    })

    expect(mockLogError).toHaveBeenCalledWith(
      '[AUDIT] login_initiated',
      expect.objectContaining({
        component: 'AuditLog',
        action: 'login_initiated',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: expect.any(String)
      })
    )
  })

  it('should log login_failed event with metadata', () => {
    logAuditEvent({
      type: 'login_failed',
      ip: '192.168.1.1',
      metadata: {
        error: 'Invalid credentials',
        attemptCount: 3
      }
    })

    expect(mockLogError).toHaveBeenCalledWith(
      '[AUDIT] login_failed',
      expect.objectContaining({
        component: 'AuditLog',
        action: 'login_failed',
        ip: '192.168.1.1',
        error: 'Invalid credentials',
        attemptCount: 3,
        timestamp: expect.any(String)
      })
    )
  })

  it('should log logout event', () => {
    logAuditEvent({
      type: 'logout',
      username: 'testuser'
    })

    expect(mockLogError).toHaveBeenCalledWith(
      '[AUDIT] logout',
      expect.objectContaining({
        component: 'AuditLog',
        action: 'logout',
        username: 'testuser',
        timestamp: expect.any(String)
      })
    )
  })

  it('should log token_refresh_success event', () => {
    logAuditEvent({
      type: 'token_refresh_success',
      username: 'testuser',
      ip: '192.168.1.1'
    })

    expect(mockLogError).toHaveBeenCalledWith(
      '[AUDIT] token_refresh_success',
      expect.objectContaining({
        component: 'AuditLog',
        action: 'token_refresh_success',
        username: 'testuser',
        ip: '192.168.1.1',
        timestamp: expect.any(String)
      })
    )
  })

  it('should log token_refresh_failed event', () => {
    logAuditEvent({
      type: 'token_refresh_failed',
      username: 'testuser',
      metadata: {error: 'Token expired'}
    })

    expect(mockLogError).toHaveBeenCalledWith(
      '[AUDIT] token_refresh_failed',
      expect.objectContaining({
        component: 'AuditLog',
        action: 'token_refresh_failed',
        username: 'testuser',
        error: 'Token expired',
        timestamp: expect.any(String)
      })
    )
  })

  it('should log session_expired event', () => {
    logAuditEvent({
      type: 'session_expired',
      username: 'testuser'
    })

    expect(mockLogError).toHaveBeenCalledWith(
      '[AUDIT] session_expired',
      expect.objectContaining({
        component: 'AuditLog',
        action: 'session_expired',
        username: 'testuser',
        timestamp: expect.any(String)
      })
    )
  })

  it('should log rate_limit_exceeded event', () => {
    logAuditEvent({
      type: 'rate_limit_exceeded',
      ip: '192.168.1.1',
      metadata: {
        endpoint: '/api/auth/login',
        limit: 10
      }
    })

    expect(mockLogError).toHaveBeenCalledWith(
      '[AUDIT] rate_limit_exceeded',
      expect.objectContaining({
        component: 'AuditLog',
        action: 'rate_limit_exceeded',
        ip: '192.168.1.1',
        endpoint: '/api/auth/login',
        limit: 10,
        timestamp: expect.any(String)
      })
    )
  })

  it('should log csrf_validation_failed event', () => {
    logAuditEvent({
      type: 'csrf_validation_failed',
      ip: '192.168.1.1',
      metadata: {reason: 'Missing token'}
    })

    expect(mockLogError).toHaveBeenCalledWith(
      '[AUDIT] csrf_validation_failed',
      expect.objectContaining({
        component: 'AuditLog',
        action: 'csrf_validation_failed',
        ip: '192.168.1.1',
        reason: 'Missing token',
        timestamp: expect.any(String)
      })
    )
  })

  it('should log invalid_state event', () => {
    logAuditEvent({
      type: 'invalid_state',
      ip: '192.168.1.1',
      metadata: {expected: 'abc123', received: 'xyz789'}
    })

    expect(mockLogError).toHaveBeenCalledWith(
      '[AUDIT] invalid_state',
      expect.objectContaining({
        component: 'AuditLog',
        action: 'invalid_state',
        ip: '192.168.1.1',
        expected: 'abc123',
        received: 'xyz789',
        timestamp: expect.any(String)
      })
    )
  })

  it('should handle event without optional fields', () => {
    logAuditEvent({
      type: 'login_success'
    })

    expect(mockLogError).toHaveBeenCalledWith(
      '[AUDIT] login_success',
      expect.objectContaining({
        component: 'AuditLog',
        action: 'login_success',
        timestamp: expect.any(String)
      })
    )
  })

  it('should generate ISO 8601 timestamp', () => {
    const fixedDate = new Date('2025-10-01T15:30:45.123Z')
    vi.setSystemTime(fixedDate)

    logAuditEvent({
      type: 'login_success'
    })

    expect(mockLogError).toHaveBeenCalledWith(
      '[AUDIT] login_success',
      expect.objectContaining({
        component: 'AuditLog',
        action: 'login_success',
        timestamp: '2025-10-01T15:30:45.123Z'
      })
    )
  })

  it('should generate unique timestamps for sequential events', () => {
    const firstTime = new Date('2025-10-01T12:00:00.000Z')
    vi.setSystemTime(firstTime)

    logAuditEvent({type: 'login_initiated'})

    const secondTime = new Date('2025-10-01T12:00:01.000Z')
    vi.setSystemTime(secondTime)

    logAuditEvent({type: 'login_success'})

    expect(mockLogError).toHaveBeenNthCalledWith(
      1,
      '[AUDIT] login_initiated',
      expect.objectContaining({
        component: 'AuditLog',
        action: 'login_initiated',
        timestamp: '2025-10-01T12:00:00.000Z'
      })
    )

    expect(mockLogError).toHaveBeenNthCalledWith(
      2,
      '[AUDIT] login_success',
      expect.objectContaining({
        component: 'AuditLog',
        action: 'login_success',
        timestamp: '2025-10-01T12:00:01.000Z'
      })
    )
  })

  it('should include all fields from event', () => {
    logAuditEvent({
      type: 'login_failed',
      username: 'testuser',
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      metadata: {error: 'Invalid password', attempts: 3}
    })

    expect(mockLogError).toHaveBeenCalledWith(
      '[AUDIT] login_failed',
      expect.objectContaining({
        component: 'AuditLog',
        action: 'login_failed',
        username: 'testuser',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        error: 'Invalid password',
        attempts: 3,
        timestamp: expect.any(String)
      })
    )
  })
})

describe('getClientInfo', () => {
  function createMockRequest(headers: Record<string, string>): Request {
    return {
      headers: {
        get: (name: string) => headers[name.toLowerCase()] || null
      }
    } as Request
  }

  describe('IP address extraction', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1'
      })

      const clientInfo = getClientInfo(request)

      expect(clientInfo.ip).toBe('192.168.1.1')
    })

    it('should extract first IP from x-forwarded-for with multiple IPs', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1'
      })

      const clientInfo = getClientInfo(request)

      expect(clientInfo.ip).toBe('192.168.1.1')
    })

    it('should trim whitespace from x-forwarded-for IP', () => {
      const request = createMockRequest({
        'x-forwarded-for': '  192.168.1.1  '
      })

      const clientInfo = getClientInfo(request)

      expect(clientInfo.ip).toBe('192.168.1.1')
    })

    it('should fallback to x-real-ip when x-forwarded-for is not present', () => {
      const request = createMockRequest({
        'x-real-ip': '10.0.0.1'
      })

      const clientInfo = getClientInfo(request)

      expect(clientInfo.ip).toBe('10.0.0.1')
    })

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '10.0.0.1'
      })

      const clientInfo = getClientInfo(request)

      expect(clientInfo.ip).toBe('192.168.1.1')
    })

    it('should return undefined when no IP headers present', () => {
      const request = createMockRequest({})

      const clientInfo = getClientInfo(request)

      expect(clientInfo.ip).toBeUndefined()
    })

    it('should handle empty x-forwarded-for header', () => {
      const request = createMockRequest({
        'x-forwarded-for': ''
      })

      const clientInfo = getClientInfo(request)

      expect(clientInfo.ip).toBeUndefined()
    })
  })

  describe('User-Agent extraction', () => {
    it('should extract user-agent header', () => {
      const request = createMockRequest({
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      })

      const clientInfo = getClientInfo(request)

      expect(clientInfo.userAgent).toBe(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      )
    })

    it('should return undefined when user-agent not present', () => {
      const request = createMockRequest({})

      const clientInfo = getClientInfo(request)

      expect(clientInfo.userAgent).toBeUndefined()
    })

    it('should handle empty user-agent header', () => {
      const request = createMockRequest({
        'user-agent': ''
      })

      const clientInfo = getClientInfo(request)

      expect(clientInfo.userAgent).toBeUndefined()
    })
  })

  describe('combined extraction', () => {
    it('should extract both IP and user-agent', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'Mozilla/5.0'
      })

      const clientInfo = getClientInfo(request)

      expect(clientInfo).toEqual({
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      })
    })

    it('should return empty object when no headers present', () => {
      const request = createMockRequest({})

      const clientInfo = getClientInfo(request)

      expect(clientInfo).toEqual({
        ip: undefined,
        userAgent: undefined
      })
    })

    it('should handle real-world header combinations', () => {
      const request = createMockRequest({
        'x-forwarded-for': '203.0.113.1, 198.51.100.1',
        'x-real-ip': '203.0.113.1',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      })

      const clientInfo = getClientInfo(request)

      expect(clientInfo).toEqual({
        ip: '203.0.113.1',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      })
    })
  })
})
