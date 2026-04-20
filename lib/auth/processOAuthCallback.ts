/**
 * Pure-logic handler for the Reddit OAuth callback.
 *
 * Exchanges an authorization code for tokens and fetches the
 * authenticated user's identity. Returns a discriminated union
 * so the route handler can map results to HTTP responses without
 * embedding business logic.
 */

import {contextFromToken} from '@/lib/auth/reddit-context'
import {logger} from '@/lib/axiom/server'
import type {SessionData} from '@/lib/types/reddit'
import {exchangeCode} from '@/lib/utils/reddit-auth'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Successful callback result containing session data ready to persist. */
export interface OAuthCallbackSuccess {
  /** Discriminator for the success case. */
  ok: true
  /** Complete session data, ready to pass to persistSession(). */
  sessionData: SessionData
}

/** Failed callback result with a machine-readable reason and human message. */
export interface OAuthCallbackFailure {
  /** Discriminator for the failure case. */
  ok: false
  /** Machine-readable failure reason. */
  reason: 'exchange_failed' | 'identity_failed'
  /** Human-readable error message suitable for logging. */
  message: string
}

/** Discriminated union returned by {@link processOAuthCallback}. */
export type OAuthCallbackResult = OAuthCallbackSuccess | OAuthCallbackFailure

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Reddit user identity from /api/v1/me. */
interface RedditIdentity {
  name: string
  id: string
}

/**
 * Fetch the authenticated user's identity from Reddit.
 *
 * @param accessToken - OAuth access token from code exchange
 * @returns Promise resolving to username and user ID
 * @throws Error if the Reddit API request fails
 */
async function fetchIdentity(accessToken: string): Promise<RedditIdentity> {
  const ctx = contextFromToken(accessToken)
  const response = await fetch(`${ctx.baseUrl}/api/v1/me`, {
    headers: ctx.headers
  })

  if (!response.ok) {
    const errorText = await response.text()
    logger.error('Failed to fetch Reddit user identity', {
      status: response.status,
      statusText: response.statusText,
      errorBody: errorText,
      context: 'processOAuthCallback'
    })
    throw new Error(`Reddit API responded with ${response.status}`)
  }

  return response.json() as Promise<RedditIdentity>
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Exchange an authorization code for tokens and resolve user identity.
 *
 * @param code - Authorization code from the Reddit OAuth redirect
 * @returns Discriminated union: success with SessionData, or failure with reason
 */
export async function processOAuthCallback(
  code: string
): Promise<OAuthCallbackResult> {
  // Step 1: exchange authorization code for tokens
  let accessToken: string
  let refreshTokenValue: string
  let expiresAt: number

  try {
    const tokens = await exchangeCode(code)
    accessToken = tokens.accessToken()

    try {
      refreshTokenValue = tokens.refreshToken() || ''
    } catch {
      refreshTokenValue = ''
      logger.info('No refresh token provided by Reddit', {
        context: 'processOAuthCallback'
      })
    }

    expiresAt = tokens.accessTokenExpiresAt()?.getTime() || Date.now() + 3600000

    logger.debug('Tokens received', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshTokenValue,
      context: 'processOAuthCallback'
    })
  } catch (error) {
    logger.error('Token exchange failed', {
      error: error instanceof Error ? error.message : String(error),
      context: 'processOAuthCallback'
    })
    return {
      ok: false,
      reason: 'exchange_failed',
      message: error instanceof Error ? error.message : 'Token exchange failed'
    }
  }

  // Step 2: fetch user identity
  try {
    const identity = await fetchIdentity(accessToken)

    logger.info('User authenticated', {
      username: identity.name,
      context: 'processOAuthCallback'
    })

    return {
      ok: true,
      sessionData: {
        accessToken,
        refreshToken: refreshTokenValue,
        expiresAt,
        username: identity.name,
        userId: identity.id
      }
    }
  } catch (error) {
    logger.error('User identity fetch failed', {
      error: error instanceof Error ? error.message : String(error),
      context: 'processOAuthCallback'
    })
    return {
      ok: false,
      reason: 'identity_failed',
      message:
        error instanceof Error ? error.message : 'Failed to fetch user identity'
    }
  }
}
