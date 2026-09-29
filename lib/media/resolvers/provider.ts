import 'server-only'
import type { RedditLink } from '@/lib/reddit/schemas/link'
import type { PostMedia } from '@/lib/view-models'
import { resolveWithProviders } from '../providers/registry'
import { safeLinkUrl } from '../url'

/** Reddit wraps many oEmbed players in Embedly; the real player URL is its `src`. */
const EMBEDLY = 'cdn.embedly.com'

/**
 * The player URL inside Reddit's oEmbed markup, if any. Only the `src`
 * attribute is read (the markup is never rendered), and it still has to match
 * a provider's hosts and id patterns before anything is embedded.
 */
export function oembedSrc(link: RedditLink): URL | null {
  const html = (link.secure_media ?? link.media)?.oembed?.html
  const raw = html ? /\ssrc="([^"]+)"/.exec(html)?.[1]?.replaceAll('&amp;', '&') : undefined
  const src = safeLinkUrl(raw)
  if (!src) return null
  const url = new URL(src)
  if (url.hostname !== EMBEDLY) return url
  const inner = safeLinkUrl(url.searchParams.get('src'))
  return inner ? new URL(inner) : null
}

/**
 * Resolvers 5 and 10 (design §8.7): a known provider, recognized from the
 * post's URL or, failing that, from the oEmbed player URL. That second path
 * handles short links and vanity URLs (vm.tiktok.com, vimeo.com/<user>/<slug>).
 */
export function resolveProvider(link: RedditLink): PostMedia | null {
  const postUrl = safeLinkUrl(link.url_overridden_by_dest ?? link.url)
  const candidates = [postUrl ? new URL(postUrl) : null, oembedSrc(link)].filter(
    (url): url is URL => url !== null,
  )
  return resolveWithProviders(candidates, link)
}
