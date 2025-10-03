import config from '@/lib/config'
import {Reddit} from 'arctic'

/**
 * Get redirect URI for OAuth callback.
 * Evaluated at runtime to ensure correct environment-specific URL.
 */
export function getRedirectUri(): string {
  return `${config.baseUrl}/api/auth/callback/reddit`
}

/**
 * Get Arctic Reddit OAuth client instance.
 * Creates a new instance on each call to ensure redirect URI is evaluated at runtime.
 *
 * @see https://arctic.js.org/providers/reddit
 */
export function getRedditClient(): Reddit {
  return new Reddit(
    process.env.REDDIT_CLIENT_ID!,
    process.env.REDDIT_CLIENT_SECRET!,
    getRedirectUri()
  )
}
