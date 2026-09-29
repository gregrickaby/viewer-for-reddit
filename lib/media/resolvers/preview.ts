import 'server-only'
import type { RedditLink } from '@/lib/reddit/schemas/link'
import type { PostMedia } from '@/lib/view-models'
import { imageSet, loopVideo, previewImageSet } from '../images'

/** Resolver 7: an animated preview. The MP4 loop is preferred; the GIF is its fallback. */
export function resolveAnimatedVariants(link: RedditLink): PostMedia | null {
  const image = link.preview?.images[0]
  const variants = image?.variants
  if (!image || !variants) return null

  const mp4 = variants.mp4?.source
  const loop = mp4 ? loopVideo(mp4.url, mp4.width, mp4.height) : null
  const gif = variants.gif ? imageSet(variants.gif.source, variants.gif.resolutions) : null
  if (!loop && !gif) return null
  return { type: 'animated', loop, gif, poster: previewImageSet(image) }
}

/**
 * Resolver 9: a still image. `post_hint` is only a hint (design §8.7), so an
 * i.redd.it post with a preview counts even without it.
 */
export function resolveImage(link: RedditLink): PostMedia | null {
  if (link.post_hint !== 'image' && link.domain !== 'i.redd.it') return null
  const image = previewImageSet(link.preview?.images[0])
  return image ? { type: 'image', image } : null
}
