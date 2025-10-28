/**
 * Utility for sanitizing error messages to prevent token leakage in logs.
 * Removes sensitive data like JWT tokens, OAuth tokens, and API keys.
 */

/**
 * Sanitize error messages to prevent token leakage in logs.
 * Removes anything that looks like a JWT, OAuth token, or other sensitive data.
 *
 * @param message - Error message to sanitize
 * @returns Sanitized error message with sensitive data redacted
 *
 * @example
 * ```typescript
 * const safe = sanitizeErrorMessage('Bearer abc123token failed')
 * // Returns: 'Bearer [REDACTED] failed'
 * ```
 *
 * @security
 * - Redacts tokens (20+ character alphanumeric strings)
 * - Redacts Bearer tokens in Authorization headers
 * - Redacts query parameters with "token" in the name
 */
export function sanitizeErrorMessage(message: string): string {
  return message
    .replaceAll(/[A-Za-z0-9-_]{20,}/g, '[REDACTED]')
    .replaceAll(/Bearer\s+\S+/gi, 'Bearer [REDACTED]')
    .replaceAll(/token[=:]\s*\S+/gi, 'token=[REDACTED]')
}
