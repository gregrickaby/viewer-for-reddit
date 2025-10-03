import {getRedditClient} from '@/lib/auth/arctic'
import {checkRateLimit} from '@/lib/auth/rateLimit'
import {setSession} from '@/lib/auth/session'
import {OAuth2RequestError} from 'arctic'
import {cookies} from 'next/headers'
import {NextRequest, NextResponse} from 'next/server'

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await checkRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  const cookieStore = await cookies()
  const storedState = cookieStore.get('reddit_oauth_state')?.value

  // Verify state to prevent CSRF attacks
  if (!code || !state || !storedState || state !== storedState) {
    const {logAuditEvent, getClientInfo} = await import('@/lib/auth/auditLog')
    const {default: appConfig} = await import('@/lib/config')

    logAuditEvent({
      type: 'csrf_validation_failed',
      ...getClientInfo(request),
      metadata: {
        hasCode: !!code,
        hasState: !!state,
        hasStoredState: !!storedState
      }
    })

    return NextResponse.redirect(
      new URL(
        '/?error=invalid_state&message=Security validation failed. Please try signing in again.',
        appConfig.baseUrl
      )
    )
  }

  try {
    // Exchange code for tokens
    const reddit = getRedditClient()
    const tokens = await reddit.validateAuthorizationCode(code)

    // Get user info
    const config = await import('@/lib/config')
    const response = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
        'User-Agent': config.default.userAgent
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user info')
    }

    const user = (await response.json()) as {
      name: string
      icon_img?: string
      snoovatar_img?: string
    }

    // Get avatar URL (prefer snoovatar, fallback to icon_img)
    let avatarUrl: string | undefined
    if (user.snoovatar_img) {
      avatarUrl = user.snoovatar_img.replace(/&amp;/g, '&')
    } else if (user.icon_img) {
      avatarUrl = user.icon_img.replace(/&amp;/g, '&')
    }

    // Create session
    // Note: Reddit may not always provide a refresh token
    let refreshToken = ''
    try {
      refreshToken = tokens.refreshToken() ?? ''
    } catch {
      // Refresh token not provided - that's okay for Reddit
      refreshToken = ''
    }

    await setSession({
      username: user.name,
      accessToken: tokens.accessToken(),
      refreshToken,
      expiresAt: tokens.accessTokenExpiresAt().getTime(),
      avatarUrl
    })

    // Clean up state cookie
    cookieStore.delete('reddit_oauth_state')

    // Clean up any stale auth cookies from previous implementations
    cookieStore.delete('authjs.callback-url')
    cookieStore.delete('authjs.session-token')

    // Audit log success
    const {logAuditEvent, getClientInfo} = await import('@/lib/auth/auditLog')
    logAuditEvent({
      type: 'login_success',
      username: user.name,
      ...getClientInfo(request)
    })

    const {default: appConfig} = await import('@/lib/config')
    const redirectResponse = NextResponse.redirect(
      new URL('/', appConfig.baseUrl)
    )

    // Prevent caching by CDN/proxies
    redirectResponse.headers.set(
      'Cache-Control',
      'private, no-cache, no-store, must-revalidate'
    )
    redirectResponse.headers.set('Pragma', 'no-cache')
    redirectResponse.headers.set('Expires', '0')

    return redirectResponse
  } catch (error) {
    // Sanitized error logging (no tokens or sensitive data)
    const {logAuditEvent, getClientInfo} = await import('@/lib/auth/auditLog')
    const {default: appConfig} = await import('@/lib/config')

    logAuditEvent({
      type: 'login_failed',
      ...getClientInfo(request),
      metadata: {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    if (error instanceof OAuth2RequestError) {
      return NextResponse.redirect(
        new URL(
          '/?error=oauth_error&message=Authentication failed. Please try again.',
          appConfig.baseUrl
        )
      )
    }

    return NextResponse.redirect(
      new URL(
        '/?error=authentication_failed&message=Unable to complete sign in.',
        appConfig.baseUrl
      )
    )
  }
}
