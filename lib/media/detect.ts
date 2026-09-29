import 'server-only'
import { type RedditLink, crosspostParent } from '@/lib/reddit/schemas/link'
import type { PostMedia } from '@/lib/view-models'
import { resolveGallery } from './resolvers/gallery'
import { resolveLinkCard } from './resolvers/link-card'
import { resolveAnimatedVariants, resolveImage } from './resolvers/preview'
import { resolveRedditVideo, resolveVideoPreview } from './resolvers/reddit-video'

type Resolver = (link: RedditLink) => PostMedia | null

const NONE: PostMedia = { type: 'none' }

/**
 * The resolver chain from design §8.7; the first match wins. Numbers follow
 * the design's table. Known providers (5), direct files (8), and the oEmbed
 * fallback (10) join at their positions with the provider registry.
 */
const CHAIN: readonly Resolver[] = [
  (link) => (link.removed_by_category ? NONE : null), // 2
  resolveGallery, // 3
  resolveRedditVideo, // 4
  resolveVideoPreview, // 6
  resolveAnimatedVariants, // 7
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
    console.info('[media:unresolved]', {
      domain: target.domain,
      post_hint: target.post_hint ?? null,
      media_type: target.secure_media?.type ?? null,
    })
  }
  return resolveLinkCard(target)
}
