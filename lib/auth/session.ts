import config from '@/lib/config'
import {getIronSession, type IronSession} from 'iron-session'
import {cookies} from 'next/headers'

/**
 * Server-side session data (encrypted in cookie).
 * Never exposed to client-side code.
 */
export interface SessionData {
  username: string
  accessToken: string
  refreshToken: string
  expiresAt: number
  sessionVersion: number
  avatarUrl?: string
}

/**
 * Client-safe session data (no tokens).
 */
export interface ClientSession {
  username: string
  expiresAt: number
  isAuthenticated: boolean
  avatarUrl?: string
}

const SESSION_COOKIE_NAME = 'reddit_session'
const SESSION_TTL = 14 * 24 * 60 * 60 // 14 days in seconds

/**
 * Session configuration for iron-session.
 * Requires SESSION_SECRET environment variable (min 32 characters).
 *
 * Multi-environment support:
 * - Production: Sets cookie domain to .reddit-viewer.com (shared across all subdomains)
 * - Preview deployments: Read cookies from parent domain (.reddit-viewer.com)
 * - Local dev: No domain restriction (localhost only)
 */
function getSessionConfig() {
  const secret = process.env.SESSION_SECRET

  if (!secret || secret.length < 32) {
    throw new Error(
      'SESSION_SECRET environment variable must be set and at least 32 characters long'
    )
  }

  return {
    cookieName: SESSION_COOKIE_NAME,
    password: secret,
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax' as const,
      maxAge: SESSION_TTL,
      path: '/',
      // Share session across all reddit-viewer.com subdomains (production + previews)
      // Local development uses no domain restriction (localhost only)
      domain: config.sessionDomain
    }
  }
}

/**
 * Get the encrypted iron-session instance.
 */
async function getIronSessionInstance(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, getSessionConfig())
}

/**
 * Get the current session from encrypted cookie.
 * Validates token expiration automatically.
 *
 * @returns Session data if valid and not expired, null otherwise
 */
export async function getSession(): Promise<SessionData | null> {
  try {
    const session = await getIronSessionInstance()

    if (!session.username || !session.accessToken) {
      return null
    }

    // Validate token expiration (with 5 minute buffer for refresh)
    const now = Date.now()
    const bufferMs = 5 * 60 * 1000 // 5 minutes
    if (session.expiresAt && session.expiresAt - bufferMs < now) {
      // Token expired or expiring soon
      return null
    }

    return {
      username: session.username,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      sessionVersion: session.sessionVersion || 1,
      avatarUrl: session.avatarUrl
    }
  } catch {
    return null
  }
}

/**
 * Get client-safe session data (no tokens).
 * Use this for exposing session info to client-side code.
 */
export async function getClientSession(): Promise<ClientSession | null> {
  const session = await getSession()

  if (!session) {
    return null
  }

  return {
    username: session.username,
    expiresAt: session.expiresAt,
    isAuthenticated: true,
    avatarUrl: session.avatarUrl
  }
}

/**
 * Set the session in encrypted cookie.
 * Creates new session version for revocation support.
 */
export async function setSession(data: {
  username: string
  accessToken: string
  refreshToken: string
  expiresAt: number
  avatarUrl?: string
}): Promise<void> {
  const session = await getIronSessionInstance()

  session.username = data.username
  session.accessToken = data.accessToken
  session.refreshToken = data.refreshToken
  session.expiresAt = data.expiresAt
  session.sessionVersion = Date.now() // Use timestamp as version
  session.avatarUrl = data.avatarUrl

  await session.save()
}

/**
 * Update only the tokens in the session (for token refresh).
 */
export async function updateSessionTokens(data: {
  accessToken: string
  refreshToken?: string
  expiresAt: number
}): Promise<void> {
  const session = await getIronSessionInstance()

  if (!session.username) {
    throw new Error('No active session to update')
  }

  session.accessToken = data.accessToken
  if (data.refreshToken) {
    session.refreshToken = data.refreshToken
  }
  session.expiresAt = data.expiresAt

  await session.save()
}

/**
 * Delete the session cookie (logout).
 */
export async function deleteSession(): Promise<void> {
  const session = await getIronSessionInstance()
  session.destroy()
}

/**
 * Invalidate all sessions for a user.
 * In a production app with multiple devices, this would update a
 * version number in a database. For now, we just destroy the current session.
 */
export async function invalidateAllSessions(): Promise<void> {
  await deleteSession()
}
