/**
 * Validates and retrieves environment variables
 * Throws an error if required variables are missing
 */

const requiredEnvVars = [
  'REDDIT_CLIENT_ID',
  'REDDIT_CLIENT_SECRET',
  'REDDIT_REDIRECT_URI',
  'SESSION_SECRET',
  'BASE_URL',
  'USER_AGENT'
] as const

type EnvVar = (typeof requiredEnvVars)[number]

/**
 * Validates that all required environment variables are set
 * Should be called once at application startup
 */
export function validateEnv(): void {
  const missing: string[] = []

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env.local file and ensure all required variables are set.'
    )
  }

  // Validate SESSION_SECRET length
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    throw new Error(
      'SESSION_SECRET must be at least 32 characters long for security.'
    )
  }
}

/**
 * Gets a required environment variable
 * Throws an error if the variable is not set
 */
export function getEnvVar(name: EnvVar): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(
      `Environment variable ${name} is not set. ` +
        'Please check your .env.local file.'
    )
  }

  return value
}

/**
 * Gets an optional environment variable with a default value
 */
export function getOptionalEnvVar(
  name: string,
  defaultValue: string = ''
): string {
  return process.env[name] || defaultValue
}

/**
 * Checks if the application is running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Checks if the application is running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Checks if the application is running in test mode
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test'
}

/**
 * Analytics configuration
 */
interface AnalyticsConfig {
  enabled: boolean
  scriptUrl?: string
  websiteId?: string
}

/**
 * Gets the analytics configuration
 */
export function getAnalyticsConfig(): AnalyticsConfig {
  const enabled =
    process.env.ENABLE_ANALYTICS !== 'false' &&
    !!process.env.ANALYTICS_ID &&
    !!process.env.ANALYTICS_SCRIPT_URL

  return {
    enabled,
    ...(enabled && {
      scriptUrl: process.env.ANALYTICS_SCRIPT_URL,
      websiteId: process.env.ANALYTICS_ID
    })
  }
}
