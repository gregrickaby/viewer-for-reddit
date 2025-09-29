/**
 * Utility for sanitizing URLs to remove sensitive information before logging
 */

// Common sensitive query parameter names that should be removed
const SENSITIVE_PARAMS = [
  'token',
  'access_token',
  'auth_token',
  'api_key',
  'key',
  'secret',
  'password',
  'pwd',
  'auth',
  'authorization',
  'session',
  'sessionid',
  'sid',
  'csrf',
  'csrf_token',
  'client_secret',
  'client_id', // Reddit client ID should not be logged
  'code', // OAuth authorization codes
  'state', // OAuth state parameters
  'refresh_token',
  'id_token'
]

/**
 * Sanitizes a URL by removing sensitive query parameters before logging.
 *
 * Removes potentially sensitive information from URLs including tokens, API keys,
 * passwords, session IDs, and OAuth-related parameters. This prevents accidental
 * exposure of sensitive data in logs, error reports, or analytics.
 *
 * @param url - The URL string to sanitize
 * @returns The sanitized URL with sensitive parameters removed
 *
 * @example
 * ```typescript
 * const cleanUrl = sanitizeUrl('https://api.example.com?token=secret&page=1')
 * // Returns: 'https://api.example.com?page=1'
 * ```
 *
 * @security
 * - Removes sensitive parameters like tokens, API keys, passwords
 * - Uses case-insensitive matching to catch variations
 * - Returns safe fallback '[INVALID_URL]' for malformed URLs
 *
 * @throws Never throws - handles malformed URLs gracefully
 */
export function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url)

    // Get all existing parameter names to check against sensitive list
    const existingParams = Array.from(urlObj.searchParams.keys())

    // Remove parameters that match sensitive names (case-insensitive)
    existingParams.forEach((param) => {
      const paramLower = param.toLowerCase()
      if (
        SENSITIVE_PARAMS.some(
          (sensitive) => sensitive.toLowerCase() === paramLower
        )
      ) {
        urlObj.searchParams.delete(param)
      }
    })

    // Clean up empty query string
    const result = urlObj.toString()
    return result.endsWith('?') ? result.slice(0, -1) : result
  } catch (error) {
    // If URL parsing fails, return a safe fallback
    console.warn('Failed to parse URL for sanitization:', url, error)
    return '[INVALID_URL]'
  }
}

/**
 * Sanitizes location object properties that may contain sensitive information.
 *
 * Processes browser location objects or similar data structures to remove
 * sensitive query parameters while preserving the overall structure and
 * non-sensitive location information.
 *
 * @param location - Browser location object or similar with URL properties
 * @returns Sanitized location data with sensitive parameters removed
 *
 * @example
 * ```typescript
 * const cleanLocation = sanitizeLocationData(window.location)
 * // Returns location object with sanitized href and search properties
 * ```
 *
 * @security
 * - Sanitizes href and search properties using sanitizeUrl/sanitizeQueryString
 * - Preserves hash fragments (client-side only, not sent to server)
 * - Maintains all other location properties unchanged
 */
export function sanitizeLocationData(location: {
  pathname?: string
  search?: string
  hash?: string
  href?: string
  origin?: string
  host?: string
  hostname?: string
  port?: string
  protocol?: string
}) {
  return {
    pathname: location.pathname,
    search: location.search
      ? sanitizeQueryString(location.search)
      : location.search,
    hash: location.hash, // Hash fragments are not sent to server, generally safe
    href: location.href ? sanitizeUrl(location.href) : location.href,
    origin: location.origin,
    host: location.host,
    hostname: location.hostname,
    port: location.port,
    protocol: location.protocol
  }
}

/**
 * Sanitizes a query string by removing sensitive parameters.
 *
 * Internal helper function that processes query strings to remove sensitive
 * parameters while preserving the query string format. Handles both formats
 * with and without leading question mark.
 *
 * @param queryString - Query string to sanitize (with or without leading ?)
 * @returns Sanitized query string with leading ? if parameters remain
 *
 * @example
 * ```typescript
 * const clean = sanitizeQueryString('?token=secret&page=1')
 * // Returns: '?page=1'
 * ```
 *
 * @internal This is a private helper function for URL sanitization
 *
 * @throws Never throws - handles malformed query strings gracefully
 */
function sanitizeQueryString(queryString: string): string {
  try {
    const params = new URLSearchParams(queryString)

    // Get all existing parameter names to check against sensitive list
    const existingParams = Array.from(params.keys())

    // Remove parameters that match sensitive names (case-insensitive)
    existingParams.forEach((param) => {
      const paramLower = param.toLowerCase()
      if (
        SENSITIVE_PARAMS.some(
          (sensitive) => sensitive.toLowerCase() === paramLower
        )
      ) {
        params.delete(param)
      }
    })

    const sanitized = params.toString()
    return sanitized ? `?${sanitized}` : ''
  } catch (error) {
    console.warn(
      'Failed to parse query string for sanitization:',
      queryString,
      error
    )
    return '[INVALID_QUERY]'
  }
}
