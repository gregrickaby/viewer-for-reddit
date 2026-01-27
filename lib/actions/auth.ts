'use server'

import {getSession, isSessionExpired} from '@/lib/auth/session'
import {TOKEN_REFRESH_BUFFER} from '@/lib/utils/constants'
import {getEnvVar} from '@/lib/utils/env'
import {logger} from '@/lib/utils/logger'
import {Reddit} from 'arctic'

/**
 * Reddit OAuth client instance for token refresh.
 */
let reddit: Reddit | null = null

/**
 * Get or create the Reddit OAuth client instance.
 * @returns Reddit OAuth client
 */
function getRedditClient(): Reddit {
  reddit ??= new Reddit(
    getEnvVar('REDDIT_CLIENT_ID'),
    getEnvVar('REDDIT_CLIENT_SECRET'),
    getEnvVar('REDDIT_REDIRECT_URI')
  )
  return reddit
}

/**
 * Refresh lock to prevent concurrent refresh attempts.
 * When a refresh is in progress, subsequent calls return the existing promise.
 */
let refreshPromise: Promise<{success: boolean; error?: string}> | null = null

/**
 * Refresh the access token using the refresh token.
 * Updates the session with new tokens and expiration time.
 * Implements refresh lock to prevent concurrent refresh attempts.
 *
 * @returns Promise resolving to success status and optional error message
 *
 * @example
 * ```typescript
 * const result = await refreshAccessToken()
 * if (!result.success) {
 *   // Token refresh failed, user needs to re-authenticate
 *   router.push('/api/auth/login')
 * }
 * ```
 */
export async function refreshAccessToken(): Promise<{
  success: boolean
  error?: string
}> {
  // If refresh already in progress, return existing promise
  if (refreshPromise) {
    logger.debug(
      'Refresh already in progress, returning existing promise',
      undefined,
      {context: 'refreshAccessToken'}
    )
    return refreshPromise
  }

  try {
    refreshPromise = performRefresh()
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

/**
 * Extract and handle refresh token from OAuth response.
 * @param tokens - OAuth tokens from Arctic
 * @param currentRefreshToken - Current refresh token to compare against
 * @returns New refresh token (either rotated or existing)
 */
function extractRefreshToken(
  tokens: Awaited<
    ReturnType<ReturnType<typeof getRedditClient>['refreshAccessToken']>
  >,
  currentRefreshToken: string
): string {
  try {
    const freshToken = tokens.refreshToken()
    if (freshToken && freshToken !== currentRefreshToken) {
      logger.info('Refresh token rotated by Reddit', undefined, {
        context: 'refreshAccessToken'
      })
      return freshToken
    }
    if (freshToken) {
      logger.debug('Reusing existing refresh token (no rotation)', undefined, {
        context: 'refreshAccessToken'
      })
    }
  } catch {
    logger.debug('No new refresh token provided, keeping existing', undefined, {
      context: 'refreshAccessToken'
    })
  }
  return currentRefreshToken
}

/**
 * Update session with new OAuth tokens.
 * @param session - Current session to update
 * @param tokens - New OAuth tokens from Arctic
 * @param currentRefreshToken - Current refresh token
 */
async function updateSessionWithTokens(
  session: Awaited<ReturnType<typeof getSession>>,
  tokens: Awaited<
    ReturnType<ReturnType<typeof getRedditClient>['refreshAccessToken']>
  >,
  currentRefreshToken: string
): Promise<void> {
  session.accessToken = tokens.accessToken()
  session.refreshToken = extractRefreshToken(tokens, currentRefreshToken)
  session.expiresAt =
    tokens.accessTokenExpiresAt()?.getTime() || Date.now() + 3600000
  await session.save()
}

/**
 * Destroy session after refresh failure.
 */
async function destroySessionOnFailure(originalError: unknown): Promise<void> {
  try {
    const session = await getSession()
    session.destroy()
    logger.debug('Session destroyed after refresh failure', undefined, {
      context: 'refreshAccessToken'
    })
  } catch (destroyError) {
    logger.error(
      'Failed to destroy session after refresh failure',
      {
        destroyError:
          destroyError instanceof Error
            ? destroyError.message
            : String(destroyError),
        originalError:
          originalError instanceof Error
            ? originalError.message
            : String(originalError)
      },
      {context: 'refreshAccessToken'}
    )
  }
}

/**
 * Performs the actual token refresh operation.
 * Internal function called by refreshAccessToken with lock protection.
 */
async function performRefresh(): Promise<{
  success: boolean
  error?: string
}> {
  // Variables for error logging (captured before potential failure)
  let hasRefreshToken = false
  let expiresAt: number | undefined

  try {
    const session = await getSession()

    if (!session.refreshToken) {
      logger.warn('No refresh token available', undefined, {
        context: 'refreshAccessToken'
      })
      return {success: false, error: 'No refresh token available'}
    }

    // Capture session state for potential error logging
    hasRefreshToken = true // NOSONAR - Used in catch block for diagnostics
    expiresAt = session.expiresAt // NOSONAR - Used in catch block for diagnostics

    logger.debug('Refreshing access token', undefined, {
      context: 'refreshAccessToken'
    })

    const tokens = await getRedditClient().refreshAccessToken(
      session.refreshToken
    )
    await updateSessionWithTokens(session, tokens, session.refreshToken)

    logger.info('Access token refreshed successfully', undefined, {
      context: 'refreshAccessToken'
    })

    return {success: true}
  } catch (error) {
    logger.error(
      'Token refresh failed',
      {
        errorType:
          error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        hasRefreshToken,
        refreshTokenAge: expiresAt ? Date.now() - expiresAt : 'unknown'
      },
      {context: 'refreshAccessToken'}
    )

    await destroySessionOnFailure(error)

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to refresh access token'
    }
  }
}

/**
 * Get valid access token, refreshing if necessary.
 * Automatically refreshes the token if it's expired or about to expire (within 5 minutes).
 *
 * @returns Promise resolving to access token or null if refresh fails
 *
 * @example
 * ```typescript
 * const token = await getValidAccessToken()
 * if (!token) {
 *   // User needs to re-authenticate
 *   redirect('/api/auth/login')
 * }
 * ```
 */
export async function getValidAccessToken(): Promise<string | null> {
  const session = await getSession()

  if (!session.accessToken) {
    return null
  }

  // Check if token is expired or expires within buffer time
  const needsRefresh =
    !session.expiresAt || session.expiresAt - Date.now() < TOKEN_REFRESH_BUFFER

  if (needsRefresh) {
    logger.debug('Token expired or expiring soon, refreshing', undefined, {
      context: 'getValidAccessToken'
    })

    const result = await refreshAccessToken()
    if (!result.success) {
      return null
    }

    // Get updated session
    const updatedSession = await getSession()
    return updatedSession.accessToken || null
  }

  return session.accessToken
}

/**
 * Logout user by destroying their session.
 * Server Action that destroys the iron-session and clears authentication state.
 *
 * @returns Promise resolving to success status and optional error message
 *
 * @example
 * ```typescript
 * const result = await logout()
 * if (result.success) {
 *   router.push('/login')
 * }
 * ```
 */
export async function logout(): Promise<{success: boolean; error?: string}> {
  try {
    const session = await getSession()

    // Destroy the session
    session.destroy()

    logger.info('User logged out successfully')

    return {success: true}
  } catch (error) {
    logger.error('Logout failed', error, {context: 'logout'})
    return {
      success: false,
      error: 'Failed to logout. Please try again.'
    }
  }
}

/**
 * Check if user is authenticated without exposing sensitive tokens.
 * Server Action that validates session state and returns authentication status.
 *
 * @returns Promise resolving to authentication status and optional username
 *
 * @example
 * ```typescript
 * const {isAuthenticated, username} = await getAuthStatus()
 * if (isAuthenticated) {
 *   console.log(`Logged in as ${username}`)
 * }
 * ```
 */
export async function getAuthStatus(): Promise<{
  isAuthenticated: boolean
  username?: string
}> {
  const session = await getSession()
  const isAuthenticated = !!(
    session.accessToken &&
    session.expiresAt &&
    session.expiresAt > Date.now()
  )

  return {
    isAuthenticated,
    username: session.username
  }
}

/**
 * Clear expired session.
 * Server Action that destroys session if it has expired.
 *
 * @returns Promise resolving to success status
 *
 * @example
 * ```typescript
 * const result = await clearExpiredSession()
 * if (result.success) {
 *   router.push('/api/auth/login')
 * }
 * ```
 */
export async function clearExpiredSession(): Promise<{
  success: boolean
  wasExpired: boolean
}> {
  try {
    const expired = await isSessionExpired()

    if (expired) {
      const session = await getSession()
      session.destroy()
      logger.info('Expired session cleared')
      return {success: true, wasExpired: true}
    }

    return {success: true, wasExpired: false}
  } catch (error) {
    logger.error('Failed to clear expired session', error, {
      context: 'clearExpiredSession'
    })
    return {success: false, wasExpired: false}
  }
}
