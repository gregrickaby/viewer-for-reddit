import {describe, expect, it, vi} from 'vitest'

// Mock dependencies BEFORE module imports
vi.mock('@/lib/axiom/server', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

import {assertRedditUrl} from './_helpers'

describe('assertRedditUrl', () => {
  it('accepts oauth.reddit.com URLs', () => {
    expect(() =>
      assertRedditUrl('https://oauth.reddit.com/r/popular/hot.json')
    ).not.toThrow()
  })

  it('accepts www.reddit.com URLs', () => {
    expect(() =>
      assertRedditUrl('https://www.reddit.com/r/popular/hot.json')
    ).not.toThrow()
  })

  it('accepts reddit.com URLs', () => {
    expect(() =>
      assertRedditUrl('https://reddit.com/r/popular/hot.json')
    ).not.toThrow()
  })

  it('rejects non-Reddit domains', () => {
    expect(() => assertRedditUrl('https://evil.com/steal-data')).toThrow(
      'Invalid request destination'
    )
  })

  it('rejects HTTP (non-HTTPS) URLs', () => {
    expect(() =>
      assertRedditUrl('http://oauth.reddit.com/r/popular/hot.json')
    ).toThrow('Invalid protocol - HTTPS required')
  })

  it('rejects malformed URLs', () => {
    expect(() => assertRedditUrl('not-a-url')).toThrow('Invalid URL format')
  })
})
