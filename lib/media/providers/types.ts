import 'server-only'
import type { RedditLink } from '@/lib/reddit/schemas/link'
import type { PostMedia, ProviderId } from '@/lib/view-models'

/** Ids extracted from a URL with strict patterns; only these reach an iframe URL. */
export type ProviderIds = Record<string, string>

/**
 * One third-party media host (design §8.7). Adding a provider is one module,
 * its tests, and its CSP sources; nothing else changes.
 */
export type Provider = {
  id: ProviderId | 'social'
  /** Exact hosts, or `.suffix` for any subdomain (lib/media/url.ts). */
  hosts: readonly string[]
  /** Pull ids out of a URL, or null if the URL isn't one of this provider's media URLs. */
  parse(url: URL): ProviderIds | null
  /** Media for a post. Null lets the resolver chain continue. */
  resolve(ids: ProviderIds, link: RedditLink): PostMedia | null
  /** Sources this provider needs in the Content Security Policy (Phase 8). */
  csp: { frameSrc?: readonly string[]; mediaSrc?: readonly string[]; imgSrc?: readonly string[] }
}
