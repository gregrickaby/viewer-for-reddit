import {Reddit} from 'arctic'

/**
 * Allowed redirect URIs for OAuth callback.
 * Validates that AUTH_URL environment variable is safe.
 */
const ALLOWED_REDIRECT_URIS = [
  process.env.AUTH_URL,
  'http://localhost:3000',
  'http://localhost:3001'
].filter(Boolean) as string[]

/**
 * Get and validate redirect URI.
 */
function getRedirectUri(): string {
  const authUrl = process.env.AUTH_URL

  if (!authUrl) {
    throw new Error('AUTH_URL environment variable is required')
  }

  // Validate HTTPS in production
  if (
    process.env.NODE_ENV === 'production' &&
    !authUrl.startsWith('https://')
  ) {
    throw new Error('AUTH_URL must use HTTPS in production')
  }

  const redirectUri = `${authUrl}/api/auth/callback/reddit`

  // Validate against allowlist
  const isAllowed = ALLOWED_REDIRECT_URIS.some((allowed) =>
    redirectUri.startsWith(allowed)
  )

  if (!isAllowed) {
    throw new Error(`Redirect URI ${redirectUri} not in allowlist`)
  }

  return redirectUri
}

/**
 * Arctic Reddit OAuth client with security validations.
 *
 * @see https://arctic.js.org/providers/reddit
 */
export const reddit = new Reddit(
  process.env.REDDIT_CLIENT_ID!,
  process.env.REDDIT_CLIENT_SECRET!,
  getRedirectUri()
)
