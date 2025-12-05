import {logError} from '@/lib/utils/logging/logError'
import {NextRequest, NextResponse} from 'next/server'
import crypto from 'node:crypto'

/**
 * In-memory rate limiting store.
 * Maps identifier to array of timestamps.
 */
const rateLimitStore = new Map<string, number[]>()

/**
 * Unique instance identifier to detect multiple running instances.
 * Generated once per process start using cryptographically secure random.
 */
const INSTANCE_ID = crypto.randomBytes(3).toString('hex')

/**
 * Rate limit configuration.
 * Different limits for different types of clients:
 * - Human users: 200 requests/minute
 * - Search engine bots: 30 requests/minute (throttled but not blocked)
 * - Aggressive/unknown bots: 10 requests/minute
 * - Development: Higher limits for local testing
 */
const RATE_LIMIT = {
  HUMAN: process.env.NODE_ENV === 'development' ? 1000 : 200,
  SEARCH_BOT: process.env.NODE_ENV === 'development' ? 1000 : 30,
  AGGRESSIVE_BOT: process.env.NODE_ENV === 'development' ? 1000 : 10,
  WINDOW_MS: 60 * 1000 // 1 minute
}

/**
 * Homepage-related API paths that search bots are allowed unlimited access to.
 * These paths serve the main landing page content and should never cause soft 404s.
 * Patterns must match paths that the homepage fetches for its content.
 */
const HOMEPAGE_PATH_PATTERNS = [
  /^\/r\/all\/(hot|new|top|best)\.json/, // Homepage default: r/all
  /^\/popular/, // Popular endpoint
  /^\/hot\.json/, // Root hot endpoint
  /^\/best\.json/ // Root best endpoint
]

/**
 * Check if the request path is for homepage content.
 * Homepage paths should be exempt from rate limiting for search bots.
 */
export function isHomepagePath(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const path = urlObj.searchParams.get('path') || ''
    return HOMEPAGE_PATH_PATTERNS.some((pattern) => pattern.test(path))
  } catch {
    return false
  }
}

/**
 * Detect if request is from a search engine bot.
 * Returns 'search' for known search engines, 'aggressive' for unknown bots, 'human' otherwise.
 */
export function detectBotType(
  userAgent: string
): 'search' | 'aggressive' | 'human' {
  const ua = userAgent.toLowerCase()

  // Known search engine bots (throttle but allow)
  const searchBots = [
    'googlebot',
    'bingbot',
    'slurp', // Yahoo
    'duckduckbot',
    'baiduspider',
    'yandexbot',
    'sogou',
    'exabot',
    'facebot', // Facebook
    'ia_archiver', // Alexa
    'applebot',
    'twitterbot',
    'linkedinbot',
    'discordbot',
    'whatsapp',
    'telegrambot'
  ]

  if (searchBots.some((bot) => ua.includes(bot))) {
    return 'search'
  }

  // Aggressive or unknown bots (heavily throttle)
  const botIndicators = ['bot', 'crawler', 'spider', 'scraper', 'curl', 'wget']
  if (botIndicators.some((indicator) => ua.includes(indicator))) {
    return 'aggressive'
  }

  return 'human'
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
 * Applies different limits based on client type:
 * - Human users: 200 requests/minute
 * - Search engine bots: 30 requests/minute (throttled but functional)
 * - Aggressive/unknown bots: 10 requests/minute
 * Returns null if allowed, NextResponse if rate limited.
 */
export async function checkRateLimit(
  request: NextRequest,
  identifier?: string
): Promise<NextResponse | null> {
  // Detect bot type from User-Agent
  const userAgent = request.headers.get('user-agent') || ''
  const botType = detectBotType(userAgent)

  // Allow search engine bots unlimited access to homepage content
  // This prevents Google soft 404 errors on the main landing page
  if (botType === 'search' && isHomepagePath(request.url)) {
    return null
  }

  // Select rate limit based on client type
  let maxRequests = RATE_LIMIT.HUMAN
  if (botType === 'search') {
    maxRequests = RATE_LIMIT.SEARCH_BOT
  } else if (botType === 'aggressive') {
    maxRequests = RATE_LIMIT.AGGRESSIVE_BOT
  }

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
  if (validTimestamps.length >= maxRequests) {
    const oldestTimestamp = validTimestamps[0]
    const resetTime = oldestTimestamp + RATE_LIMIT.WINDOW_MS
    const retryAfter = Math.ceil((resetTime - now) / 1000)

    logError('Rate limit exceeded', {
      component: 'RateLimit',
      action: 'checkRateLimit',
      identifier: id,
      botType,
      userAgent,
      maxRequests,
      instanceId: INSTANCE_ID, // Track which instance handled this request
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
