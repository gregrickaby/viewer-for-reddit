import {describe, expect, it} from 'vitest'
import {extractAvatarUrl, validateRedditUser} from './redditUserValidator'

describe('validateRedditUser', () => {
  it('should validate user with all fields', () => {
    const data = {
      name: 'testuser',
      id: 't2_abc123',
      icon_img: 'https://example.com/icon.png',
      snoovatar_img: 'https://example.com/snoovatar.png'
    }

    const result = validateRedditUser(data)

    expect(result).toEqual({
      name: 'testuser',
      id: 't2_abc123',
      icon_img: 'https://example.com/icon.png',
      snoovatar_img: 'https://example.com/snoovatar.png'
    })
  })

  it('should validate user with only required fields', () => {
    const data = {
      name: 'testuser'
    }

    const result = validateRedditUser(data)

    expect(result).toEqual({
      name: 'testuser',
      icon_img: undefined,
      snoovatar_img: undefined,
      id: undefined
    })
  })

  it('should throw error for null data', () => {
    expect(() => validateRedditUser(null)).toThrow(
      'Invalid user data structure'
    )
  })

  it('should throw error for non-object data', () => {
    expect(() => validateRedditUser('string')).toThrow(
      'Invalid user data structure'
    )
    expect(() => validateRedditUser(123)).toThrow('Invalid user data structure')
    expect(() => validateRedditUser(undefined)).toThrow(
      'Invalid user data structure'
    )
  })

  it('should throw error for missing username', () => {
    const data = {
      id: 't2_abc123'
    }

    expect(() => validateRedditUser(data)).toThrow(
      'Invalid username in Reddit response'
    )
  })

  it('should throw error for empty username', () => {
    const data = {
      name: ''
    }

    expect(() => validateRedditUser(data)).toThrow(
      'Invalid username in Reddit response'
    )
  })

  it('should throw error for non-string username', () => {
    const data = {
      name: 12345
    }

    expect(() => validateRedditUser(data)).toThrow(
      'Invalid username in Reddit response'
    )
  })

  it('should sanitize invalid icon_img type', () => {
    const data = {
      name: 'testuser',
      icon_img: 12345 // Invalid type
    }

    const result = validateRedditUser(data)

    expect(result.icon_img).toBeUndefined()
  })

  it('should sanitize invalid snoovatar_img type', () => {
    const data = {
      name: 'testuser',
      snoovatar_img: {url: 'test'} // Invalid type
    }

    const result = validateRedditUser(data)

    expect(result.snoovatar_img).toBeUndefined()
  })

  it('should handle extra fields gracefully', () => {
    const data = {
      name: 'testuser',
      id: 't2_abc123',
      extra_field: 'should be ignored',
      another_field: 123
    }

    const result = validateRedditUser(data)

    expect(result).toEqual({
      name: 'testuser',
      id: 't2_abc123',
      icon_img: undefined,
      snoovatar_img: undefined
    })
  })
})

describe('extractAvatarUrl', () => {
  it('should prefer snoovatar over icon_img', () => {
    const user = {
      name: 'testuser',
      icon_img: 'https://example.com/icon.png',
      snoovatar_img: 'https://example.com/snoovatar.png'
    }

    const result = extractAvatarUrl(user)

    expect(result).toBe('https://example.com/snoovatar.png')
  })

  it('should fallback to icon_img when no snoovatar', () => {
    const user = {
      name: 'testuser',
      icon_img: 'https://example.com/icon.png'
    }

    const result = extractAvatarUrl(user)

    expect(result).toBe('https://example.com/icon.png')
  })

  it('should return undefined when no avatar fields', () => {
    const user = {
      name: 'testuser'
    }

    const result = extractAvatarUrl(user)

    expect(result).toBeUndefined()
  })

  it('should decode HTML entities in URLs', () => {
    const user = {
      name: 'testuser',
      icon_img: 'https://example.com/icon.png?param=value&amp;other=test'
    }

    const result = extractAvatarUrl(user)

    expect(result).toBe('https://example.com/icon.png?param=value&other=test')
  })

  it('should reject HTTP URLs (not HTTPS)', () => {
    const user = {
      name: 'testuser',
      icon_img: 'http://example.com/icon.png' // HTTP, not HTTPS
    }

    const result = extractAvatarUrl(user)

    expect(result).toBeUndefined()
  })

  it('should reject non-URL strings', () => {
    const user = {
      name: 'testuser',
      icon_img: 'not-a-url'
    }

    const result = extractAvatarUrl(user)

    expect(result).toBeUndefined()
  })

  it('should handle complex HTML entities', () => {
    const user = {
      name: 'testuser',
      snoovatar_img:
        'https://example.com/avatar.png?param=value&amp;other=test&lt;tag&gt;'
    }

    const result = extractAvatarUrl(user)

    expect(result).toBe(
      'https://example.com/avatar.png?param=value&other=test<tag>'
    )
  })

  it('should return undefined for empty avatar strings', () => {
    const user = {
      name: 'testuser',
      icon_img: ''
    }

    const result = extractAvatarUrl(user)

    expect(result).toBeUndefined()
  })
})
