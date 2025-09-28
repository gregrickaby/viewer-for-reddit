import {NextRequest} from 'next/server'
import {logError} from './logError'
import {validateOrigin} from './validateOrigin'

// Mock the logError function
vi.mock('./logError', () => ({
  logError: vi.fn()
}))

const mockLogError = vi.mocked(logError)

// Helper to create NextRequest with headers
function createRequest(headers: Record<string, string>) {
  const request = new NextRequest('http://example.com/api/test')
  Object.entries(headers).forEach(([key, value]) => {
    request.headers.set(key, value)
  })
  return request
}

describe('validateOrigin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  describe('localhost validation', () => {
    it('should allow localhost in origin header', () => {
      const request = createRequest({
        origin: 'http://localhost:3000'
      })

      expect(validateOrigin(request)).toBe(true)
      expect(mockLogError).not.toHaveBeenCalled()
    })

    it('should allow localhost in referer header', () => {
      const request = createRequest({
        referer: 'http://localhost:3000/some-path'
      })

      expect(validateOrigin(request)).toBe(true)
      expect(mockLogError).not.toHaveBeenCalled()
    })

    it('should allow localhost with custom port', () => {
      const request = createRequest({
        origin: 'http://localhost:8080'
      })

      expect(validateOrigin(request)).toBe(true)
      expect(mockLogError).not.toHaveBeenCalled()
    })
  })

  describe('Coolify FQDN validation', () => {
    it('should allow exact COOLIFY_FQDN match in origin', () => {
      vi.stubEnv('COOLIFY_FQDN', 'myapp.example.com')

      const request = createRequest({
        origin: 'https://myapp.example.com'
      })

      expect(validateOrigin(request)).toBe(true)
      expect(mockLogError).not.toHaveBeenCalled()
    })

    it('should allow exact COOLIFY_FQDN match in referer', () => {
      vi.stubEnv('COOLIFY_FQDN', 'myapp.example.com')

      const request = createRequest({
        referer: 'https://myapp.example.com/some-path'
      })

      expect(validateOrigin(request)).toBe(true)
      expect(mockLogError).not.toHaveBeenCalled()
    })

    it('should reject subdomain when COOLIFY_FQDN is set', () => {
      vi.stubEnv('COOLIFY_FQDN', 'myapp.example.com')

      const request = createRequest({
        origin: 'https://sub.myapp.example.com'
      })

      expect(validateOrigin(request)).toBe(false)
      expect(mockLogError).toHaveBeenCalled()
    })
  })

  describe('ALLOWED_HOST validation', () => {
    it('should allow exact ALLOWED_HOST match in origin', () => {
      vi.stubEnv('ALLOWED_HOST', 'myapp.com')

      const request = createRequest({
        origin: 'https://myapp.com'
      })

      expect(validateOrigin(request)).toBe(true)
      expect(mockLogError).not.toHaveBeenCalled()
    })

    it('should allow ALLOWED_HOST subdomain match in origin', () => {
      vi.stubEnv('ALLOWED_HOST', 'myapp.com')

      const request = createRequest({
        origin: 'https://api.myapp.com'
      })

      expect(validateOrigin(request)).toBe(true)
      expect(mockLogError).not.toHaveBeenCalled()
    })

    it('should allow ALLOWED_HOST match in referer', () => {
      vi.stubEnv('ALLOWED_HOST', 'myapp.com')

      const request = createRequest({
        referer: 'https://myapp.com/some-path'
      })

      expect(validateOrigin(request)).toBe(true)
      expect(mockLogError).not.toHaveBeenCalled()
    })

    it('should reject non-matching domain when ALLOWED_HOST is set', () => {
      vi.stubEnv('ALLOWED_HOST', 'myapp.com')

      const request = createRequest({
        origin: 'https://evil.com'
      })

      expect(validateOrigin(request)).toBe(false)
      expect(mockLogError).toHaveBeenCalled()
    })
  })

  describe('priority and fallback behavior', () => {
    it('should prioritize localhost over other settings', () => {
      vi.stubEnv('COOLIFY_FQDN', 'myapp.example.com')
      vi.stubEnv('ALLOWED_HOST', 'myapp.com')

      const request = createRequest({
        origin: 'http://localhost:3000'
      })

      expect(validateOrigin(request)).toBe(true)
      expect(mockLogError).not.toHaveBeenCalled()
    })

    it('should prioritize COOLIFY_FQDN over ALLOWED_HOST', () => {
      vi.stubEnv('COOLIFY_FQDN', 'myapp.example.com')
      vi.stubEnv('ALLOWED_HOST', 'myapp.com')

      const request = createRequest({
        origin: 'https://myapp.example.com'
      })

      expect(validateOrigin(request)).toBe(true)
      expect(mockLogError).not.toHaveBeenCalled()
    })

    it('should fall back to ALLOWED_HOST when COOLIFY_FQDN does not match', () => {
      vi.stubEnv('COOLIFY_FQDN', 'different.example.com')
      vi.stubEnv('ALLOWED_HOST', 'myapp.com')

      const request = createRequest({
        origin: 'https://myapp.com'
      })

      expect(validateOrigin(request)).toBe(true)
      expect(mockLogError).not.toHaveBeenCalled()
    })
  })

  describe('edge cases and error conditions', () => {
    it('should reject request with no origin or referer headers', () => {
      const request = createRequest({})

      expect(validateOrigin(request)).toBe(false)
      expect(mockLogError).toHaveBeenCalledWith(
        'Request blocked due to invalid origin',
        expect.objectContaining({
          component: 'validateOrigin',
          action: 'validateOrigin',
          origin: 'none',
          referer: 'none'
        })
      )
    })

    it('should reject request with malformed origin URL', () => {
      const request = createRequest({
        origin: 'not-a-url'
      })

      expect(validateOrigin(request)).toBe(false)
      expect(mockLogError).toHaveBeenCalled()
    })

    it('should handle missing environment variables gracefully', () => {
      const request = createRequest({
        origin: 'https://example.com'
      })

      expect(validateOrigin(request)).toBe(false)
      expect(mockLogError).toHaveBeenCalledWith(
        'Request blocked due to invalid origin',
        expect.objectContaining({
          hasAllowedHost: false,
          hasCoolifyFqdn: false
        })
      )
    })

    it('should include all context in error log', () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('ALLOWED_HOST', 'myapp.com')
      vi.stubEnv('COOLIFY_FQDN', 'myapp.example.com')

      const request = createRequest({
        origin: 'https://evil.com',
        referer: 'https://evil.com/bad-path'
      })

      validateOrigin(request)

      expect(mockLogError).toHaveBeenCalledWith(
        'Request blocked due to invalid origin',
        {
          component: 'validateOrigin',
          action: 'validateOrigin',
          origin: 'https://evil.com',
          referer: 'https://evil.com/bad-path',
          nodeEnv: 'production',
          hasAllowedHost: true,
          hasCoolifyFqdn: true
        }
      )
    })
  })

  describe('URL parsing edge cases', () => {
    it('should handle URLs with ports correctly', () => {
      vi.stubEnv('ALLOWED_HOST', 'myapp.com')

      const request = createRequest({
        origin: 'https://myapp.com:8443'
      })

      expect(validateOrigin(request)).toBe(true)
      expect(mockLogError).not.toHaveBeenCalled()
    })

    it('should handle URLs with paths correctly', () => {
      vi.stubEnv('COOLIFY_FQDN', 'myapp.example.com')

      const request = createRequest({
        referer: 'https://myapp.example.com/api/test?param=value'
      })

      expect(validateOrigin(request)).toBe(true)
      expect(mockLogError).not.toHaveBeenCalled()
    })
  })

  describe('Security improvements', () => {
    it('should allow all origins in development mode', () => {
      vi.stubEnv('NODE_ENV', 'development')

      const maliciousOrigins = [
        'https://evil.com',
        'https://attacker.net',
        'https://malware.org',
        'https://totally-evil-localhost.com'
      ]

      maliciousOrigins.forEach((origin) => {
        const request = createRequest({origin})

        // Should allow everything in development
        expect(validateOrigin(request)).toBe(true)
        expect(mockLogError).not.toHaveBeenCalled()
      })
    })

    it('should block localhost bypass attempts with malicious domains', () => {
      const bypassAttempts = [
        'https://evil-localhost.com',
        'https://localhost.attacker.com',
        'https://my-localhost-site.net',
        'https://fake-localhost.co'
      ]

      bypassAttempts.forEach((maliciousOrigin) => {
        const request = createRequest({
          origin: maliciousOrigin
        })

        expect(validateOrigin(request)).toBe(false)
        expect(mockLogError).toHaveBeenCalledWith(
          'Request blocked due to invalid origin',
          expect.objectContaining({
            origin: maliciousOrigin
          })
        )
      })
    })

    it('should handle extremely long headers safely', () => {
      const longHeader = `https://evil.com/${'x'.repeat(5000)}`

      const request = createRequest({
        origin: longHeader
      })

      // Should not crash and should truncate
      expect(validateOrigin(request)).toBe(false)
      expect(mockLogError).toHaveBeenCalled()
    })

    it('should handle malformed URLs without crashing', () => {
      const malformedUrls = [
        'not-a-url',
        'https://',
        'https://[invalid',
        'ftp://invalid.com',
        ''
      ]

      malformedUrls.forEach((malformedUrl) => {
        const request = createRequest({
          origin: malformedUrl
        })

        // Should not throw an exception
        expect(() => validateOrigin(request)).not.toThrow()
        expect(validateOrigin(request)).toBe(false)
      })
    })

    it('should not log sensitive environment variables', () => {
      vi.stubEnv('COOLIFY_FQDN', 'secret-domain.com')
      vi.stubEnv('ALLOWED_HOST', 'secret-host.com')

      const request = createRequest({
        origin: 'https://evil.com'
      })

      validateOrigin(request)

      // Check that the actual secret values are not logged
      const logCall = mockLogError.mock.calls[0]
      const loggedContext = logCall[1]

      expect(loggedContext).not.toHaveProperty('allowedHost', 'secret-host.com')
      expect(loggedContext).not.toHaveProperty(
        'coolifyFqdn',
        'secret-domain.com'
      )
      expect(loggedContext).toHaveProperty('hasAllowedHost', true)
      expect(loggedContext).toHaveProperty('hasCoolifyFqdn', true)
    })
  })
})
