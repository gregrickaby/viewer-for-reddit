import type {AuthTokens} from '@/lib/types/auth'
import {getEnvVar} from '@/lib/utils/env'
import {generateState, Reddit} from 'arctic'

/**
 * OAuth scopes requested from Reddit during authorization.
 * Centralised here so any scope change requires editing one file only.
 */
const SCOPES = [
  'identity',
  'read',
  'vote',
  'subscribe',
  'mysubreddits',
  'save',
  'submit',
  'edit',
  'history'
] as const

/**
 * The shape returned by {@link createLoginUrl}.
 */
export interface LoginUrl {
  /** Authorization URL to redirect the user to. */
  url: URL
  /** CSRF state token that must be stored in a cookie and validated on callback. */
  state: string
}

/** Lazily-constructed Reddit OAuth client. */
let client: Reddit | null = null

/**
 * Returns the shared Reddit OAuth client, constructing it on first call.
 *
 * @returns Configured Reddit client
 */
function getClient(): Reddit {
  client ??= new Reddit(
    getEnvVar('REDDIT_CLIENT_ID'),
    getEnvVar('REDDIT_CLIENT_SECRET'),
    getEnvVar('REDDIT_REDIRECT_URI')
  )
  return client
}

/**
 * Generates a CSRF state token and builds the Reddit authorization URL with
 * all required OAuth scopes and `duration=permanent` for refresh tokens.
 *
 * @returns Object containing the authorization URL and the state string
 */
export async function createLoginUrl(): Promise<LoginUrl> {
  const state = generateState()
  const raw = getClient().createAuthorizationURL(state, [...SCOPES])

  // Arctic does not expose a duration parameter, so it is appended manually.
  const url = new URL(raw)
  url.searchParams.set('duration', 'permanent')

  return {url, state}
}

/**
 * Exchanges an authorization code for OAuth tokens after the Reddit callback.
 *
 * @param code - Authorization code received from Reddit
 * @returns Tokens in {@link AuthTokens} shape
 * @throws If Arctic rejects the code or the request fails
 */
export async function exchangeCode(code: string): Promise<AuthTokens> {
  return getClient().validateAuthorizationCode(code)
}

/**
 * Refreshes an expired access token using the stored refresh token.
 *
 * @param token - The refresh token to exchange
 * @returns New tokens in {@link AuthTokens} shape
 * @throws If Arctic rejects the refresh token or the request fails
 */
export async function refreshToken(token: string): Promise<AuthTokens> {
  return getClient().refreshAccessToken(token)
}
