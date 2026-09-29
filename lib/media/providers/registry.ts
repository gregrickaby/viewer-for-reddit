import 'server-only'
import type { RedditLink } from '@/lib/reddit/schemas/link'
import type { PostMedia } from '@/lib/view-models'
import { hostMatches } from '../url'
import { giphy, imgur, redgifs } from './animated-hosts'
import { social, soundcloud, spotify } from './audio-and-social'
import type { Provider } from './types'
import { streamable, tiktok, twitch, vimeo } from './video-hosts'
import { youtube } from './youtube'

/** Every provider, in no particular order: hosts never overlap. */
export const PROVIDERS: readonly Provider[] = [
  youtube,
  vimeo,
  streamable,
  twitch,
  redgifs,
  giphy,
  imgur,
  tiktok,
  spotify,
  soundcloud,
  social,
]

export function findProvider(url: URL): Provider | null {
  return PROVIDERS.find((provider) => hostMatches(url.hostname, provider.hosts)) ?? null
}

/** Media from the first URL a provider recognizes and can resolve. */
export function resolveWithProviders(urls: readonly URL[], link: RedditLink): PostMedia | null {
  for (const url of urls) {
    const provider = findProvider(url)
    const ids = provider?.parse(url)
    if (provider && ids) {
      const media = provider.resolve(ids, link)
      if (media) return media
    }
  }
  return null
}

type CspKey = keyof Provider['csp']

/** CSP sources the providers need, per directive (used by the CSP in Phase 8). */
export function cspSources(key: CspKey): string[] {
  return [...new Set(PROVIDERS.flatMap((provider) => provider.csp[key] ?? []))].sort()
}
