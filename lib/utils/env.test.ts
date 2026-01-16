import {beforeEach, describe, expect, it, vi} from 'vitest'
import {
  getAnalyticsConfig,
  getEnvVar,
  getOptionalEnvVar,
  isDevelopment,
  isProduction,
  isTest,
  validateEnv
} from './env'

describe('env', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = {...originalEnv}
  })

  describe('validateEnv', () => {
    it('passes when all required environment variables are set', () => {
      process.env.REDDIT_CLIENT_ID = 'test-client-id'
      process.env.REDDIT_CLIENT_SECRET = 'test-client-secret'
      process.env.REDDIT_REDIRECT_URI =
        'http://localhost:3000/api/auth/callback'
      process.env.SESSION_SECRET = 'a'.repeat(32)
      process.env.BASE_URL = 'http://localhost:3000'
      process.env.USER_AGENT = 'TestApp/1.0'

      expect(() => validateEnv()).not.toThrow()
    })

    it('throws error when REDDIT_CLIENT_ID is missing', () => {
      delete process.env.REDDIT_CLIENT_ID
      process.env.REDDIT_CLIENT_SECRET = 'test-secret'
      process.env.REDDIT_REDIRECT_URI =
        'http://localhost:3000/api/auth/callback'
      process.env.SESSION_SECRET = 'a'.repeat(32)
      process.env.BASE_URL = 'http://localhost:3000'
      process.env.USER_AGENT = 'TestApp/1.0'

      expect(() => validateEnv()).toThrow(
        'Missing required environment variables: REDDIT_CLIENT_ID'
      )
    })

    it('throws error when multiple variables are missing', () => {
      delete process.env.REDDIT_CLIENT_ID
      delete process.env.SESSION_SECRET

      expect(() => validateEnv()).toThrow('REDDIT_CLIENT_ID')
      expect(() => validateEnv()).toThrow('SESSION_SECRET')
    })

    it('throws error when SESSION_SECRET is too short', () => {
      process.env.REDDIT_CLIENT_ID = 'test-client-id'
      process.env.REDDIT_CLIENT_SECRET = 'test-client-secret'
      process.env.REDDIT_REDIRECT_URI =
        'http://localhost:3000/api/auth/callback'
      process.env.SESSION_SECRET = 'short'
      process.env.BASE_URL = 'http://localhost:3000'
      process.env.USER_AGENT = 'TestApp/1.0'

      expect(() => validateEnv()).toThrow(
        'SESSION_SECRET must be at least 32 characters long'
      )
    })

    it('passes when SESSION_SECRET is exactly 32 characters', () => {
      process.env.REDDIT_CLIENT_ID = 'test-client-id'
      process.env.REDDIT_CLIENT_SECRET = 'test-client-secret'
      process.env.REDDIT_REDIRECT_URI =
        'http://localhost:3000/api/auth/callback'
      process.env.SESSION_SECRET = 'a'.repeat(32)
      process.env.BASE_URL = 'http://localhost:3000'
      process.env.USER_AGENT = 'TestApp/1.0'

      expect(() => validateEnv()).not.toThrow()
    })
  })

  describe('getEnvVar', () => {
    it('returns value when environment variable exists', () => {
      process.env.REDDIT_CLIENT_ID = 'test-client-id'

      expect(getEnvVar('REDDIT_CLIENT_ID')).toBe('test-client-id')
    })

    it('throws error when environment variable is not set', () => {
      delete process.env.REDDIT_CLIENT_ID

      expect(() => getEnvVar('REDDIT_CLIENT_ID')).toThrow(
        'Environment variable REDDIT_CLIENT_ID is not set'
      )
    })

    it('returns all required environment variables correctly', () => {
      process.env.REDDIT_CLIENT_ID = 'client-id'
      process.env.REDDIT_CLIENT_SECRET = 'client-secret'
      process.env.REDDIT_REDIRECT_URI = 'redirect-uri'
      process.env.SESSION_SECRET = 'session-secret'
      process.env.BASE_URL = 'base-url'
      process.env.USER_AGENT = 'user-agent'

      expect(getEnvVar('REDDIT_CLIENT_ID')).toBe('client-id')
      expect(getEnvVar('REDDIT_CLIENT_SECRET')).toBe('client-secret')
      expect(getEnvVar('REDDIT_REDIRECT_URI')).toBe('redirect-uri')
      expect(getEnvVar('SESSION_SECRET')).toBe('session-secret')
      expect(getEnvVar('BASE_URL')).toBe('base-url')
      expect(getEnvVar('USER_AGENT')).toBe('user-agent')
    })
  })

  describe('getOptionalEnvVar', () => {
    it('returns value when environment variable exists', () => {
      process.env.OPTIONAL_VAR = 'test-value'

      expect(getOptionalEnvVar('OPTIONAL_VAR')).toBe('test-value')
    })

    it('returns empty string when variable does not exist', () => {
      delete process.env.OPTIONAL_VAR

      expect(getOptionalEnvVar('OPTIONAL_VAR')).toBe('')
    })

    it('returns default value when variable does not exist', () => {
      delete process.env.OPTIONAL_VAR

      expect(getOptionalEnvVar('OPTIONAL_VAR', 'default-value')).toBe(
        'default-value'
      )
    })

    it('returns actual value even when default is provided', () => {
      process.env.OPTIONAL_VAR = 'actual-value'

      expect(getOptionalEnvVar('OPTIONAL_VAR', 'default-value')).toBe(
        'actual-value'
      )
    })
  })

  describe('isProduction', () => {
    it('returns true when NODE_ENV is production', () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'production'

      expect(isProduction()).toBe(true)
    })

    it('returns false when NODE_ENV is not production', () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'

      expect(isProduction()).toBe(false)
    })

    it('returns false when NODE_ENV is test', () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'test'

      expect(isProduction()).toBe(false)
    })
  })

  describe('isDevelopment', () => {
    it('returns true when NODE_ENV is development', () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'

      expect(isDevelopment()).toBe(true)
    })

    it('returns false when NODE_ENV is not development', () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'production'

      expect(isDevelopment()).toBe(false)
    })

    it('returns false when NODE_ENV is test', () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'test'

      expect(isDevelopment()).toBe(false)
    })
  })

  describe('isTest', () => {
    it('returns true when NODE_ENV is test', () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'test'

      expect(isTest()).toBe(true)
    })

    it('returns false when NODE_ENV is not test', () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'production'

      expect(isTest()).toBe(false)
    })

    it('returns false when NODE_ENV is development', () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'

      expect(isTest()).toBe(false)
    })
  })

  describe('getAnalyticsConfig', () => {
    it('returns enabled config in production with all variables set', () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'production'
      process.env.ENABLE_ANALYTICS = 'true'
      process.env.ANALYTICS_ID = 'test-id'
      process.env.ANALYTICS_SCRIPT_URL = 'https://example.com/script.js'

      const config = getAnalyticsConfig()

      expect(config.enabled).toBe(true)
      expect(config.scriptUrl).toBe('https://example.com/script.js')
      expect(config.websiteId).toBe('test-id')
    })

    it('returns disabled config when not in production', () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'development'
      process.env.ANALYTICS_ID = 'test-id'
      process.env.ANALYTICS_SCRIPT_URL = 'https://example.com/script.js'

      const config = getAnalyticsConfig()

      expect(config.enabled).toBe(false)
      expect(config.scriptUrl).toBeUndefined()
      expect(config.websiteId).toBeUndefined()
    })

    it('returns disabled config when ENABLE_ANALYTICS is false', () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'production'
      process.env.ENABLE_ANALYTICS = 'false'
      process.env.ANALYTICS_ID = 'test-id'
      process.env.ANALYTICS_SCRIPT_URL = 'https://example.com/script.js'

      const config = getAnalyticsConfig()

      expect(config.enabled).toBe(false)
    })

    it('returns disabled config when ANALYTICS_ID is missing', () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'production'
      delete process.env.ANALYTICS_ID
      process.env.ANALYTICS_SCRIPT_URL = 'https://example.com/script.js'

      const config = getAnalyticsConfig()

      expect(config.enabled).toBe(false)
    })

    it('returns disabled config when ANALYTICS_SCRIPT_URL is missing', () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'production'
      process.env.ANALYTICS_ID = 'test-id'
      delete process.env.ANALYTICS_SCRIPT_URL

      const config = getAnalyticsConfig()

      expect(config.enabled).toBe(false)
    })

    it('returns enabled config when ENABLE_ANALYTICS is not set', () => {
      ;(process.env as {NODE_ENV?: string}).NODE_ENV = 'production'
      delete process.env.ENABLE_ANALYTICS
      process.env.ANALYTICS_ID = 'test-id'
      process.env.ANALYTICS_SCRIPT_URL = 'https://example.com/script.js'

      const config = getAnalyticsConfig()

      expect(config.enabled).toBe(true)
    })
  })
})
