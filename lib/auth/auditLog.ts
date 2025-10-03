/**
 * Security audit logging for authentication events.
 * Logs are sent to the centralized logging system via logError/logClientInfo.
 */

import {logError} from '@/lib/utils/logError'

export type AuditEventType =
  | 'login_initiated'
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'token_refresh_success'
  | 'token_refresh_failed'
  | 'session_check'
  | 'session_expired'
  | 'rate_limit_exceeded'
  | 'csrf_validation_failed'
  | 'invalid_state'

export interface AuditEvent {
  type: AuditEventType
  username?: string
  ip?: string
  userAgent?: string
  timestamp: string
  metadata?: Record<string, unknown>
}

/**
 * Log a security audit event using centralized logging.
 */
export function logAuditEvent(event: Omit<AuditEvent, 'timestamp'>): void {
  // Use centralized logging system
  logError(`[AUDIT] ${event.type}`, {
    component: 'AuditLog',
    action: event.type,
    username: event.username,
    ip: event.ip,
    userAgent: event.userAgent,
    timestamp: new Date().toISOString(),
    ...event.metadata
  })
}

/**
 * Extract client info from request for audit logging.
 */
export function getClientInfo(request: Request): {
  ip?: string
  userAgent?: string
} {
  return {
    ip:
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      undefined,
    userAgent: request.headers.get('user-agent') || undefined
  }
}
