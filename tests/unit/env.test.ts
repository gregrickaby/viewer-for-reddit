import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('env', () => {
  it('parses configuration and applies defaults', async () => {
    vi.stubEnv('REDDIT_API_BASE', undefined)
    const { env } = await import('@/lib/env')
    expect(env.REDDIT_CLIENT_ID).toBe('test-client-id')
    expect(env.REDDIT_API_BASE).toBe('https://oauth.reddit.com')
  })

  it('fails fast with a readable message', async () => {
    vi.stubEnv('SESSION_SECRET', 'too-short')
    vi.stubEnv('BASE_URL', 'not a url')
    await expect(import('@/lib/env')).rejects.toThrow(
      /Invalid environment configuration[\s\S]*SESSION_SECRET must be at least 32 characters/,
    )
  })
})
