/**
 * Deep module for Reddit authentication context.
 *
 * Consolidates the auth pipeline (session read, token refresh, header
 * construction) behind a single entry point: {@link getRedditContext}.
 * All I/O boundaries are injectable via {@link configureRedditContext},
 * eliminating vi.mock() path-string fragility in tests.
 */

import {getSession} from '@/lib/auth/session'
import {logger} from '@/lib/axiom/server'
import type {AuthTokens} from '@/lib/types/auth'
import type {SessionData} from '@/lib/types/reddit'
import {
  REDDIT_API_URL,
  REDDIT_PUBLIC_API_URL,
  TOKEN_REFRESH_BUFFER
} from '@/lib/utils/constants'
import {getEnvVar} from '@/lib/utils/env'
import {refreshToken as refreshTokenViaArctic} from '@/lib/utils/reddit-auth'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Enriched request context for Reddit API calls.
 * Contains everything a caller needs: HTTP headers, base URL, and auth status.
 */
export interface RedditContext {
  /** HTTP headers including Authorization when authenticated. */
  headers: HeadersInit
  /** oauth.reddit.com when authenticated, www.reddit.com otherwise. */
  baseUrl: string
  /** True when a valid access token was resolved. */
  isAuthenticated: boolean
  /** Authenticated username, or null for anonymous requests. */
  username: string | null
}

/**
 * Minimal session snapshot decoupled from iron-session internals.
 */
export interface SessionSnapshot {
  /** OAuth access token, or undefined when no session exists. */
  accessToken: string | undefined
  /** OAuth refresh token, or undefined when unavailable. */
  refreshToken: string | undefined
  /** Token expiration as Unix milliseconds, or undefined. */
  expiresAt: number | undefined
  /** Reddit username, or undefined for anonymous sessions. */
  username: string | undefined
  /** Reddit user ID, or undefined for anonymous sessions. */
  userId: string | undefined
}

/**
 * Injectable I/O boundaries for the auth pipeline.
 * Production wires real implementations; tests supply stubs.
 */
export interface RedditContextAdapters {
  /**
   * Read the current session from storage.
   *
   * @returns Promise resolving to a session snapshot
   */
  readSession: () => Promise<SessionSnapshot>

  /**
   * Persist updated session fields after a token refresh.
   *
   * @param data - Full session data to write
   * @returns Promise that resolves when the write completes
   */
  writeSession: (data: SessionData) => Promise<void>

  /**
   * Exchange a refresh token for new OAuth tokens via Arctic.
   *
   * @param token - The refresh token to exchange
   * @returns Promise resolving to new tokens
   */
  refreshAccessToken: (token: string) => Promise<AuthTokens>

  /**
   * Current wall-clock time in milliseconds.
   *
   * @returns Unix timestamp in milliseconds
   */
  now: () => number
}

// ---------------------------------------------------------------------------
// Adapter management
// ---------------------------------------------------------------------------

let customAdapters: RedditContextAdapters | null = null

/**
 * Override the default adapters for testing. Call once in test setup.
 *
 * @param adapters - Custom adapter implementations
 */
export function configureRedditContext(adapters: RedditContextAdapters): void {
  customAdapters = adapters
}

/**
 * Restore default (production) adapters and clear any in-flight refresh.
 * Call in afterEach or afterAll during tests.
 */
export function resetRedditContext(): void {
  customAdapters = null
  inflightRefresh = null
}

/**
 * Return the active adapters: custom if configured, otherwise production defaults.
 */
function getAdapters(): RedditContextAdapters {
  if (customAdapters) return customAdapters
  return defaultAdapters
}

// ---------------------------------------------------------------------------
// Default (production) adapters
// ---------------------------------------------------------------------------

const defaultAdapters: RedditContextAdapters = {
  async readSession(): Promise<SessionSnapshot> {
    const session = await getSession()
    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      username: session.username,
      userId: session.userId
    }
  },

  async writeSession(data: SessionData): Promise<void> {
    const session = await getSession()
    session.accessToken = data.accessToken
    session.refreshToken = data.refreshToken
    session.expiresAt = data.expiresAt
    session.username = data.username
    session.userId = data.userId
    await session.save()
  },

  refreshAccessToken: refreshTokenViaArctic,

  now: () => Date.now()
}

// ---------------------------------------------------------------------------
// Concurrent refresh coalescing
// ---------------------------------------------------------------------------

let inflightRefresh: Promise<string | null> | null = null

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build an authenticated RedditContext from a resolved access token.
 */
function authenticatedContext(
  accessToken: string,
  username: string | null
): RedditContext {
  return {
    headers: {
      'User-Agent': getEnvVar('USER_AGENT'),
      Authorization: `Bearer ${accessToken}`
    },
    baseUrl: REDDIT_API_URL,
    isAuthenticated: true,
    username
  }
}

/**
 * Extract the refresh token from an Arctic token response, handling rotation.
 * Falls back to currentToken when the provider does not issue a new one.
 */
function extractRefreshToken(tokens: AuthTokens, currentToken: string): string {
  try {
    const fresh = tokens.refreshToken()
    if (fresh && fresh !== currentToken) {
      logger.info('Refresh token rotated by Reddit', {
        context: 'getRedditContext'
      })
      return fresh
    }
  } catch {
    logger.debug('No new refresh token provided, keeping existing', {
      context: 'getRedditContext'
    })
  }
  return currentToken
}

/**
 * Perform a token refresh and persist the updated session.
 *
 * @param snapshot - Current session state
 * @param adapters - I/O adapters to use
 * @returns New access token on success, or null on failure
 */
async function performRefresh(
  snapshot: SessionSnapshot,
  adapters: RedditContextAdapters
): Promise<string | null> {
  const currentRefreshToken = snapshot.refreshToken
  if (!currentRefreshToken) {
    logger.warn('No refresh token available', {context: 'getRedditContext'})
    return null
  }

  try {
    logger.debug('Refreshing access token', {context: 'getRedditContext'})

    const tokens = await adapters.refreshAccessToken(currentRefreshToken)
    const newAccessToken = tokens.accessToken()
    const newRefreshToken = extractRefreshToken(tokens, currentRefreshToken)
    const newExpiresAt =
      tokens.accessTokenExpiresAt()?.getTime() || adapters.now() + 3600000

    await adapters.writeSession({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt: newExpiresAt,
      username: snapshot.username || '',
      userId: snapshot.userId || ''
    })

    logger.info('Access token refreshed successfully', {
      context: 'getRedditContext'
    })
    return newAccessToken
  } catch (error) {
    logger.error('Token refresh failed', {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      context: 'getRedditContext'
    })
    return null
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build an anonymous {@link RedditContext} for unauthenticated requests.
 *
 * @returns Context configured for the public Reddit API
 */
export function getAnonymousContext(): RedditContext {
  return {
    headers: {
      'User-Agent': getEnvVar('USER_AGENT')
    },
    baseUrl: REDDIT_PUBLIC_API_URL,
    isAuthenticated: false,
    username: null
  }
}

/**
 * Build a {@link RedditContext} from a raw access token string.
 * Used during the OAuth callback before a session exists.
 *
 * @param accessToken - OAuth access token obtained from code exchange
 * @returns Authenticated context (username is null until identity is fetched)
 */
export function contextFromToken(accessToken: string): RedditContext {
  return authenticatedContext(accessToken, null)
}

/**
 * Resolve the current Reddit request context.
 *
 * Reads the session, refreshes the access token if needed (coalescing
 * concurrent calls), and returns a fully-formed {@link RedditContext}.
 * Falls back to an anonymous context when no token is available or
 * when refresh fails.
 *
 * @returns Promise resolving to the current RedditContext
 */
export async function getRedditContext(): Promise<RedditContext> {
  const adapters = getAdapters()
  const snapshot = await adapters.readSession()

  if (!snapshot.accessToken) {
    return getAnonymousContext()
  }

  const needsRefresh =
    !snapshot.expiresAt ||
    snapshot.expiresAt - adapters.now() < TOKEN_REFRESH_BUFFER

  if (!needsRefresh) {
    return authenticatedContext(snapshot.accessToken, snapshot.username || null)
  }

  // Coalesce concurrent refresh attempts
  if (!inflightRefresh) {
    inflightRefresh = performRefresh(snapshot, adapters).finally(() => {
      inflightRefresh = null
    })
  }

  const newAccessToken = await inflightRefresh

  if (newAccessToken) {
    return authenticatedContext(newAccessToken, snapshot.username || null)
  }

  // Refresh failed: fall back to anonymous
  return getAnonymousContext()
}
