import config from '@/lib/config'
import {Reddit} from 'arctic'

/**
 * Get redirect URI for OAuth callback.
 */
function getRedirectUri(): string {
  return `${config.baseUrl}/api/auth/callback/reddit`
}

/**
 * Arctic Reddit OAuth client.
 *
 * @see https://arctic.js.org/providers/reddit
 */
export const reddit = new Reddit(
  process.env.REDDIT_CLIENT_ID!,
  process.env.REDDIT_CLIENT_SECRET!,
  getRedirectUri()
)
