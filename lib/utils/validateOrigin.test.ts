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

    it('should handle comma-separated COOLIFY_FQDN domains', () => {
      vi.stubEnv('COOLIFY_FQDN', 'myapp.example.com,www.myapp.example.com')

      const firstDomainRequest = createRequest({
        origin: 'https://myapp.example.com'
      })
      const secondDomainRequest = createRequest({
        origin: 'https://www.myapp.example.com'
      })

      expect(validateOrigin(firstDomainRequest)).toBe(true)
      expect(validateOrigin(secondDomainRequest)).toBe(true)
      expect(mockLogError).not.toHaveBeenCalled()
    })

    it('should handle comma-separated domains with whitespace', () => {
      vi.stubEnv('COOLIFY_FQDN', ' myapp.example.com , www.myapp.example.com ')

      const request = createRequest({
        origin: 'https://www.myapp.example.com'
      })

      expect(validateOrigin(request)).toBe(true)
      expect(mockLogError).not.toHaveBeenCalled()
    })

    it('should reject invalid domains in comma-separated list', () => {
      vi.stubEnv('COOLIFY_FQDN', 'myapp.example.com,www.myapp.example.com')

      const request = createRequest({
        origin: 'https://evil.com'
      })

      expect(validateOrigin(request)).toBe(false)
      expect(mockLogError).toHaveBeenCalled()
    })

    it('should handle empty domains in comma-separated list', () => {
      vi.stubEnv('COOLIFY_FQDN', 'myapp.example.com,,www.myapp.example.com,')

      const request = createRequest({
        origin: 'https://www.myapp.example.com'
      })

      expect(validateOrigin(request)).toBe(true)
      expect(mockLogError).not.toHaveBeenCalled()
    })
  })

  describe('priority and fallback behavior', () => {
    it('should prioritize localhost over other settings', () => {
      vi.stubEnv('COOLIFY_FQDN', 'myapp.example.com')

      const request = createRequest({
        origin: 'http://localhost:3000'
      })

      expect(validateOrigin(request)).toBe(true)
      expect(mockLogError).not.toHaveBeenCalled()
    })
  })

  describe('edge cases and error conditions', () => {
    it('should allow request with no origin or referer headers', () => {
      // This handles legitimate same-origin requests where browsers don't send headers
      // (e.g., privacy settings, browser policies, or navigation requests)
      const request = createRequest({})

      expect(validateOrigin(request)).toBe(true)
      expect(mockLogError).not.toHaveBeenCalled()
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
        'Request blocked: origin validation failed',
        expect.objectContaining({
          hasCoolifyFqdn: false,
          reason: 'No COOLIFY_FQDN configured and not localhost'
        })
      )
    })

    it('should include all context in error log', () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('COOLIFY_FQDN', 'myapp.example.com')

      const request = createRequest({
        origin: 'https://evil.com',
        referer: 'https://evil.com/bad-path'
      })

      validateOrigin(request)

      expect(mockLogError).toHaveBeenCalledWith(
        'Request blocked: origin validation failed',
        {
          component: 'validateOrigin',
          action: 'validateOrigin',
          origin: 'https://evil.com',
          referer: 'https://evil.com/bad-path',
          nodeEnv: 'production',
          hasCoolifyFqdn: true,
          reason: 'Both headers present but neither matches COOLIFY_FQDN'
        }
      )
    })
  })

  describe('URL parsing edge cases', () => {
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
          'Request blocked: origin validation failed',
          expect.objectContaining({
            origin: maliciousOrigin,
            reason: 'No COOLIFY_FQDN configured and not localhost'
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
        // eslint-disable-next-line no-script-url -- Testing malformed URL handling
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        '//evil.com',
        'https://[invalid'
      ]

      malformedUrls.forEach((malformedUrl) => {
        const request = createRequest({
          origin: malformedUrl
        })

        // Should not throw an exception
        expect(() => validateOrigin(request)).not.toThrow()
        // Malformed URLs should be blocked (invalid origin header present)
        expect(validateOrigin(request)).toBe(false)
      })
    })

    it('should not log sensitive environment variables', () => {
      vi.stubEnv('COOLIFY_FQDN', 'secret-domain.com')

      const request = createRequest({
        origin: 'https://evil.com'
      })

      validateOrigin(request)

      // Check that the actual secret values are not logged
      const logCall = mockLogError.mock.calls[0]
      const loggedContext = logCall[1]

      expect(loggedContext).not.toHaveProperty(
        'coolifyFqdn',
        'secret-domain.com'
      )
      expect(loggedContext).toHaveProperty('hasCoolifyFqdn', true)
    })
  })
})
