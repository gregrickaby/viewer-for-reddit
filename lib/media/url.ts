import 'server-only'

/*
 * Every media URL goes through here (design §8.7, "Safe URL parsing").
 * Hosts match exactly, or by suffix when the entry starts with a dot, so
 * `redd.it.evil.com` never passes as Reddit.
 */

/** Hosts that serve Reddit's own media: i., v., preview., external-preview.redd.it, thumbnails, icons. */
export const REDDIT_MEDIA_HOSTS = ['.redd.it', '.redditmedia.com', '.redditstatic.com'] as const

export function hostMatches(hostname: string, hosts: readonly string[]): boolean {
  const host = hostname.toLowerCase()
  return hosts.some((entry) => (entry.startsWith('.') ? host.endsWith(entry) : host === entry))
}

/**
 * A URL the browser will load as media: https only (http is upgraded, since
 * these are known media hosts), no credentials, and a host on the allowlist.
 */
export function safeMediaUrl(
  raw: unknown,
  hosts: readonly string[] = REDDIT_MEDIA_HOSTS,
): string | null {
  const url = parse(raw)
  if (!url) return null
  if (url.protocol === 'http:') url.protocol = 'https:'
  if (url.protocol !== 'https:' || url.username || url.password) return null
  return hostMatches(url.hostname, hosts) ? url.href : null
}

/** An outbound link the user may follow: http or https, any host. */
export function safeLinkUrl(raw: unknown): string | null {
  const url = parse(raw)
  if (!url || (url.protocol !== 'https:' && url.protocol !== 'http:')) return null
  return url.href
}

function parse(raw: unknown): URL | null {
  return typeof raw === 'string' ? URL.parse(raw.trim()) : null
}
