'use server'

import {getSession, isSessionExpired} from '@/lib/auth/session'
import {getEnvVar} from '@/lib/utils/env'
import {logger} from '@/lib/utils/logger'
import {Reddit} from 'arctic'

/**
 * Reddit OAuth client instance for token refresh.
 */
const reddit = new Reddit(
  getEnvVar('REDDIT_CLIENT_ID'),
  getEnvVar('REDDIT_CLIENT_SECRET'),
  getEnvVar('REDDIT_REDIRECT_URI')
)

/**
 * Refresh the access token using the refresh token.
 * Updates the session with new tokens and expiration time.
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
  try {
    const session = await getSession()

    if (!session.refreshToken) {
      logger.warn('No refresh token available', undefined, {
        context: 'refreshAccessToken'
      })
      return {
        success: false,
        error: 'No refresh token available'
      }
    }

    logger.debug('Refreshing access token', undefined, {
      context: 'refreshAccessToken'
    })

    // Use Arctic to refresh the token
    const tokens = await reddit.refreshAccessToken(session.refreshToken)
    const newAccessToken = tokens.accessToken()

    // Get new refresh token if provided
    let newRefreshToken = session.refreshToken
    try {
      newRefreshToken = tokens.refreshToken() || session.refreshToken
    } catch {
      // Keep existing refresh token if new one not provided
      logger.debug('Reusing existing refresh token', undefined, {
        context: 'refreshAccessToken'
      })
    }

    // Update session with new tokens
    session.accessToken = newAccessToken
    session.refreshToken = newRefreshToken
    session.expiresAt =
      tokens.accessTokenExpiresAt()?.getTime() || Date.now() + 3600000
    await session.save()

    logger.info('Access token refreshed successfully', undefined, {
      context: 'refreshAccessToken'
    })

    return {success: true}
  } catch (error) {
    logger.error('Token refresh failed', error, {
      context: 'refreshAccessToken'
    })

    // Clear the session on refresh failure
    const session = await getSession()
    session.destroy()

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

  // Check if token is expired or expires within 5 minutes
  const fiveMinutes = 5 * 60 * 1000
  const needsRefresh =
    !session.expiresAt || session.expiresAt - Date.now() < fiveMinutes

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
