import {logError} from '@/lib/utils/logging/logError'

/**
 * OAuth-specific helper utilities.
 */

/**
 * Safely extract refresh token from Arctic tokens response.
 * Reddit provides refresh tokens only for "permanent" duration OAuth flows.
 *
 * @param tokens - Arctic tokens object with refreshToken method
 * @param username - Username for error logging context
 * @returns Refresh token string or empty string if not available
 *
 * @example
 * ```typescript
 * const tokens = await reddit.validateAuthorizationCode(code)
 * const refreshToken = await extractRefreshToken(tokens, 'username')
 * ```
 *
 * @note
 * Returns empty string if refresh token unavailable without logging error.
 * This is expected behavior when duration=temporary or for some Reddit OAuth flows.
 */
export async function extractRefreshToken(
  tokens: {refreshToken: () => string | null},
  username: string
): Promise<string> {
  try {
    const refreshToken = tokens.refreshToken()

    // Log informational message if refresh token is missing
    // This helps monitor OAuth flow issues without creating error noise
    if (!refreshToken) {
      logError('Refresh token not provided by Reddit OAuth', {
        component: 'OAuthHelpers',
        action: 'extractRefreshToken',
        username,
        note: 'User will need to re-login when access token expires'
      })
    }

    return refreshToken ?? ''
  } catch (error) {
    // Log error only if there was an actual exception
    logError('Error extracting refresh token', {
      component: 'OAuthHelpers',
      action: 'extractRefreshToken',
      username,
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
    return ''
  }
}

/**
 * Clean up OAuth-related cookies after successful authentication.
 *
 * @param cookieStore - Next.js cookie store
 *
 * @example
 * ```typescript
 * import {cookies} from 'next/headers'
 * const cookieStore = await cookies()
 * await cleanupOAuthCookies(cookieStore)
 * ```
 *
 * @note
 * Removes state cookie and legacy auth cookies from previous implementations.
 */
export async function cleanupOAuthCookies(cookieStore: {
  delete: (name: string) => void
}): Promise<void> {
  // Remove OAuth state cookie
  cookieStore.delete('reddit_oauth_state')

  // Clean up any stale auth cookies from previous implementations
  cookieStore.delete('authjs.callback-url')
  cookieStore.delete('authjs.session-token')
}
