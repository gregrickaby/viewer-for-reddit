import { describe, expect, it } from 'vitest'
import {
  REFRESH_SKEW_MS,
  needsRefresh,
  sealAccess,
  sealOAuthState,
  sealRefresh,
  secondsUntil,
  unsealAccess,
  unsealOAuthState,
  unsealRefresh,
} from '@/lib/auth/cookies'

// Reddit's tokens are long JWT-style strings; use generous lengths.
const longToken = (n: number) => 'eyJ' + 'x'.repeat(n - 3)

describe('session cookies', () => {
  it('round-trips the access token', async () => {
    const token = { accessToken: longToken(1200), expiresAt: Date.now() + 3_600_000 }
    expect(await unsealAccess(await sealAccess(token))).toEqual(token)
  })

  it('round-trips the refresh token', async () => {
    const token = {
      v: 1 as const,
      refreshToken: longToken(1200),
      username: 'spez',
      scope: 'identity read',
    }
    expect(await unsealRefresh(await sealRefresh(token))).toEqual(token)
  })

  it('round-trips the OAuth state', async () => {
    const state = { state: 'a'.repeat(43), next: '/saved' }
    expect(await unsealOAuthState(await sealOAuthState(state))).toEqual(state)
  })

  it('rejects missing, tampered, and foreign values', async () => {
    const sealed = await sealAccess({ accessToken: 'abc', expiresAt: Date.now() + 60_000 })
    expect(await unsealAccess(undefined)).toBeNull()
    expect(await unsealAccess('')).toBeNull()
    expect(await unsealAccess('not-a-seal')).toBeNull()
    expect(await unsealAccess(sealed.slice(0, -4) + 'AAAA')).toBeNull()
    // A refresh cookie is not a valid access cookie (schema mismatch).
    const refresh = await sealRefresh({ v: 1, refreshToken: 'r', username: 'u', scope: '' })
    expect(await unsealAccess(refresh)).toBeNull()
  })

  it('returns null when unsealing throws', async () => {
    // A well-formed seal from a different password makes iron-session throw.
    const { sealData } = await import('iron-session')
    const foreign = await sealData(
      { accessToken: 'a', expiresAt: 1 },
      { password: 'a-completely-different-password-32+' },
    )
    expect(await unsealAccess(foreign)).toBeNull()
  })

  it('keeps each sealed cookie under 3.8 KB with realistic Reddit token lengths', async () => {
    const access = await sealAccess({
      accessToken: longToken(1400),
      expiresAt: Date.now() + 86_400_000,
    })
    const refresh = await sealRefresh({
      v: 1,
      refreshToken: longToken(1400),
      username: 'a'.repeat(20),
      scope: 'identity read history mysubreddits subscribe vote submit edit save',
    })
    expect(access.length).toBeLessThan(3800)
    expect(refresh.length).toBeLessThan(3800)
  })
})

describe('needsRefresh', () => {
  const now = 1_000_000_000_000

  it('refreshes when there is no access token', () => {
    expect(needsRefresh(null, now)).toBe(true)
  })

  it('refreshes inside the skew window', () => {
    expect(needsRefresh({ accessToken: 'a', expiresAt: now + REFRESH_SKEW_MS - 1 }, now)).toBe(true)
  })

  it('does not refresh a fresh token', () => {
    expect(needsRefresh({ accessToken: 'a', expiresAt: now + REFRESH_SKEW_MS + 1 }, now)).toBe(
      false,
    )
  })
})

describe('secondsUntil', () => {
  it('never returns less than a minute', () => {
    expect(secondsUntil(0, 1_000)).toBe(60)
    expect(secondsUntil(1_000 + 3_600_000, 1_000)).toBe(3600)
  })
})
