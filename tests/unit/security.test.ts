import { afterEach, describe, expect, it, vi } from 'vitest'
import { contentSecurityPolicy, securityHeaders } from '@/lib/security/headers'

const directives = (policy: string) =>
  Object.fromEntries(
    policy.split('; ').map((directive) => {
      const [name, ...values] = directive.split(' ')
      return [name!, values]
    }),
  )

describe('content security policy', () => {
  const production = directives(contentSecurityPolicy({ dev: false, https: true }))

  it('snapshots the production policy', () => {
    expect(contentSecurityPolicy({ dev: false, https: true })).toMatchInlineSnapshot(
      `"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.redd.it https://*.redditmedia.com https://*.redditstatic.com https://i.imgur.com https://i.ytimg.com https://media.giphy.com; media-src 'self' blob: https://*.redd.it https://*.redditmedia.com https://*.redditstatic.com https://i.imgur.com https://media.giphy.com; connect-src 'self' https://v.redd.it; worker-src 'self' blob:; font-src 'self'; frame-src https://clips.twitch.tv https://imgur.com https://open.spotify.com https://player.vimeo.com https://streamable.com https://w.soundcloud.com https://www.redgifs.com https://www.tiktok.com https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'; form-action 'self' https://www.reddit.test; frame-ancestors 'none'; upgrade-insecure-requests"`,
    )
  })

  it('frames only registry providers and never lets the app be framed', () => {
    expect(production['frame-src']).toContain('https://www.youtube-nocookie.com')
    expect(production['frame-src']).not.toContain("'self'")
    expect(production['frame-ancestors']).toEqual(["'none'"])
    expect(production['object-src']).toEqual(["'none'"])
  })

  it('lets sign-in redirect to Reddit and hls.js reach v.redd.it', () => {
    expect(production['form-action']).toEqual(["'self'", 'https://www.reddit.test'])
    expect(production['connect-src']).toContain('https://v.redd.it')
  })

  it('relaxes only what development needs, and upgrades only over HTTPS', () => {
    const dev = directives(contentSecurityPolicy({ dev: true, https: true }))
    expect(dev['script-src']).toContain("'unsafe-eval'")
    expect(dev['connect-src']).toEqual(expect.arrayContaining(['ws:', 'wss:']))
    expect(dev['upgrade-insecure-requests']).toBeUndefined()
    expect(contentSecurityPolicy({ dev: false, https: false })).not.toContain(
      'upgrade-insecure-requests',
    )
  })
})

describe('content security policy with Datadog', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  async function connectSrc(env: Record<string, string>) {
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
    vi.resetModules()
    const { contentSecurityPolicy: policy } = await import('@/lib/security/headers')
    return directives(policy({ dev: false, https: true }))['connect-src']
  }

  it('allows the browser intake only when Datadog is configured', async () => {
    expect(await connectSrc({ DD_APPLICATION_ID: '', DD_CLIENT_TOKEN: '' })).toEqual([
      "'self'",
      'https://v.redd.it',
    ])
    const configured = { DD_APPLICATION_ID: 'app', DD_CLIENT_TOKEN: 'token' }
    expect(await connectSrc({ ...configured, DD_SITE: 'datadoghq.com' })).toContain(
      'https://browser-intake-datadoghq.com',
    )
    expect(await connectSrc({ ...configured, DD_SITE: 'us5.datadoghq.com' })).toContain(
      'https://browser-intake-us5-datadoghq.com',
    )
  })
})

describe('security headers', () => {
  it('adds hardening headers, with HSTS only for production over HTTPS', () => {
    const headers = securityHeaders({ dev: false, https: true })
    expect(headers).toMatchObject({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    })
    expect(securityHeaders({ dev: true, https: true })).not.toHaveProperty(
      'Strict-Transport-Security',
    )
    expect(securityHeaders({ dev: false, https: false })).not.toHaveProperty(
      'Strict-Transport-Security',
    )
  })
})
