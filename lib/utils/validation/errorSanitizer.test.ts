import {describe, expect, it} from 'vitest'
import {sanitizeErrorMessage} from './errorSanitizer'

describe('sanitizeErrorMessage', () => {
  it('should redact long alphanumeric tokens', () => {
    const message = 'Authentication failed with token abc123def456ghi789jkl012'
    const result = sanitizeErrorMessage(message)
    expect(result).toBe('Authentication failed with token [REDACTED]')
  })

  it('should redact Bearer tokens', () => {
    const message = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
    const result = sanitizeErrorMessage(message)
    expect(result).toBe('Authorization: Bearer [REDACTED]')
  })

  it('should redact Bearer tokens case-insensitively', () => {
    const message = 'bearer abc123token failed'
    const result = sanitizeErrorMessage(message)
    expect(result).toBe('Bearer [REDACTED] failed')
  })

  it('should redact token= query parameters', () => {
    const message = 'Failed to fetch: token=secretAccessToken123'
    const result = sanitizeErrorMessage(message)
    expect(result).toBe('Failed to fetch: token=[REDACTED]')
  })

  it('should redact token: style parameters', () => {
    const message = 'Error: token: mySecretToken456'
    const result = sanitizeErrorMessage(message)
    expect(result).toBe('Error: token=[REDACTED]')
  })

  it('should handle multiple tokens in same message', () => {
    const message =
      'Bearer abc123token failed for token=xyz789secret with refresh_token_abc123'
    const result = sanitizeErrorMessage(message)
    expect(result).toContain('Bearer [REDACTED]')
    expect(result).toContain('token=[REDACTED]')
    expect(result).toContain('[REDACTED]')
  })

  it('should preserve short strings that are not tokens', () => {
    const message = 'User john failed to authenticate'
    const result = sanitizeErrorMessage(message)
    expect(result).toBe('User john failed to authenticate')
  })

  it('should handle empty strings', () => {
    const result = sanitizeErrorMessage('')
    expect(result).toBe('')
  })

  it('should handle messages without sensitive data', () => {
    const message = 'Network timeout error'
    const result = sanitizeErrorMessage(message)
    expect(result).toBe('Network timeout error')
  })

  it('should redact JWT tokens', () => {
    const message =
      'Invalid JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'
    const result = sanitizeErrorMessage(message)
    expect(result).toBe('Invalid JWT: [REDACTED].[REDACTED].[REDACTED]')
  })

  it('should redact OAuth authorization codes', () => {
    const message =
      'OAuth code exchange failed: code=4/P7q7W91a-oMsCeLvIaQm6bTrgtp7'
    const result = sanitizeErrorMessage(message)
    expect(result).toContain('[REDACTED]')
  })
})
