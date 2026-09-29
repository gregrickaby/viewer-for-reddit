import 'server-only'
import type { RedditLink } from '@/lib/reddit/schemas/link'
import { MediaMetadataItem } from '@/lib/reddit/schemas/media'
import type { GalleryItem, PostMedia } from '@/lib/view-models'
import { loopVideo, metadataGifSet, metadataImageSet } from '../images'
import { safeLinkUrl, safeMediaUrl } from '../url'

/**
 * Resolver 3 (design §8.10). Items keep `gallery_data` order; anything not
 * `valid` or unusable is skipped. One survivor renders as plain media, and
 * none falls through to the next resolver.
 */
export function resolveGallery(link: RedditLink): PostMedia | null {
  if (!link.is_gallery || !link.gallery_data) return null
  const metadata = link.media_metadata ?? {}

  const items = link.gallery_data.items.flatMap((entry): GalleryItem[] => {
    const media = metadataMedia(metadata[entry.media_id])
    if (!media) return []
    return [
      {
        media,
        caption: entry.caption?.trim() || null,
        outboundUrl: safeLinkUrl(entry.outbound_url),
      },
    ]
  })

  if (items.length === 0) return null
  if (items.length === 1) return items[0]!.media
  return { type: 'gallery', items }
}

/** One `media_metadata` entry as media, or null. Also used for inline media in text. */
export function metadataMedia(value: unknown): GalleryItem['media'] | null {
  const parsed = MediaMetadataItem.safeParse(value)
  if (!parsed.success || parsed.data.status !== 'valid') return null
  const item = parsed.data

  switch (item.e) {
    case 'Image': {
      const image = metadataImageSet(item)
      return image ? { type: 'image', image } : null
    }
    case 'AnimatedImage': {
      const loop = item.s ? loopVideo(item.s.mp4, item.s.x, item.s.y) : null
      const gif = metadataGifSet(item)
      if (!loop && !gif) return null
      return { type: 'animated', loop, gif, poster: metadataImageSet(item) }
    }
    case 'RedditVideo': {
      const hls = safeMediaUrl(item.hlsUrl)
      if (!hls || !item.x || !item.y) return null
      return {
        type: 'video',
        video: { hls, mp4Fallback: null, width: item.x, height: item.y, durationSec: null },
        poster: null,
      }
    }
    default:
      return null
  }
}
