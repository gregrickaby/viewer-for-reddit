import 'server-only'
import * as z from 'zod'
import { env } from '@/lib/env'
import {
  RedditApiError,
  RedditAuthError,
  RedditForbiddenError,
  RedditNotFoundError,
  RedditRateLimitError,
  type ForbiddenReason,
} from './errors'
import { recordRateLimit, secondsUntilAllowed } from './rate-limit'

export type QueryValue = string | number | boolean | undefined | null

export type RedditRequest = {
  token: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  query?: Record<string, QueryValue>
  form?: Record<string, QueryValue>
  signal?: AbortSignal
}

const ForbiddenBody = z.object({ reason: z.string().optional() }).loose()

const FORBIDDEN_REASONS: Record<string, ForbiddenReason> = {
  private: 'private',
  quarantined: 'quarantined',
  banned: 'banned',
  gold_only: 'gold_only',
}

function toSearchParams(values: Record<string, QueryValue> = {}): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null) params.set(key, String(value))
  }
  return params
}

/**
 * The single place the app talks to oauth.reddit.com (docs/design.md §6).
 * Adds auth, the required User-Agent, and `raw_json=1` (so strings aren't HTML-escaped),
 * enforces the rate-limit budget, and maps failures to typed errors. Returns parsed JSON as
 * `unknown`: callers must validate it with a schema.
 */
export async function redditFetch(path: string, request: RedditRequest): Promise<unknown> {
  const { token, method = 'GET', query, form, signal } = request

  const wait = secondsUntilAllowed()
  if (wait > 0) throw new RedditRateLimitError(wait)

  const url = new URL(path, env.REDDIT_API_BASE)
  const params = toSearchParams(query)
  params.set('raw_json', '1')
  url.search = params.toString()

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': env.USER_AGENT,
      Accept: 'application/json',
      ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: form ? toSearchParams(form) : undefined,
    cache: 'no-store',
    redirect: 'manual',
    signal,
  })

  recordRateLimit(response.headers)

  if (response.status === 401) throw new RedditAuthError()
  if (response.status === 404) throw new RedditNotFoundError()
  if (response.status === 429) {
    const reset = Number.parseFloat(response.headers.get('x-ratelimit-reset') ?? '')
    throw new RedditRateLimitError(Number.isFinite(reset) ? Math.ceil(reset) : 60)
  }
  if (response.status === 403) {
    const body = ForbiddenBody.safeParse(await response.json().catch(() => ({})))
    const reason =
      (body.success && body.data.reason && FORBIDDEN_REASONS[body.data.reason]) || 'unknown'
    throw new RedditForbiddenError(reason)
  }
  // Reddit redirects banned/nonexistent subreddits to HTML pages instead of 404ing.
  if (response.status >= 300 && response.status < 400) {
    if (method === 'GET') throw new RedditNotFoundError()
    throw new RedditApiError(`Unexpected redirect from ${path}`, response.status)
  }
  if (!response.ok) {
    throw new RedditApiError(`Reddit returned ${response.status} for ${path}`, response.status)
  }

  const text = await response.text()
  if (text === '') return {}
  try {
    return JSON.parse(text) as unknown
  } catch {
    if (method === 'GET') throw new RedditNotFoundError()
    throw new RedditApiError(`Non-JSON response from ${path}`, response.status)
  }
}
