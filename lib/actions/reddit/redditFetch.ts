/**
 * Unified fetch wrapper for Reddit API calls.
 *
 * Handles auth headers via {@link getRedditContext}, URL construction,
 * SSRF validation, raw_json=1 for GET requests, error classification
 * (401/403 to AuthenticationError, 404 to NotFoundError, 429 to
 * RateLimitError), and structured logging.
 */

import {getRedditContext} from '@/lib/auth/reddit-context'
import {logger} from '@/lib/axiom/server'
import {getEnvVar} from '@/lib/utils/env'
import {
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  RedditAPIError
} from '@/lib/utils/errors'
import {
  GENERIC_SERVER_ERROR,
  assertRedditUrl,
  getRequestMetadata
} from './_helpers'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Options for {@link redditFetch}.
 */
export interface RedditFetchOptions {
  /** HTTP method. Defaults to 'GET'. */
  method?: string
  /** Query parameters to merge into the URL. */
  searchParams?: Record<string, string>
  /** Next.js fetch cache configuration. */
  cache?: {
    /** Revalidation interval in seconds, or false to skip cache. */
    revalidate?: number | false
    /** Cache tags for on-demand revalidation. */
    tags?: string[]
  }
  /** Operation name for error context and logging. */
  operation: string
  /** Resource identifier for error context (e.g., subreddit name). */
  resource?: string
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Classify a non-OK response and throw the appropriate typed error.
 * Reads the error body, collects rate-limit headers, logs structured
 * diagnostics, and throws a domain-specific error subclass.
 */
async function classifyAndThrowError(
  response: Response,
  url: URL,
  method: string,
  operation: string,
  resource?: string
): Promise<never> {
  const errorBody = await response.text()

  const rateLimitHeaders = {
    remaining: response.headers.get('x-ratelimit-remaining'),
    used: response.headers.get('x-ratelimit-used'),
    reset: response.headers.get('x-ratelimit-reset'),
    retryAfter: response.headers.get('retry-after')
  }

  let requestMeta: Awaited<ReturnType<typeof getRequestMetadata>> | undefined
  try {
    requestMeta = await getRequestMetadata()
  } catch {
    // Outside a Next.js request context (e.g., tests)
  }

  logger.error(`Reddit API ${operation} failed`, {
    url: url.toString(),
    method,
    status: response.status,
    statusText: response.statusText,
    errorBody,
    rateLimitHeaders,
    redditUserAgent: getEnvVar('USER_AGENT'),
    ...requestMeta,
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
      throw new AuthenticationError('Authentication failed', operation, {
        resource,
        statusCode: response.status,
        userMessage: GENERIC_SERVER_ERROR
      })
    case 404:
      throw new NotFoundError(
        'Resource not found',
        operation,
        resource || 'unknown',
        {
          statusCode: response.status,
          userMessage: GENERIC_SERVER_ERROR
        }
      )
    case 429:
      throw new RateLimitError(
        'Rate limit exceeded',
        operation,
        retryAfterSeconds,
        {
          resource,
          statusCode: response.status,
          userMessage: GENERIC_SERVER_ERROR
        }
      )
    default:
      throw new RedditAPIError(
        GENERIC_SERVER_ERROR,
        operation,
        url.toString(),
        method,
        {resource},
        response.status
      )
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch data from the Reddit API with automatic auth, SSRF protection,
 * error classification, and structured logging.
 *
 * GET requests automatically include `raw_json=1` to avoid HTML entity
 * escaping. Auth headers and base URL are resolved via
 * {@link getRedditContext}.
 *
 * @param path - Relative URL path starting with '/' (e.g., '/r/popular/hot.json')
 * @param options - Fetch configuration including operation name and optional cache settings
 * @returns Parsed JSON response of type T
 * @throws {AuthenticationError} On 401/403 responses
 * @throws {NotFoundError} On 404 responses
 * @throws {RateLimitError} On 429 responses
 * @throws {RedditAPIError} On other non-OK responses
 */
export async function redditFetch<T>(
  path: string,
  options: RedditFetchOptions
): Promise<T> {
  const {method = 'GET', searchParams, cache, operation, resource} = options
  const context = await getRedditContext()

  const url = new URL(`${context.baseUrl}${path}`)
  assertRedditUrl(url.toString())

  // Auto-add raw_json=1 for GET requests to avoid HTML entity escaping
  if (method === 'GET') {
    url.searchParams.set('raw_json', '1')
  }

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value)
    }
  }

  const response = await fetch(url.toString(), {
    method,
    headers: context.headers,
    ...(cache && {
      next: {
        ...(cache.revalidate !== undefined && {revalidate: cache.revalidate}),
        ...(cache.tags && {tags: cache.tags})
      }
    })
  })

  if (!response.ok) {
    await classifyAndThrowError(response, url, method, operation, resource)
  }

  return response.json() as Promise<T>
}
