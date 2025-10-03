import {getSession} from '@/lib/auth/session'
import config from '@/lib/config'
import {logError} from '@/lib/utils/logError'

/**
 * Server-side authenticated fetch using user's session token.
 * Use this in Server Components and Server Actions to make
 * authenticated requests to Reddit API on behalf of the user.
 *
 * @example
 * ```ts
 * const data = await authenticatedFetch('/api/v1/me')
 * if (!data) {
 *   // User not authenticated or request failed
 *   return null
 * }
 * ```
 */
export async function authenticatedFetch<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T | null> {
  try {
    // Get user's session
    const session = await getSession()
    if (!session) {
      return null
    }

    // Build full URL
    const url = endpoint.startsWith('http')
      ? endpoint
      : `https://oauth.reddit.com${endpoint}`

    // Make authenticated request with user's access token
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${session.accessToken}`,
        'User-Agent': config.userAgent
      }
    })

    if (!response.ok) {
      logError(`Reddit API error: ${response.status} ${response.statusText}`, {
        component: 'authenticatedFetch',
        endpoint,
        status: response.status,
        username: session.username
      })
      return null
    }

    return await response.json()
  } catch (error) {
    logError(error, {
      component: 'authenticatedFetch',
      endpoint
    })
    return null
  }
}
