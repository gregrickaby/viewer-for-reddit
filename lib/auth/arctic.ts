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
 *
 * Multi-environment strategy:
 * - Production & preview deployments: Use production URL as callback handler
 * - Local development: Use localhost callback
 *
 * This works because preview deployments share the parent domain (.reddit-viewer.com)
 * and can read session cookies set by the production callback handler.
 */
function getRedirectUri(): string {
  // Production and all preview deployments (.reddit-viewer.com subdomains)
  // use production callback as the OAuth handler
  if (process.env.NODE_ENV === 'production') {
    return 'https://reddit-viewer.com/api/auth/callback/reddit'
  }

  // Local development uses localhost callback
  // Note: This requires Reddit app to be configured with localhost callback,
  // OR developers can test OAuth on preview deployments instead
  const authUrl = process.env.AUTH_URL || 'http://localhost:3000'

  if (!authUrl) {
    throw new Error('AUTH_URL environment variable is required')
  }

  const redirectUri = `${authUrl}/api/auth/callback/reddit`

  // Validate against allowlist for local development
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
