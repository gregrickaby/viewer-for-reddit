import {describe, expect, it} from 'vitest'
import {isSafeRedditPath} from './validateRedditPath'

describe('isSafeRedditPath', () => {
  it('should accept valid Reddit API paths', () => {
    expect(isSafeRedditPath('/r/programming/hot.json')).toBe(true)
    expect(isSafeRedditPath('/user/spez/about.json')).toBe(true)
    expect(isSafeRedditPath('/subreddits/mine/subscriber')).toBe(true)
    expect(isSafeRedditPath('/api/multi/user/test/m/multi')).toBe(true)
  })

  it('should reject empty or missing paths', () => {
    expect(isSafeRedditPath('')).toBe(false)
    expect(isSafeRedditPath(null as any)).toBe(false)
    expect(isSafeRedditPath(undefined as any)).toBe(false)
  })

  it('should reject paths without leading slash', () => {
    expect(isSafeRedditPath('r/programming/hot.json')).toBe(false)
    expect(isSafeRedditPath('api/v1/me')).toBe(false)
  })

  it('should reject protocol-relative URLs', () => {
    expect(isSafeRedditPath('//evil.com/api')).toBe(false)
    expect(isSafeRedditPath('//localhost/api')).toBe(false)
  })

  it('should reject absolute URLs', () => {
    expect(isSafeRedditPath('http://evil.com/api')).toBe(false)
    expect(isSafeRedditPath('https://evil.com/api')).toBe(false)
  })

  it('should reject path traversal attempts', () => {
    expect(isSafeRedditPath('/r/../etc/passwd')).toBe(false)
    expect(isSafeRedditPath('/../secrets')).toBe(false)
    expect(isSafeRedditPath('/r/test/../../admin')).toBe(false)
  })

  it('should reject fragment identifiers', () => {
    expect(isSafeRedditPath('/r/programming#fragment')).toBe(false)
    expect(isSafeRedditPath('/api/v1/me#admin')).toBe(false)
  })
})
