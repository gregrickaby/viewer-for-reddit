import {logger} from '@/lib/datadog/server'
import {withCircuitBreaker} from '@/lib/utils/circuit-breaker'
import {headers} from 'next/headers'

export const GENERIC_SERVER_ERROR = 'Something went wrong.'
export const GENERIC_ACTION_ERROR = 'Something went wrong. Please try again.'
export const UNAUTHORIZED_ERROR = 'You must be logged in to search.'

// Allowed domains for SSRF prevention
const ALLOWED_REDDIT_DOMAINS = new Set(['oauth.reddit.com', 'reddit.com'])

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
 * Thrown by {@link circuitProtectedFetch} when a Reddit response indicates
 * upstream trouble (429 or 5xx), carrying the original {@link Response} so
 * callers can still classify and log it. Counts as a circuit breaker
 * failure; 401/403/404 responses do not, they prove Reddit answered fine.
 */
export class UpstreamStatusError extends Error {
  public readonly response: Response

  constructor(response: Response) {
    super(`Reddit upstream error: ${response.status}`)
    this.name = 'UpstreamStatusError'
    this.response = response
  }
}

/**
 * Drop-in replacement for `fetch()` at Reddit API call sites. Runs the
 * request through the shared circuit breaker, throwing
 * {@link UpstreamStatusError} on 429/5xx so those responses count as
 * breaker failures. Any other response, including 401/403/404, returns
 * normally.
 *
 * @param url - Fully qualified Reddit API URL
 * @param init - Standard fetch options
 * @returns The fetch Response, for any status other than 429/5xx
 * @throws {UpstreamStatusError} On 429 or 5xx responses
 * @throws {CircuitOpenError} When the circuit breaker is open
 */
export async function circuitProtectedFetch(
  url: string | URL,
  init?: RequestInit
): Promise<Response> {
  return withCircuitBreaker(async () => {
    const response = await fetch(url, init)
    if (response.status === 429 || response.status >= 500) {
      throw new UpstreamStatusError(response)
    }
    return response
  })
}

/**
 * Log a failed manual-fetch response with a consistent shape. Used by the
 * manual-fetch mutation/read call sites that report failure via a return
 * value or a locally-caught throw instead of a typed error (see
 * {@link redditFetch}'s classifyAndThrowError for the typed-error path).
 *
 * @param response - The non-OK Response to log
 * @param url - The request URL
 * @param method - The HTTP method used
 * @param context - Operation name for logging
 * @param extra - Additional fields to merge into the log entry
 */
export async function logFailedResponse(
  response: Response,
  url: string,
  method: string,
  context: string,
  extra: Record<string, unknown> = {}
): Promise<void> {
  const errorBody = await response.text()
  logger.error(`${context} request failed`, {
    url,
    method,
    status: response.status,
    statusText: response.statusText,
    errorBody,
    context,
    ...extra
  })
}

/**
 * Capture incoming request metadata for debugging.
 * Helps identify which clients (e.g., Googlebot) are making requests.
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
