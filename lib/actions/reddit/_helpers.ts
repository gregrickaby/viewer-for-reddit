import {logger} from '@/lib/axiom/server'
import {headers} from 'next/headers'

export const GENERIC_SERVER_ERROR = 'Something went wrong.'
export const GENERIC_ACTION_ERROR = 'Something went wrong. Please try again.'

// Allowed domains for SSRF prevention
const ALLOWED_REDDIT_DOMAINS = new Set([
  'oauth.reddit.com',
  'www.reddit.com',
  'reddit.com'
])

/**
 * Validate that a URL points to an allowed Reddit domain.
 * Prevents SSRF attacks by ensuring requests only go to Reddit's API.
 *
 * @param url - Fully qualified URL string to validate
 * @throws Error if the URL is malformed, targets a disallowed host, or uses a non-HTTPS protocol
 */
export function assertRedditUrl(url: string): void {
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    throw new Error('Invalid URL format')
  }

  if (!ALLOWED_REDDIT_DOMAINS.has(parsedUrl.hostname)) {
    logger.error('SSRF attempt detected', {
      attemptedUrl: url,
      hostname: parsedUrl.hostname,
      context: 'assertRedditUrl'
    })
    throw new Error('Invalid request destination')
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new Error('Invalid protocol - HTTPS required')
  }
}

/**
 * Capture incoming request metadata for debugging.
 * Helps identify which clients (e.g., Googlebot) are hitting rate limits.
 *
 * @returns Promise resolving to client user-agent, IP, and referer
 */
export async function getRequestMetadata(): Promise<{
  clientUserAgent: string
  clientIp: string
  referer: string
}> {
  const headersList = await headers()
  return {
    clientUserAgent: headersList.get('user-agent') || 'unknown',
    clientIp:
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      'unknown',
    referer: headersList.get('referer') || 'none'
  }
}
