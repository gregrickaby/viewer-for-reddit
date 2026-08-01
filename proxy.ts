import {getSessionOptions} from '@/lib/auth/session'
import {logger} from '@/lib/datadog/server'
import {SessionData} from '@/lib/types/reddit'
import {getIronSession} from 'iron-session'
import {NextRequest, NextResponse} from 'next/server'

// Route prefixes that require authentication and are excluded from search
// indexing (subreddit feeds, user profiles, saved items/multireddits, search).
const PROTECTED_ROUTE_PREFIXES = ['/r/', '/u/', '/user/', '/search/'] as const

// Static public paths that are exact matches, not prefixes.
const PUBLIC_EXACT_PATHS = new Set([
  '/',
  '/about',
  '/donate',
  '/sitemap.xml',
  '/robots.txt',
  '/favicon.ico',
  '/manifest.webmanifest'
])

const API_PREFIX = '/api/'

/**
 * Check if a path requires authentication.
 * Public paths (about, donate, all API routes) do not require auth.
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_EXACT_PATHS.has(pathname) || pathname.startsWith(API_PREFIX)
}

/**
 * Check if a path is a protected content route (subreddit/user/search feeds)
 * that should be excluded from search indexing.
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

/**
 * Get session from request cookies for middleware context.
 * Parses the raw Cookie header into a format iron-session can consume.
 * Only reads cookies (set is a no-op since we don't modify sessions in middleware).
 */
async function getSessionFromRequest(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || ''
  const cookieEntries: Record<string, string> = {}
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key) {
      cookieEntries[key] = rest.join('=')
    }
  }

  const cookieStore = {
    get: (name: string) =>
      cookieEntries[name] !== undefined
        ? {name, value: cookieEntries[name]}
        : undefined,
    set: () => {}
  }

  return getIronSession(cookieStore as never, getSessionOptions()) as Promise<
    ReturnType<typeof getIronSession<SessionData>>
  >
}

/**
 * Proxy to enforce authentication and add security/SEO headers.
 *
 * Redirects unauthenticated users to /api/auth/login for protected routes.
 * Adds X-Robots-Tag headers to dynamic routes to prevent indexing.
 *
 * @see https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#xrobotstag
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const {pathname} = request.nextUrl

  // Auth enforcement: redirect unauthenticated users to login
  if (!isPublicPath(pathname)) {
    let hasValidSession = false

    try {
      const session = await getSessionFromRequest(request)
      hasValidSession = !!session.accessToken
    } catch (error) {
      // A corrupted/tampered session cookie fails decryption - treat it the
      // same as no session rather than letting the request 500.
      logger.error('Failed to read session in proxy', {
        error: error instanceof Error ? error.message : String(error),
        context: 'proxy',
        pathname
      })
    }

    if (!hasValidSession) {
      // Next.js Link prefetch requests are invisible to the user, but the
      // login redirect chains into a cross-origin Reddit OAuth URL, which
      // CSP's connect-src blocks for fetch-initiated requests (unlike full
      // navigations). Send prefetches to the public homepage instead so
      // they resolve same-origin with no CSP violation.
      const isPrefetch = request.headers.get('next-router-prefetch') === '1'
      const target = isPrefetch ? '/' : '/api/auth/login'
      return NextResponse.redirect(new URL(target, request.url))
    }
  }

  // Check if path is a dynamic route that should not be indexed
  if (isProtectedRoute(pathname) || pathname.startsWith(API_PREFIX)) {
    const response = NextResponse.next()
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return response
  }

  return NextResponse.next()
}

/**
 * Configure which routes the proxy runs on.
 * Using matcher for performance - only runs on specified paths.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}
