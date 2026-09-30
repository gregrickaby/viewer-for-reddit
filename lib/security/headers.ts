import 'server-only'
import { env } from '@/lib/env'
import { cspSources } from '@/lib/media/providers/registry'

/*
 * Security headers for every response the proxy handles (implementation §8).
 *
 * The CSP is static, without nonces: a nonce needs every page rendered per
 * request, which Partial Prerendering rules out (bundled docs:
 * guides/content-security-policy.md). Next's streamed RSC data uses inline
 * scripts, so `script-src` keeps 'unsafe-inline'. The real XSS defense is the
 * sanitizer and the single `SafeHtml` renderer (design §11); this policy
 * limits what an injection could reach.
 */

/** Hosts serving Reddit's own images and video. */
const REDDIT_MEDIA = [
  'https://*.redd.it',
  'https://*.redditmedia.com',
  'https://*.redditstatic.com',
]

/** Datadog's browser intake: `us5.datadoghq.com` posts to `browser-intake-us5-datadoghq.com`. */
function datadogIntake(): string[] {
  if (!env.DD_APPLICATION_ID || !env.DD_CLIENT_TOKEN) return []
  const host = env.DD_SITE.replace(/\.(?=.*\.)/g, '-')
  return [`https://browser-intake-${host}`]
}

function join(values: readonly string[]): string {
  return [...new Set(values)].join(' ')
}

export type HeaderOptions = {
  dev: boolean
  /** Served over HTTPS: only then upgrade requests and send HSTS. */
  https: boolean
}

export function contentSecurityPolicy({ dev, https }: HeaderOptions): string {
  const reddit = new URL(env.REDDIT_WWW_BASE).origin
  const directives: Array<[string, readonly string[]]> = [
    ['default-src', ["'self'"]],
    ['script-src', ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : [])]],
    ['style-src', ["'self'", "'unsafe-inline'"]],
    ['img-src', ["'self'", 'data:', 'blob:', ...REDDIT_MEDIA, ...cspSources('imgSrc')]],
    ['media-src', ["'self'", 'blob:', ...REDDIT_MEDIA, ...cspSources('mediaSrc')]],
    // hls.js fetches playlists and segments from v.redd.it itself; Datadog's browser SDK posts to its intake; dev adds the HMR socket.
    [
      'connect-src',
      ["'self'", 'https://v.redd.it', ...datadogIntake(), ...(dev ? ['ws:', 'wss:'] : [])],
    ],
    // hls.js may run its demuxer in a blob: worker.
    ['worker-src', ["'self'", 'blob:']],
    ['font-src', ["'self'"]],
    ['frame-src', cspSources('frameSrc')],
    ['object-src', ["'none'"]],
    ['base-uri', ["'self'"]],
    // Sign-in is a GET form to /api/auth/login, which redirects to Reddit's authorize page.
    ['form-action', ["'self'", reddit]],
    ['frame-ancestors', ["'none'"]],
  ]
  const policy = directives.map(([name, values]) => `${name} ${join(values)}`)
  if (!dev && https) policy.push('upgrade-insecure-requests')
  return policy.join('; ')
}

/** Every header the proxy adds to a response. */
export function securityHeaders(options: HeaderOptions): Record<string, string> {
  return {
    'Content-Security-Policy': contentSecurityPolicy(options),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    ...(!options.dev && options.https
      ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' }
      : {}),
  }
}
