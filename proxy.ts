import {SessionData} from '@/lib/types/reddit'
import {getIronSession, SessionOptions} from 'iron-session'
import {logger} from '@/lib/datadog/server'
import {type NextFetchEvent, NextRequest, NextResponse} from 'next/server'

const SESSION_OPTIONS: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'reddit_viewer_session'
}

/**
 * Check if a path requires authentication.
 * Public paths (about, donate, all API routes) do not require auth.
 */
function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/about' ||
    pathname === '/donate' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/api/')
  )
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

  return getIronSession(cookieStore as never, SESSION_OPTIONS) as Promise<
    ReturnType<typeof getIronSession<SessionData>>
  >
}

/**
 * Build structured log fields for an incoming request.
 */
function buildRequestLogFields(request: NextRequest): Record<string, unknown> {
  return {
    method: request.method,
    path: request.nextUrl.pathname,
    search: request.nextUrl.search,
    userAgent: request.headers.get('user-agent') || 'unknown',
    referer: request.headers.get('referer') || 'none'
  }
}

/**
 * Proxy to enforce authentication and add security/SEO headers.
 *
 * Redirects unauthenticated users to /api/auth/login for protected routes.
 * Adds X-Robots-Tag headers to dynamic routes to prevent indexing.
 *
 * @see https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#xrobotstag
 */
export async function proxy(
  request: NextRequest,
  event?: NextFetchEvent
): Promise<NextResponse> {
  const {pathname} = request.nextUrl

  // Auth enforcement: redirect unauthenticated users to login
  if (!isPublicPath(pathname)) {
    const session = await getSessionFromRequest(request)

    if (!session.accessToken) {
      return NextResponse.redirect(new URL('/api/auth/login', request.url))
    }
  }

  const isNoiseRoute = pathname.startsWith('/api/health')

  if (!isNoiseRoute) {
    const logPromise = logger.info('request', buildRequestLogFields(request))
    if (event) {
      event.waitUntil(logPromise)
    } else {
      void logPromise
    }
  }

  // Check if path is a dynamic route that should not be indexed
  const shouldBlock =
    pathname.startsWith('/r/') ||
    pathname.startsWith('/u/') ||
    pathname.startsWith('/user/') ||
    pathname.startsWith('/search/') ||
    pathname.startsWith('/api/')

  if (shouldBlock) {
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
