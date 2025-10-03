import {logError} from '@/lib/utils/logError'
import {NextRequest, NextResponse} from 'next/server'

/**
 * In-memory rate limiting store.
 * Maps identifier to array of timestamps.
 */
const rateLimitStore = new Map<string, number[]>()

/**
 * Rate limit configuration.
 * Production: 200 requests per minute
 * Development: Higher limits for local testing
 */
const RATE_LIMIT = {
  MAX_REQUESTS: process.env.NODE_ENV === 'development' ? 1000 : 200,
  WINDOW_MS: 60 * 1000 // 1 minute
}

/**
 * Clean up old entries from rate limit store.
 */
export function cleanupRateLimitStore() {
  const now = Date.now()
  for (const [key, timestamps] of rateLimitStore.entries()) {
    const validTimestamps = timestamps.filter(
      (ts) => now - ts < RATE_LIMIT.WINDOW_MS
    )
    if (validTimestamps.length === 0) {
      rateLimitStore.delete(key)
    } else {
      rateLimitStore.set(key, validTimestamps)
    }
  }
}

// Clean up old entries every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000)

/**
 * Apply in-memory rate limiting to a request.
 * Production: 100 requests per minute per IP
 * Development: 1000 requests per minute per IP
 * Returns null if allowed, NextResponse if rate limited.
 */
export async function checkRateLimit(
  request: NextRequest,
  identifier?: string
): Promise<NextResponse | null> {
  // Use provided identifier or fall back to IP from headers
  const id = identifier || request.headers.get('x-forwarded-for') || 'anonymous'
  const now = Date.now()

  // Get existing timestamps for this identifier
  const timestamps = rateLimitStore.get(id) || []

  // Filter to only include timestamps within the window
  const validTimestamps = timestamps.filter(
    (ts) => now - ts < RATE_LIMIT.WINDOW_MS
  )

  // Check if rate limit exceeded
  if (validTimestamps.length >= RATE_LIMIT.MAX_REQUESTS) {
    const oldestTimestamp = validTimestamps[0]
    const resetTime = oldestTimestamp + RATE_LIMIT.WINDOW_MS
    const retryAfter = Math.ceil((resetTime - now) / 1000)

    logError('Rate limit exceeded', {
      component: 'RateLimit',
      action: 'checkRateLimit',
      identifier: id,
      remaining: 0,
      resetAt: new Date(resetTime).toISOString()
    })

    return NextResponse.json(
      {
        error: 'rate_limit_exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(resetTime)
        }
      }
    )
  }

  // Add current timestamp and update store
  validTimestamps.push(now)
  rateLimitStore.set(id, validTimestamps)

  return null
}
