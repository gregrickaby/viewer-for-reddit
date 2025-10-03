import {NextResponse} from 'next/server'

/**
 * Helper utilities for creating HTTP redirects with proper headers.
 */

/**
 * Create a redirect response with proper cache control headers.
 * Prevents sensitive authentication data from being cached by CDN/proxies.
 *
 * @param url - URL to redirect to
 * @returns NextResponse redirect with cache prevention headers
 *
 * @example
 * ```typescript
 * const response = createUncachedRedirect(new URL('/', 'https://example.com'))
 * return response
 * ```
 *
 * @security
 * - Sets Cache-Control to prevent caching
 * - Sets Pragma for HTTP/1.0 compatibility
 * - Sets Expires to prevent browser caching
 * - Critical for OAuth redirects and sensitive flows
 */
export function createUncachedRedirect(url: URL): NextResponse {
  const response = NextResponse.redirect(url)

  response.headers.set(
    'Cache-Control',
    'private, no-cache, no-store, must-revalidate'
  )
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  return response
}
