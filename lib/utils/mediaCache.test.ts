import {beforeEach, describe, expect, it, vi} from 'vitest'
import {MediaCache, getCachedUrl, prefetchMedia} from './mediaCache'

describe('MediaCache', () => {
  beforeEach(() => {
    document.head
      .querySelectorAll('link[rel="preload"]')
      .forEach((n) => n.remove())
    vi.restoreAllMocks()
  })

  it('adds, has and gets valid URLs', () => {
    const cache = new MediaCache(10, 10)
    const url = 'https://example.com/image.png'
    expect(cache.has(url)).toBe(false)
    expect(cache.get(url)).toBeNull()
    cache.add(url)
    expect(cache.has(url)).toBe(true)
    expect(cache.get(url)).toBe(url)
    expect(cache.size).toBe(1)
  })

  it('get returns null and warns for invalid url', () => {
    const cache = new MediaCache()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const result = cache.get('not-a-url')
    expect(result).toBeNull()
    expect(warn).toHaveBeenCalled()
  })

  it('add ignores invalid url and warns', () => {
    const cache = new MediaCache()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    cache.add('also-invalid')
    expect(cache.size).toBe(0)
    expect(warn).toHaveBeenCalled()
  })

  it('prefetch appends a preload link and caches on load', async () => {
    const cache = new MediaCache()
    const url = 'https://example.com/prefetch.jpg'
    const p = cache.prefetch(url, 'image')
    const link = document.head.querySelector(`link[href="${url}"]`)
    expect(link).toBeTruthy()
    link?.dispatchEvent(new Event('load'))
    await p
    expect(cache.has(url)).toBe(true)
    link?.remove()
  })

  it('prefetch with invalid url warns and does not throw', async () => {
    const cache = new MediaCache()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    await cache.prefetch('not-a-url' as any, 'image')
    expect(warn).toHaveBeenCalled()
  })

  it('enforces maxSize (LRU) and expires old entries', () => {
    let now = 1_000_000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    const cache = new MediaCache(2, 1)
    const a = 'https://a.test/img.png'
    const b = 'https://b.test/img.png'
    const c = 'https://c.test/img.png'
    cache.add(a)
    now += 1000
    cache.add(b)
    now += 1000
    cache.add(c)
    expect(cache.size).toBe(2)
    expect(cache.has(a)).toBe(false)
    expect(cache.has(b)).toBe(true)
    expect(cache.has(c)).toBe(true)
    now += 120_000
    expect(cache.has(b)).toBe(false)
    expect(cache.has(c)).toBe(false)
    expect(cache.size).toBe(0)
    vi.restoreAllMocks()
  })

  it('getCachedUrl returns the raw url when not cached', () => {
    const url = 'https://not-cached.test/foo'
    expect(getCachedUrl(url)).toBe(url)
  })

  it('prefetchMedia (helper) uses singleton and does not blow up', async () => {
    const url = 'https://singleton.test/img.jpg'
    const p = prefetchMedia(url, 'image')
    const link = document.head.querySelector(`link[href="${url}"]`)
    expect(link).toBeTruthy()
    link?.dispatchEvent(new Event('load'))
    await p
    link?.remove()
  })
})
