/**
 * Security audit logging for authentication events.
 * In production, these should be sent to a centralized logging system.
 */

export type AuditEventType =
  | 'login_initiated'
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'token_refresh_success'
  | 'token_refresh_failed'
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
 * Log a security audit event.
 * In production, integrate with your logging service (DataDog, LogRocket, etc.)
 */
export function logAuditEvent(event: Omit<AuditEvent, 'timestamp'>): void {
  const auditEvent: AuditEvent = {
    ...event,
    timestamp: new Date().toISOString()
  }

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[AUDIT]', auditEvent)
    return
  }

  // In production, send to logging service
  // Example integrations:
  // - DataDog: datadogLogs.logger.info('audit_event', auditEvent)
  // - LogRocket: LogRocket.track('audit_event', auditEvent)
  // - Custom endpoint: fetch('/api/audit', { method: 'POST', body: JSON.stringify(auditEvent) })

  // eslint-disable-next-line no-console
  console.log('[AUDIT]', JSON.stringify(auditEvent))
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
