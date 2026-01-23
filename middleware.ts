import {NextRequest, NextResponse} from 'next/server'

/**
 * Middleware to add security and SEO headers.
 *
 * Adds X-Robots-Tag headers to dynamic routes to prevent indexing.
 * This provides defense-in-depth alongside meta robots tags and robots.txt.
 *
 * Why X-Robots-Tag headers?
 * - HTTP headers are processed before HTML, making them more authoritative
 * - Prevents crawlers from even downloading the page content
 * - Reduces API calls when bots respect headers
 *
 * Routes blocked from indexing:
 * - /r/* - All subreddit pages
 * - /u/* - All user profile pages
 * - /user/* - Alternative user route
 * - /search/* - Search results
 * - /api/* - API routes
 *
 * @see https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#xrobotstag
 */
export function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl

  // Check if path is a dynamic route that should not be indexed
  const shouldBlock =
    pathname.startsWith('/r/') ||
    pathname.startsWith('/u/') ||
    pathname.startsWith('/user/') ||
    pathname.startsWith('/search/') ||
    pathname.startsWith('/api/')

  if (shouldBlock) {
    const response = NextResponse.next()
    // noindex: don't show in search results
    // nofollow: don't follow links on this page (optional, but helps reduce crawl)
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return response
  }

  return NextResponse.next()
}

/**
 * Configure which routes the middleware runs on.
 * Using matcher for performance - only runs on specified paths.
 *
 * Matcher pattern for dynamic, non-static routes:
 * - Matches all request paths under `/`
 * - Excludes:
 *   - `_next/static` (Next.js static assets)
 *   - `_next/image` (Next.js image optimization endpoint)
 *   - `favicon.ico` (site favicon)
 *   - Public asset files with extensions: svg, png, jpg, jpeg, gif, webp
 *
 * The negative lookahead ensures these asset paths are skipped so the
 * middleware only runs for HTML/document routes where SEO headers matter.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}
