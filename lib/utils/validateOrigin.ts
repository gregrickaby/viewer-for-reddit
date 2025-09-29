import {logError} from '@/lib/utils/logError'
import {NextRequest} from 'next/server'

// Limit header length to prevent DoS attacks
const MAX_HEADER_LENGTH = 2048

/**
 * Validates that the request comes from an allowed origin to prevent CSRF attacks.
 *
 * **Development vs Production Behavior:**
 * - **Development**: Allows all origins for faster development workflow
 * - **Production**: Strict origin validation with security controls
 *
 * Security Features:
 * - Validates both Origin and Referer headers for defense in depth
 * - Uses exact hostname matching to prevent subdomain attacks
 * - Sanitizes inputs to prevent header injection attacks
 * - Implements secure localhost detection for production testing
 *
 * @param {NextRequest} request - The incoming request object
 * @returns {boolean} True if origin is allowed, false if blocked
 *
 * @security
 * - Prevents CSRF attacks by validating request origin
 * - Blocks malicious requests from unauthorized domains
 * - Logs security violations for monitoring
 * - Development mode bypasses validation for DX
 *
 * @throws Never throws - handles all errors gracefully
 */
export function validateOrigin(request: NextRequest): boolean {
  const rawOrigin = request.headers.get('origin')
  const rawReferer = request.headers.get('referer')
  const origin = rawOrigin?.slice(0, MAX_HEADER_LENGTH)
  const referer = rawReferer?.slice(0, MAX_HEADER_LENGTH)

  /**
   * Safe URL hostname extraction with error handling
   */
  const parseHostname = (url: string | null | undefined): string | null => {
    if (!url) return null
    try {
      return new URL(url).hostname
    } catch {
      // Log malformed URL attempts
      logError('Malformed URL in origin validation', {
        component: 'validateOrigin',
        action: 'parseHostname',
        malformedUrl: url.slice(0, 100) // Truncate for logging
      })
      return null
    }
  }

  // Development mode allows all origins for easier development
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  // Production mode allows specific localhost patterns only
  // (useful for Docker, CI/CD, local production testing)
  const localhostPattern =
    /^https?:\/\/(localhost|127\.0\.0\.1|::1)(:\d+)?(\/.*)?$/
  const isLocalhost =
    localhostPattern.test(origin || '') || localhostPattern.test(referer || '')

  if (isLocalhost) {
    return true
  }

  // For Coolify deployments, use COOLIFY_FQDN if available
  // Supports comma-separated domains: "domain1.com,domain2.com"
  const coolifyFqdn = process.env.COOLIFY_FQDN
  if (coolifyFqdn) {
    const originHost = parseHostname(origin)
    const refererHost = parseHostname(referer)

    // Parse comma-separated domains and trim whitespace
    const allowedDomains = coolifyFqdn
      .split(',')
      .map(domain => domain.trim())
      .filter(domain => domain.length > 0)

    // Exact hostname match only - prevents subdomain attacks
    const isAllowedCoolifyDomain = (host: string | null) =>
      host !== null && allowedDomains.includes(host)

    if (
      isAllowedCoolifyDomain(originHost) ||
      isAllowedCoolifyDomain(refererHost)
    ) {
      return true
    }
  }

  // Log blocked request without exposing sensitive config
  logError('Request blocked due to invalid origin', {
    component: 'validateOrigin',
    action: 'validateOrigin',
    origin: origin || 'none',
    referer: referer || 'none',
    nodeEnv: process.env.NODE_ENV,
    hasCoolifyFqdn: !!coolifyFqdn
  })
  return false
}
