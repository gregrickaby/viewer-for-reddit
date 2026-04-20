import {getValidAccessToken} from '@/lib/actions/auth'
import {logger} from '@/lib/axiom/server'
import {getSession} from '@/lib/auth/session'
import {REDDIT_API_URL, REDDIT_PUBLIC_API_URL} from '@/lib/utils/constants'
import {getEnvVar} from '@/lib/utils/env'
import {
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  RedditAPIError
} from '@/lib/utils/errors'
import {headers} from 'next/headers'

export const GENERIC_SERVER_ERROR = 'Something went wrong.'
export const GENERIC_ACTION_ERROR = 'Something went wrong. Please try again.'

// Internal error messages for logging (more specific)
const RATE_LIMIT_ERROR = 'Rate limit exceeded'
const AUTH_ERROR = 'Authentication failed'
const NOT_FOUND_ERROR = 'Resource not found'

// Allowed domains for SSRF prevention
const ALLOWED_REDDIT_DOMAINS = new Set([
  'oauth.reddit.com',
  'www.reddit.com',
  'reddit.com'
])

/**
 * Validates that a URL is pointing to an allowed Reddit domain.
 * Prevents SSRF attacks by ensuring we only make requests to Reddit's API.
 */
export function validateRedditUrl(url: string): void {
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
      context: 'validateRedditUrl'
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
 */
export async function getRequestMetadata() {
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

/**
 * Handles Reddit API error responses with enhanced error context.
 */
export async function handleFetchError(
  response: Response,
  url: URL,
  operation: string,
  resource: string
): Promise<never> {
  const errorBody = await response.text()

  const rateLimitHeaders = {
    remaining: response.headers.get('x-ratelimit-remaining'),
    used: response.headers.get('x-ratelimit-used'),
    reset: response.headers.get('x-ratelimit-reset'),
    retryAfter: response.headers.get('retry-after')
  }

  const requestMetadata = await getRequestMetadata()

  logger.error(`Reddit API ${operation} failed`, {
    url: url.toString(),
    method: 'GET',
    status: response.status,
    statusText: response.statusText,
    errorBody,
    rateLimitHeaders,
    redditUserAgent: getEnvVar('USER_AGENT'),
    clientUserAgent: requestMetadata.clientUserAgent,
    clientIp: requestMetadata.clientIp,
    referer: requestMetadata.referer,
    context: operation,
    resource
  })

  const retryAfter = response.headers.get('retry-after')
  const retryAfterSeconds = retryAfter
    ? Number.parseInt(retryAfter, 10)
    : undefined

  switch (response.status) {
    case 401:
    case 403:
      throw new AuthenticationError(AUTH_ERROR, operation, {
        resource,
        statusCode: response.status,
        userMessage: GENERIC_SERVER_ERROR
      })
    case 404:
      throw new NotFoundError(NOT_FOUND_ERROR, operation, resource, {
        statusCode: response.status,
        userMessage: GENERIC_SERVER_ERROR
      })
    case 429:
      throw new RateLimitError(RATE_LIMIT_ERROR, operation, retryAfterSeconds, {
        resource,
        statusCode: response.status,
        userMessage: GENERIC_SERVER_ERROR
      })
    default:
      throw new RedditAPIError(
        GENERIC_SERVER_ERROR,
        operation,
        url.toString(),
        'GET',
        {resource},
        response.status
      )
  }
}

/**
 * Enriched context returned by getHeaders().
 * Callers that only need headers and baseUrl can ignore the extra fields.
 */
export interface RequestContext {
  /** HTTP headers to pass to fetch(), including Authorization if authenticated. */
  headers: HeadersInit
  /** Reddit API base URL — oauth.reddit.com when authenticated, www.reddit.com otherwise. */
  baseUrl: string
  /** True when a valid access token was found (after any needed refresh). */
  isAuthenticated: boolean
  /** Authenticated username, or null for anonymous sessions. */
  username: string | null
}

/**
 * Create HTTP headers for Reddit API requests and return enriched request context.
 * Reads the session exactly once, passes it to getValidAccessToken to avoid a
 * redundant iron-session decryption, and returns isAuthenticated + username so
 * callers do not need to call getSession() independently.
 *
 * @returns Promise resolving to RequestContext with headers, baseUrl, isAuthenticated, and username
 */
export async function getHeaders(): Promise<RequestContext> {
  const session = await getSession()

  const requestHeaders: HeadersInit = {
    'User-Agent': getEnvVar('USER_AGENT')
  }

  const accessToken = await getValidAccessToken(session)
  const isAuthenticated = !!accessToken
  const username = session.username || null

  if (accessToken) {
    requestHeaders.Authorization = `Bearer ${accessToken}`
    return {
      headers: requestHeaders,
      baseUrl: REDDIT_API_URL,
      isAuthenticated,
      username
    }
  }

  return {
    headers: requestHeaders,
    baseUrl: REDDIT_PUBLIC_API_URL,
    isAuthenticated,
    username
  }
}
