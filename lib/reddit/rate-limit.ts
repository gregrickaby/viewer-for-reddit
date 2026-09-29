import 'server-only'

/*
 * Reddit allows ~100 requests/minute per OAuth client, shared by every user of
 * this app (docs/design.md §6, R2). We track the budget Reddit reports on each
 * response and fail fast instead of burning requests into a 429.
 */

/** Stop issuing requests when fewer than this many remain in the window. */
export const MIN_REMAINING = 5

type Budget = { remaining: number; resetAt: number }

let budget: Budget | null = null

/** Record `X-Ratelimit-Remaining` / `X-Ratelimit-Reset` (seconds until reset). */
export function recordRateLimit(headers: Headers, now = Date.now()): void {
  const remaining = Number.parseFloat(headers.get('x-ratelimit-remaining') ?? '')
  const reset = Number.parseFloat(headers.get('x-ratelimit-reset') ?? '')
  if (Number.isFinite(remaining) && Number.isFinite(reset)) {
    budget = { remaining, resetAt: now + reset * 1000 }
  }
}

/** Seconds to wait before the next request, or 0 if we're clear to send. */
export function secondsUntilAllowed(now = Date.now()): number {
  if (!budget || budget.remaining >= MIN_REMAINING || budget.resetAt <= now) return 0
  return Math.ceil((budget.resetAt - now) / 1000)
}

/** Test hook. */
export function resetRateLimit(): void {
  budget = null
}
