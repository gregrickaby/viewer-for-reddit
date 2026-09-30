import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeCookieJar } from '@/tests/helpers/cookie-jar'

const jar = { current: fakeCookieJar() }
const refresh = vi.fn()
vi.mock('next/headers', () => ({ cookies: vi.fn(async () => jar.current) }))
vi.mock('next/cache', () => ({ refresh, io: vi.fn(async () => {}) }))

const { setBlurNsfw, setTheme } = await import('@/app/actions/settings')
const { getSettings } = await import('@/lib/settings')
const { requestTime } = await import('@/lib/request-time')

const form = (key: string, value: string) => {
  const data = new FormData()
  data.set(key, value)
  return data
}

beforeEach(() => {
  jar.current = fakeCookieJar()
  refresh.mockClear()
})

describe('setTheme', () => {
  it('sets a readable one-year cookie without re-rendering', async () => {
    expect(await setTheme(form('theme', 'dark'))).toEqual({ ok: true, data: undefined })
    expect(jar.current.set).toHaveBeenCalledWith('rv_theme', 'dark', {
      path: '/',
      maxAge: 31_536_000,
      sameSite: 'lax',
      secure: true,
      httpOnly: false,
    })
    expect(refresh).not.toHaveBeenCalled()
  })

  it('rejects unknown themes', async () => {
    expect((await setTheme(form('theme', 'sepia'))).ok).toBe(false)
    expect(jar.current.set).not.toHaveBeenCalled()
  })
})

describe('setBlurNsfw', () => {
  it('sets an httpOnly one-year cookie and re-renders', async () => {
    expect(await setBlurNsfw(form('blur', 'off'))).toEqual({ ok: true, data: { blur: false } })
    expect(jar.current.set).toHaveBeenCalledWith(
      'rv_blur_nsfw',
      'off',
      expect.objectContaining({ httpOnly: true, maxAge: 31_536_000 }),
    )
    expect(refresh).toHaveBeenCalledOnce()
    expect(await setBlurNsfw(form('blur', 'on'))).toMatchObject({ data: { blur: true } })
  })

  it('rejects anything else', async () => {
    expect((await setBlurNsfw(form('blur', 'maybe'))).ok).toBe(false)
    expect(refresh).not.toHaveBeenCalled()
  })
})

describe('getSettings', () => {
  it('defaults to the system theme with blur off', async () => {
    expect(await getSettings()).toEqual({ theme: 'system', blurNsfw: false })
  })

  it('reads saved values and ignores junk', async () => {
    jar.current = fakeCookieJar({ rv_theme: 'light', rv_blur_nsfw: 'on' })
    expect(await getSettings()).toEqual({ theme: 'light', blurNsfw: true })
    jar.current = fakeCookieJar({ rv_theme: 'neon', rv_blur_nsfw: 'nope' })
    expect(await getSettings()).toEqual({ theme: 'system', blurNsfw: false })
  })
})

describe('requestTime', () => {
  it('reads the clock after io()', async () => {
    const before = Date.now()
    expect(await requestTime()).toBeGreaterThanOrEqual(before)
  })
})
