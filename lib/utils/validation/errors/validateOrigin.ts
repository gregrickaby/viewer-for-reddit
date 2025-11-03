import {logError} from '@/lib/utils/logging/logError'
import {NextRequest} from 'next/server'

/**
 * Security constants
 */
const MAX_HEADER_LENGTH = 2048
const LOCALHOST_PATTERN =
  /^https?:\/\/(localhost|127\.0\.0\.1|::1)(:\d+)?(\/.*)?$/

/**
 * Validates request origin to prevent CSRF attacks.
 *
 * **Validation Strategy (Production):**
 * 1. Allow localhost patterns (for Docker/CI/CD testing)
 * 2. Allow when both Origin AND Referer are missing (same-origin navigation)
 * 3. When headers present, validate against COOLIFY_FQDN (exact hostname match)
 * 4. Block all other requests with logging
 *
 * **Development Mode:**
 * - Bypasses all validation for faster development workflow
 *
 * **Why Allow Missing Headers?**
 * Browsers don't always send Origin/Referer headers for legitimate requests:
 * - Same-origin navigation (typing URL, bookmarks, direct links)
 * - Privacy-conscious browsers (Brave, Firefox strict mode)
 * - Certain HTTP methods (simple GET requests without CORS)
 * - Browser policies (referrer-policy: no-referrer)
 *
 * Blocking these would break normal user navigation flows.
 *
 * @param {NextRequest} request - The incoming request
 * @returns {boolean} True if allowed, false if blocked
 *
 * @security
 * - Prevents CSRF via origin validation
 * - Header length limiting prevents DoS attacks
 * - Validates both Origin and Referer (defense in depth)
 * - Exact hostname matching prevents subdomain attacks
 * - Logs security violations for monitoring
 *
 * @throws Never throws - handles all errors gracefully
 *
 * @example
 * // In API route
 * if (!validateOrigin(request)) {
 *   return NextResponse.json({error: 'Forbidden'}, {status: 403})
 * }
 */
export function validateOrigin(request: NextRequest): boolean {
  // Development mode: allow all origins
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  // Extract and sanitize headers (prevent DoS via length limiting)
  const rawOrigin = request.headers.get('origin')
  const rawReferer = request.headers.get('referer')
  const origin = rawOrigin?.slice(0, MAX_HEADER_LENGTH)
  const referer = rawReferer?.slice(0, MAX_HEADER_LENGTH)

  // Production validation starts here

  // Strategy 1: Allow localhost patterns (useful for production testing)
  if (isLocalhostOrigin(origin, referer)) {
    return true
  }

  // Strategy 2: Allow when BOTH headers are missing
  // This is critical for same-origin navigation where browsers don't send headers
  // SECURITY NOTE: This bypasses COOLIFY_FQDN enforcement when headers absent,
  // but this is intentional - blocking would break legitimate user navigation
  if (!origin && !referer) {
    return true
  }

  // Strategy 3: If headers ARE present, validate against COOLIFY_FQDN
  const coolifyFqdn = process.env.COOLIFY_FQDN
  if (coolifyFqdn && isCoolifyDomainAllowed(origin, referer, coolifyFqdn)) {
    return true
  }

  // Strategy 4: Block and log
  // If we reach here, headers were present but didn't match any allowed pattern
  logBlockedRequest(origin, referer, !!coolifyFqdn)
  return false
}

/**
 * Checks if origin/referer matches localhost patterns.
 * Supports: localhost, 127.0.0.1, ::1 with optional ports.
 *
 * @param origin - The Origin header value
 * @param referer - The Referer header value
 * @returns True if either matches localhost pattern
 */
function isLocalhostOrigin(
  origin: string | null | undefined,
  referer: string | null | undefined
): boolean {
  return (
    LOCALHOST_PATTERN.test(origin || '') ||
    LOCALHOST_PATTERN.test(referer || '')
  )
}

/**
 * Validates origin/referer against COOLIFY_FQDN environment variable.
 * Supports comma-separated domains for multi-domain deployments.
 * Uses exact hostname matching to prevent subdomain attacks.
 *
 * @param origin - The Origin header value
 * @param referer - The Referer header value
 * @param coolifyFqdn - Comma-separated list of allowed domains
 * @returns True if origin or referer matches an allowed domain
 */
function isCoolifyDomainAllowed(
  origin: string | null | undefined,
  referer: string | null | undefined,
  coolifyFqdn: string
): boolean {
  const originHost = parseHostname(origin)
  const refererHost = parseHostname(referer)

  // Parse comma-separated domains and trim whitespace
  const allowedDomains = new Set(
    coolifyFqdn
      .split(',')
      .map((domain) => domain.trim())
      .filter((domain) => domain.length > 0)
  )

  // Exact hostname match only - prevents subdomain attacks
  const isAllowedDomain = (host: string | null): boolean => {
    if (host === null) return false
    return allowedDomains.has(host)
  }

  return isAllowedDomain(originHost) || isAllowedDomain(refererHost)
}

/**
 * Safely extracts hostname from URL string.
 * Returns null for malformed URLs and logs the attempt.
 *
 * @param url - The URL string to parse
 * @returns Hostname or null if invalid
 */
function parseHostname(url: string | null | undefined): string | null {
  if (!url) return null

  try {
    return new URL(url).hostname
  } catch {
    // Log malformed URL attempts (potential attack)
    logError('Malformed URL in origin validation', {
      component: 'validateOrigin',
      action: 'parseHostname',
      malformedUrl: url.slice(0, 100) // Truncate for security
    })
    return null
  }
}

/**
 * Logs blocked request with full context for security monitoring.
 * Does not expose sensitive configuration values.
 *
 * @param origin - The Origin header value
 * @param referer - The Referer header value
 * @param hasCoolifyFqdn - Whether COOLIFY_FQDN is configured
 */
function logBlockedRequest(
  origin: string | null | undefined,
  referer: string | null | undefined,
  hasCoolifyFqdn: boolean
): void {
  logError('Request blocked: origin validation failed', {
    component: 'validateOrigin',
    action: 'validateOrigin',
    origin: origin || 'none',
    referer: referer || 'none',
    nodeEnv: process.env.NODE_ENV,
    hasCoolifyFqdn,
    reason: determineBlockReason(origin, referer, hasCoolifyFqdn)
  })
}

/**
 * Determines why request was blocked (for better debugging).
 *
 * @param origin - The Origin header value
 * @param referer - The Referer header value
 * @param hasCoolifyFqdn - Whether COOLIFY_FQDN is configured
 * @returns Human-readable reason for blocking
 */
function determineBlockReason(
  origin: string | null | undefined,
  referer: string | null | undefined,
  hasCoolifyFqdn: boolean
): string {
  if (!hasCoolifyFqdn) {
    return 'No COOLIFY_FQDN configured and not localhost'
  }
  if (origin && !referer) {
    return 'Origin present but does not match COOLIFY_FQDN'
  }
  if (referer && !origin) {
    return 'Referer present but does not match COOLIFY_FQDN'
  }
  return 'Both headers present but neither matches COOLIFY_FQDN'
}
