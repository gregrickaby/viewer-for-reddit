import {
  sanitizeLocationData,
  sanitizeUrl
} from '@/lib/utils/validation/urlSanitizer'

describe('urlSanitizer', () => {
  describe('sanitizeUrl', () => {
    it('should remove sensitive query parameters', () => {
      const url =
        'https://example.com/path?token=secret123&name=john&api_key=abc123'
      const result = sanitizeUrl(url)
      expect(result).toBe('https://example.com/path?name=john')
    })

    it('should handle multiple sensitive parameters', () => {
      const url =
        'https://example.com/?password=secret&csrf_token=xyz&client_secret=hidden&safe=value'
      const result = sanitizeUrl(url)
      expect(result).toBe('https://example.com/?safe=value')
    })

    it('should handle case variations of sensitive parameters', () => {
      const url =
        'https://example.com/?TOKEN=secret&Api_Key=hidden&PASSWORD=pwd&name=safe'
      const result = sanitizeUrl(url)
      expect(result).toBe('https://example.com/?name=safe')
    })

    it('should handle Reddit-specific sensitive parameters', () => {
      const url =
        'https://reddit.com/callback?code=auth123&state=xyz&client_id=reddit123&name=safe'
      const result = sanitizeUrl(url)
      expect(result).toBe('https://reddit.com/callback?name=safe')
    })

    it('should return original URL when no sensitive parameters exist', () => {
      const url = 'https://example.com/path?name=john&category=tech'
      const result = sanitizeUrl(url)
      expect(result).toBe(url)
    })

    it('should handle URLs without query parameters', () => {
      const url = 'https://example.com/path'
      const result = sanitizeUrl(url)
      expect(result).toBe(url)
    })

    it('should handle empty query string', () => {
      const url = 'https://example.com/path?'
      const result = sanitizeUrl(url)
      expect(result).toBe('https://example.com/path')
    })

    it('should handle invalid URLs gracefully', () => {
      const invalidUrl = 'not-a-url'
      const result = sanitizeUrl(invalidUrl)
      expect(result).toBe('[INVALID_URL]')
    })

    it('should handle relative URLs', () => {
      const url = '/path?token=secret&name=john'
      // This will fail parsing as relative URL without base, should return fallback
      const result = sanitizeUrl(url)
      expect(result).toBe('[INVALID_URL]')
    })

    it('should preserve hash fragments', () => {
      const url = 'https://example.com/path?token=secret&name=john#section'
      const result = sanitizeUrl(url)
      expect(result).toBe('https://example.com/path?name=john#section')
    })
  })

  describe('sanitizeLocationData', () => {
    it('should sanitize href and search properties', () => {
      const location = {
        pathname: '/path',
        search: '?token=secret&name=safe',
        hash: '#section',
        href: 'https://example.com/path?token=secret&name=safe#section',
        origin: 'https://example.com',
        host: 'example.com',
        hostname: 'example.com',
        port: '443',
        protocol: 'https:'
      }

      const result = sanitizeLocationData(location)

      expect(result.pathname).toBe('/path')
      expect(result.search).toBe('?name=safe')
      expect(result.hash).toBe('#section')
      expect(result.href).toBe('https://example.com/path?name=safe#section')
      expect(result.origin).toBe('https://example.com')
      expect(result.host).toBe('example.com')
      expect(result.hostname).toBe('example.com')
      expect(result.port).toBe('443')
      expect(result.protocol).toBe('https:')
    })

    it('should handle partial location objects', () => {
      const location = {
        pathname: '/path',
        href: 'https://example.com/path?password=secret'
      }

      const result = sanitizeLocationData(location)

      expect(result.pathname).toBe('/path')
      expect(result.href).toBe('https://example.com/path')
      expect(result.search).toBeUndefined()
      expect(result.origin).toBeUndefined()
    })

    it('should handle empty search string', () => {
      const location = {
        pathname: '/path',
        search: '',
        href: 'https://example.com/path'
      }

      const result = sanitizeLocationData(location)

      expect(result.search).toBe('')
      expect(result.href).toBe('https://example.com/path')
    })

    it('should handle search string with only sensitive parameters', () => {
      const location = {
        pathname: '/path',
        search: '?token=secret&password=hidden',
        href: 'https://example.com/path?token=secret&password=hidden'
      }

      const result = sanitizeLocationData(location)

      expect(result.search).toBe('')
      expect(result.href).toBe('https://example.com/path')
    })

    it('should preserve hash fragments as they are client-side only', () => {
      const location = {
        pathname: '/path',
        hash: '#token=secret&data=sensitive',
        href: 'https://example.com/path#token=secret&data=sensitive'
      }

      const result = sanitizeLocationData(location)

      expect(result.hash).toBe('#token=secret&data=sensitive')
      // href should still be sanitized for query params but hash preserved
      expect(result.href).toBe(
        'https://example.com/path#token=secret&data=sensitive'
      )
    })
  })
})
