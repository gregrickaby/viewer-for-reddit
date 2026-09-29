import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeCookieJar } from '@/tests/helpers/cookie-jar'

const jar = { current: fakeCookieJar() }

vi.mock('next/headers', () => ({ cookies: vi.fn(async () => jar.current) }))
vi.mock('next/cache', () => ({ io: vi.fn(async () => {}) }))

const { ACCESS_COOKIE, REFRESH_COOKIE, sealAccess, sealRefresh } =
  await import('@/lib/auth/cookies')
const { SessionUnavailableError, getAuth, getUsername, requireAuth } =
  await import('@/lib/auth/session')

async function signIn({ accessValid }: { accessValid: boolean | 'missing' }) {
  const cookies: Record<string, string> = {
    [REFRESH_COOKIE]: await sealRefresh({
      v: 1,
      refreshToken: 'rt',
      username: 'spez',
      scope: 'read',
    }),
  }
  if (accessValid !== 'missing') {
    cookies[ACCESS_COOKIE] = await sealAccess({
      accessToken: 'at',
      // An already-expired token still unseals (the seal TTL floor is 60s) but must be rejected.
      expiresAt: Date.now() + (accessValid ? 3_600_000 : -1_000),
    })
  }
  jar.current = fakeCookieJar(cookies)
}

beforeEach(() => {
  jar.current = fakeCookieJar()
})

describe('getAuth', () => {
  it('returns the token and username for a live session', async () => {
    await signIn({ accessValid: true })
    expect(await getAuth()).toEqual({ accessToken: 'at', username: 'spez' })
  })

  it('returns null when signed out or the access token is unusable', async () => {
    expect(await getAuth()).toBeNull()
    await signIn({ accessValid: false })
    expect(await getAuth()).toBeNull()
  })
})

describe('getUsername', () => {
  it('needs only the refresh cookie', async () => {
    await signIn({ accessValid: 'missing' })
    expect(await getUsername()).toBe('spez')
  })

  it('is null when signed out', async () => {
    expect(await getUsername()).toBeNull()
  })
})

describe('requireAuth', () => {
  it('returns the session', async () => {
    await signIn({ accessValid: true })
    await expect(requireAuth()).resolves.toEqual({ accessToken: 'at', username: 'spez' })
  })

  it('signs out when there is no session at all', async () => {
    await expect(requireAuth()).rejects.toMatchObject({
      digest: expect.stringContaining('/api/auth/signout?reason=expired'),
    })
  })

  it('throws a retryable error when signed in without a usable token', async () => {
    await signIn({ accessValid: 'missing' })
    await expect(requireAuth()).rejects.toBeInstanceOf(SessionUnavailableError)
  })
})
