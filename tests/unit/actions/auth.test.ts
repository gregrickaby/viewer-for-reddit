import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeCookieJar, type FakeCookieJar } from '@/tests/helpers/cookie-jar'

const jar: { current: FakeCookieJar } = { current: fakeCookieJar() }
vi.mock('next/headers', () => ({ cookies: vi.fn(async () => jar.current) }))

const { signOut } = await import('@/app/actions/auth')
const { ACCESS_COOKIE, REFRESH_COOKIE, sealRefresh } = await import('@/lib/auth/cookies')

async function signedIn() {
  jar.current = fakeCookieJar({
    [ACCESS_COOKIE]: 'sealed-access',
    [REFRESH_COOKIE]: await sealRefresh({ v: 1, refreshToken: 'rt', username: 'u', scope: '' }),
  })
}

beforeEach(() => {
  jar.current = fakeCookieJar()
})

describe('signOut', () => {
  it('revokes the refresh token, clears cookies, and redirects home', async () => {
    await signedIn()
    const fetchMock = vi.fn(async () => new Response('', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(signOut()).rejects.toMatchObject({ digest: expect.stringContaining(';/;') })

    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit]
    expect(String(url)).toBe('https://www.reddit.test/api/v1/revoke_token')
    expect(String(init.body)).toBe('token=rt&token_type_hint=refresh_token')
    expect(jar.current.delete).toHaveBeenCalledWith(ACCESS_COOKIE)
    expect(jar.current.delete).toHaveBeenCalledWith(REFRESH_COOKIE)
  })

  it('still signs out when revocation fails', async () => {
    await signedIn()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 503 })),
    )
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(signOut()).rejects.toMatchObject({
      digest: expect.stringContaining('NEXT_REDIRECT'),
    })
    expect(warn).toHaveBeenCalled()
    expect(jar.current.store.size).toBe(0)
  })

  it('skips revocation when there is no session', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(signOut()).rejects.toMatchObject({
      digest: expect.stringContaining('NEXT_REDIRECT'),
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
