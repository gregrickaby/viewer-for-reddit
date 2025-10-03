import {getRedditClient} from '@/lib/auth/arctic'
import {checkRateLimit} from '@/lib/auth/rateLimit'
import {getSession, updateSessionTokens} from '@/lib/auth/session'
import {NextRequest, NextResponse} from 'next/server'

/**
 * Refresh access token using refresh token.
 * Called automatically when token is expiring soon.
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await checkRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }
  try {
    const session = await getSession()

    if (!session?.refreshToken) {
      return NextResponse.json(
        {error: 'no_session', message: 'No active session or refresh token'},
        {status: 401}
      )
    }

    // Exchange refresh token for new access token
    const reddit = getRedditClient()
    const tokens = await reddit.refreshAccessToken(session.refreshToken)

    // Update session with new tokens
    await updateSessionTokens({
      accessToken: tokens.accessToken(),
      refreshToken: tokens.hasRefreshToken()
        ? tokens.refreshToken()
        : undefined,
      expiresAt: tokens.accessTokenExpiresAt().getTime()
    })

    return NextResponse.json({
      success: true,
      expiresAt: tokens.accessTokenExpiresAt().getTime()
    })
  } catch (error) {
    console.error('Token refresh failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      {error: 'refresh_failed', message: 'Failed to refresh token'},
      {status: 401}
    )
  }
}
