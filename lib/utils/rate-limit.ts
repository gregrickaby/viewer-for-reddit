/**
 * Minimal in-memory rate limiter.
 *
 * Per-process, fixed-window counting - fine for this app's current
 * single-instance deployment. If this ever runs as multiple instances
 * behind a load balancer, each instance would track its own counts;
 * swap the Map for a shared store (e.g. Redis) at that point.
 */

interface RateLimitBucket {
  count: number
  resetAt: number
}

interface RateLimitOptions {
  /** Max requests allowed within the window. */
  limit: number
  /** Window duration in milliseconds. */
  windowMs: number
}

interface RateLimitResult {
  /** Whether the request is within the limit. */
  allowed: boolean
  /** Seconds until the window resets, for a Retry-After header. Zero when allowed. */
  retryAfterSeconds: number
}

const buckets = new Map<string, RateLimitBucket>()

/**
 * Drops expired buckets so long-running processes don't accumulate one
 * entry per distinct client forever.
 */
function sweepExpiredBuckets(): void {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

const SWEEP_INTERVAL_MS = 10 * 60 * 1000
const sweepInterval = setInterval(sweepExpiredBuckets, SWEEP_INTERVAL_MS)
sweepInterval.unref()

/**
 * Fixed-window rate limit check. Call once per request with a key that
 * identifies the caller, e.g. `` `login:${ip}` ``.
 *
 * @param key - Unique bucket identifier
 * @param options - Limit and window configuration
 * @returns Whether the request is allowed, and retry-after seconds if not
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, {count: 1, resetAt: now + options.windowMs})
    return {allowed: true, retryAfterSeconds: 0}
  }

  bucket.count += 1

  if (bucket.count > options.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000)
    }
  }

  return {allowed: true, retryAfterSeconds: 0}
}

/**
 * Extracts the originating client IP from request headers, preferring the
 * first hop in `X-Forwarded-For` (set by the reverse proxy) and falling
 * back to `X-Real-Ip`. Returns `'unknown'` when neither header is present,
 * which still rate-limits (as a single shared bucket) rather than throwing.
 *
 * @param requestHeaders - Headers from the incoming request
 * @returns Best-effort client IP, or `'unknown'`
 */
export function getClientIp(requestHeaders: Pick<Headers, 'get'>): string {
  const forwardedFor = requestHeaders.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }
  return requestHeaders.get('x-real-ip') || 'unknown'
}

/**
 * Test-only hook: clears all rate limit state between tests.
 */
export function resetRateLimitsForTests(): void {
  buckets.clear()
}

/**
 * Test-only hook: runs the expired-bucket sweep on demand instead of
 * waiting for the real interval.
 */
export function runSweepForTests(): void {
  sweepExpiredBuckets()
}

/**
 * Test-only hook: number of tracked buckets, to verify the sweep worked.
 */
export function getBucketCountForTests(): number {
  return buckets.size
}
