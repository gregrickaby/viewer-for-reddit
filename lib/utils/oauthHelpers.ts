import {logError} from './logError'

/**
 * OAuth-specific helper utilities.
 */

/**
 * Safely extract refresh token from Arctic tokens response.
 * Reddit may not always provide a refresh token depending on OAuth flow.
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
 * Logs when refresh token is unavailable for monitoring purposes.
 * Does not fail authentication if refresh token is missing.
 */
export async function extractRefreshToken(
  tokens: {refreshToken: () => string | null},
  username: string
): Promise<string> {
  try {
    return tokens.refreshToken() ?? ''
  } catch (error) {
    // Reddit may not provide refresh token for some OAuth flows
    // Log for monitoring but don't fail the authentication
    logError('Refresh token not available', {
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
