import 'server-only'
import { type RedditLink, crosspostParent } from '@/lib/reddit/schemas/link'
import type { PostMedia } from '@/lib/view-models'
import { resolveDirectFile } from './resolvers/direct-file'
import { resolveGallery } from './resolvers/gallery'
import { resolveLinkCard } from './resolvers/link-card'
import { resolveAnimatedVariants, resolveImage } from './resolvers/preview'
import { resolveProvider } from './resolvers/provider'
import { resolveRedditVideo, resolveVideoPreview } from './resolvers/reddit-video'

type Resolver = (link: RedditLink) => PostMedia | null

const NONE: PostMedia = { type: 'none' }

/**
 * The resolver chain from design §8.7; the first match wins. Numbers follow
 * the design's table. The oEmbed fallback (10) runs inside the provider step
 * (5), so a provider's own player beats Reddit's silent transcode (6).
 */
const CHAIN: readonly Resolver[] = [
  (link) => (link.removed_by_category ? NONE : null), // 2
  resolveGallery, // 3
  resolveRedditVideo, // 4
  resolveProvider, // 5 and 10
  resolveVideoPreview, // 6
  resolveAnimatedVariants, // 7
  resolveDirectFile, // 8
  resolveImage, // 9
  (link) => (link.is_self ? NONE : null), // 11
]

/** Signals that a post had media we couldn't render: the next provider to add. */
const MEDIA_HINTS = new Set(['image', 'hosted:video', 'rich:video'])

/**
 * The richest media for a post, as a pure function of validated Reddit data.
 * Crossposts (resolver 1) resolve through their original post.
 */
export function resolveMedia(link: RedditLink): PostMedia {
  if (link.removed_by_category) return NONE
  const target = crosspostParent(link) ?? link

  for (const resolve of CHAIN) {
    const media = resolve(target)
    if (media) return media
  }

  if (MEDIA_HINTS.has(target.post_hint ?? '') || target.secure_media) {
    // One string, so log collectors that drop structured arguments keep the details.
    console.info(
      `[media:unresolved] domain=${target.domain} post_hint=${target.post_hint ?? '-'} media_type=${target.secure_media?.type ?? '-'}`,
    )
  }
  return resolveLinkCard(target)
}
