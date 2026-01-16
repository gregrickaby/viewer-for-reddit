'use server'

import {getSession} from '@/lib/auth/session'
import {logger} from '@/lib/utils/logger'

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
