import { describe, expect, it } from 'vitest'
import { REDDIT_MEDIA_HOSTS, hostMatches, safeLinkUrl, safeMediaUrl } from '@/lib/media/url'

describe('hostMatches', () => {
  it('matches exact hosts and dot-suffixes, case-insensitively', () => {
    expect(hostMatches('I.REDD.IT', REDDIT_MEDIA_HOSTS)).toBe(true)
    expect(hostMatches('i.imgur.com', ['i.imgur.com'])).toBe(true)
    expect(hostMatches('imgur.com', ['i.imgur.com'])).toBe(false)
  })

  it('rejects look-alikes', () => {
    expect(hostMatches('redd.it.evil.com', REDDIT_MEDIA_HOSTS)).toBe(false)
    expect(hostMatches('evilredd.it', REDDIT_MEDIA_HOSTS)).toBe(false)
    // The apex is Reddit's shortlink domain, not a media host.
    expect(hostMatches('redd.it', REDDIT_MEDIA_HOSTS)).toBe(false)
  })
})

describe('safeMediaUrl', () => {
  it('accepts Reddit media hosts and keeps signed query strings', () => {
    const url = 'https://preview.redd.it/a.jpg?width=640&crop=smart&auto=webp&s=abc'
    expect(safeMediaUrl(url)).toBe(url)
    expect(safeMediaUrl('https://styles.redditmedia.com/i.png')).toBe(
      'https://styles.redditmedia.com/i.png',
    )
  })

  it('upgrades http to https', () => {
    expect(safeMediaUrl('http://i.redd.it/a.gif')).toBe('https://i.redd.it/a.gif')
  })

  it.each([
    ['other hosts', 'https://example.com/a.jpg'],
    ['non-web schemes', 'javascript:alert(1)'],
    ['data URLs', 'data:image/png;base64,AAAA'],
    ['credentials', 'https://user:pass@i.redd.it/a.jpg'],
    ['sentinels', 'nsfw'],
    ['empty strings', ''],
    ['non-strings', 42],
  ])('rejects %s', (_, value) => {
    expect(safeMediaUrl(value)).toBeNull()
  })

  it('accepts a custom host list', () => {
    expect(safeMediaUrl('https://i.imgur.com/a.mp4', ['i.imgur.com'])).toBe(
      'https://i.imgur.com/a.mp4',
    )
  })
})

describe('safeLinkUrl', () => {
  it('accepts http and https on any host', () => {
    expect(safeLinkUrl(' https://example.com/a ')).toBe('https://example.com/a')
    expect(safeLinkUrl('http://example.com')).toBe('http://example.com/')
  })

  it('rejects everything else', () => {
    expect(safeLinkUrl('javascript:alert(1)')).toBeNull()
    expect(safeLinkUrl('not a url')).toBeNull()
    expect(safeLinkUrl(undefined)).toBeNull()
  })
})
