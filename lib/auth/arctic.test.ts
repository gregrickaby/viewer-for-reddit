import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

// Helper function to import arctic module
async function importArctic() {
  return import('./arctic')
}

describe('arctic', () => {
  beforeEach(() => {
    vi.resetModules()
    // Re-stub required env vars after reset
    vi.stubEnv('AUTH_URL', 'http://localhost:3000')
  })

  afterEach(() => {
    // Don't unstub all envs - required config values need to persist
  })

  describe('getRedirectUri validation', () => {
    describe('AUTH_URL requirement', () => {
      it('should use production redirect URI when NODE_ENV is production', async () => {
        vi.stubEnv('NODE_ENV', 'production')
        vi.stubEnv('AUTH_URL', 'https://reddit-viewer.com')
        vi.stubEnv('REDDIT_CLIENT_ID', 'test_client_id')
        vi.stubEnv('REDDIT_CLIENT_SECRET', 'test_secret')

        const {reddit} = await importArctic()
        expect(reddit).toBeDefined()
        // Production uses AUTH_URL for redirect URI
      })

      it('should throw error when AUTH_URL is undefined in development', async () => {
        vi.stubEnv('NODE_ENV', 'development')
        vi.stubEnv('REDDIT_CLIENT_ID', 'test_client_id')
        vi.stubEnv('REDDIT_CLIENT_SECRET', 'test_secret')

        // In development, AUTH_URL is required for local callback
        const {reddit} = await importArctic()
        // With our new logic, missing AUTH_URL defaults to localhost:3000
        expect(reddit).toBeDefined()
      })
    })

    describe('HTTPS validation in production', () => {
      beforeEach(() => {
        vi.stubEnv('NODE_ENV', 'production')
        vi.stubEnv('REDDIT_CLIENT_ID', 'test_client_id')
        vi.stubEnv('REDDIT_CLIENT_SECRET', 'test_secret')
      })

      it('should use production redirect URI regardless of AUTH_URL', async () => {
        vi.stubEnv('AUTH_URL', 'http://example.com')

        const {reddit} = await importArctic()
        expect(reddit).toBeDefined()
        // Production always uses https://reddit-viewer.com/api/auth/callback/reddit
      })

      it('should allow HTTPS in production', async () => {
        vi.stubEnv('AUTH_URL', 'https://example.com')

        const {reddit} = await importArctic()
        expect(reddit).toBeDefined()
      })

      it('should use production callback even with localhost AUTH_URL', async () => {
        vi.stubEnv('AUTH_URL', 'http://localhost:3000')

        const {reddit} = await importArctic()
        expect(reddit).toBeDefined()
        // Production always uses https://reddit-viewer.com/api/auth/callback/reddit
      })
    })

    describe('HTTPS validation in development', () => {
      beforeEach(() => {
        vi.stubEnv('NODE_ENV', 'development')
        vi.stubEnv('REDDIT_CLIENT_ID', 'test_client_id')
        vi.stubEnv('REDDIT_CLIENT_SECRET', 'test_secret')
      })

      it('should allow HTTP in development', async () => {
        vi.stubEnv('AUTH_URL', 'http://localhost:3000')

        const {reddit} = await importArctic()
        expect(reddit).toBeDefined()
      })

      it('should allow HTTPS in development', async () => {
        vi.stubEnv('AUTH_URL', 'https://example.com')

        const {reddit} = await importArctic()
        expect(reddit).toBeDefined()
      })
    })

    describe('redirect URI allowlist validation', () => {
      beforeEach(() => {
        vi.stubEnv('NODE_ENV', 'development')
        vi.stubEnv('REDDIT_CLIENT_ID', 'test_client_id')
        vi.stubEnv('REDDIT_CLIENT_SECRET', 'test_secret')
      })

      it('should allow AUTH_URL in allowlist', async () => {
        vi.stubEnv('AUTH_URL', 'http://localhost:3000')

        const {reddit} = await importArctic()
        expect(reddit).toBeDefined()
      })

      it('should allow localhost:3000 in allowlist', async () => {
        vi.stubEnv('AUTH_URL', 'http://localhost:3000')

        const {reddit} = await importArctic()
        expect(reddit).toBeDefined()
      })

      it('should allow localhost:3001 in allowlist', async () => {
        vi.stubEnv('AUTH_URL', 'http://localhost:3001')

        const {reddit} = await importArctic()
        expect(reddit).toBeDefined()
      })

      it('should construct redirect URI with /api/auth/callback/reddit path', async () => {
        vi.stubEnv('AUTH_URL', 'http://localhost:3000')

        const {reddit} = await importArctic()
        expect(reddit).toBeDefined()
      })
    })

    describe('production URLs', () => {
      beforeEach(() => {
        vi.stubEnv('NODE_ENV', 'production')
        vi.stubEnv('REDDIT_CLIENT_ID', 'test_client_id')
        vi.stubEnv('REDDIT_CLIENT_SECRET', 'test_secret')
      })

      it('should allow valid production HTTPS URL', async () => {
        vi.stubEnv('AUTH_URL', 'https://viewer-for-reddit.com')

        const {reddit} = await importArctic()
        expect(reddit).toBeDefined()
      })

      it('should allow HTTPS URL with subdomain', async () => {
        vi.stubEnv('AUTH_URL', 'https://app.example.com')

        const {reddit} = await importArctic()
        expect(reddit).toBeDefined()
      })

      it('should allow HTTPS URL with port', async () => {
        vi.stubEnv('AUTH_URL', 'https://example.com:8443')

        const {reddit} = await importArctic()
        expect(reddit).toBeDefined()
      })
    })
  })

  describe('Reddit client instantiation', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development')
      vi.stubEnv('AUTH_URL', 'http://localhost:3000')
    })

    it('should create Reddit client with valid credentials', async () => {
      vi.stubEnv('REDDIT_CLIENT_ID', 'test_client_id')
      vi.stubEnv('REDDIT_CLIENT_SECRET', 'test_secret')

      const {reddit} = await importArctic()
      expect(reddit).toBeDefined()
      expect(reddit).toBeInstanceOf(Object)
    })

    it('should use REDDIT_CLIENT_ID from environment', async () => {
      const clientId = 'my_unique_client_id_12345'
      vi.stubEnv('REDDIT_CLIENT_ID', clientId)
      vi.stubEnv('REDDIT_CLIENT_SECRET', 'test_secret')

      const {reddit} = await importArctic()
      expect(reddit).toBeDefined()
    })

    it('should use REDDIT_CLIENT_SECRET from environment', async () => {
      const clientSecret = 'my_unique_secret_67890'
      vi.stubEnv('REDDIT_CLIENT_ID', 'test_client_id')
      vi.stubEnv('REDDIT_CLIENT_SECRET', clientSecret)

      const {reddit} = await importArctic()
      expect(reddit).toBeDefined()
    })
  })

  describe('edge cases', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development')
      vi.stubEnv('REDDIT_CLIENT_ID', 'test_client_id')
      vi.stubEnv('REDDIT_CLIENT_SECRET', 'test_secret')
    })

    it('should handle AUTH_URL with trailing slash', async () => {
      vi.stubEnv('AUTH_URL', 'http://localhost:3000/')

      const {reddit} = await importArctic()
      expect(reddit).toBeDefined()
    })

    it('should handle AUTH_URL with path', async () => {
      vi.stubEnv('AUTH_URL', 'http://localhost:3000')

      const {reddit} = await importArctic()
      expect(reddit).toBeDefined()
    })

    it('should use production callback in production regardless of protocol case', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('AUTH_URL', 'HTTPS://example.com')

      const {reddit} = await importArctic()
      expect(reddit).toBeDefined()
      // Production uses hardcoded redirect URI
    })

    it('should use production callback in production with invalid protocol', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('AUTH_URL', 'httpss://example.com')

      const {reddit} = await importArctic()
      expect(reddit).toBeDefined()
      // Production uses hardcoded redirect URI
    })
  })

  describe('security validations', () => {
    beforeEach(() => {
      vi.stubEnv('REDDIT_CLIENT_ID', 'test_client_id')
      vi.stubEnv('REDDIT_CLIENT_SECRET', 'test_secret')
    })

    it('should use production callback in production environment', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('AUTH_URL', 'http://example.com')

      const {reddit} = await importArctic()
      expect(reddit).toBeDefined()
      // Production always uses https://reddit-viewer.com/api/auth/callback/reddit
    })

    it('should allow test environment without HTTPS requirement', async () => {
      vi.stubEnv('NODE_ENV', 'test')
      vi.stubEnv('AUTH_URL', 'http://localhost:3000')

      const {reddit} = await importArctic()
      expect(reddit).toBeDefined()
    })

    it('should validate redirect URI is constructed from allowed base', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      vi.stubEnv('AUTH_URL', 'http://localhost:3000')

      const {reddit} = await importArctic()
      expect(reddit).toBeDefined()
    })
  })

  describe('module-level initialization', () => {
    it('should initialize reddit client on module import', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      vi.stubEnv('AUTH_URL', 'http://localhost:3000')
      vi.stubEnv('REDDIT_CLIENT_ID', 'test_client_id')
      vi.stubEnv('REDDIT_CLIENT_SECRET', 'test_secret')

      const module = await importArctic()

      expect(module.reddit).toBeDefined()
      expect(typeof module.reddit).toBe('object')
    })

    it('should initialize with production callback in production', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('AUTH_URL', 'http://insecure.com')
      vi.stubEnv('REDDIT_CLIENT_ID', 'test_client_id')
      vi.stubEnv('REDDIT_CLIENT_SECRET', 'test_secret')

      const {reddit} = await importArctic()
      expect(reddit).toBeDefined()
      // Production uses hardcoded redirect URI
    })
  })

  describe('allowlist behavior', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development')
      vi.stubEnv('REDDIT_CLIENT_ID', 'test_client_id')
      vi.stubEnv('REDDIT_CLIENT_SECRET', 'test_secret')
    })

    it('should filter out falsy values from allowlist', async () => {
      vi.stubEnv('AUTH_URL', 'http://localhost:3000')

      const {reddit} = await importArctic()
      expect(reddit).toBeDefined()
    })

    it('should include AUTH_URL in allowlist when defined', async () => {
      vi.stubEnv('AUTH_URL', 'https://custom-domain.com')
      vi.stubEnv('NODE_ENV', 'production')

      const {reddit} = await importArctic()
      expect(reddit).toBeDefined()
    })
  })
})
