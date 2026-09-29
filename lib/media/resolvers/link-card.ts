import 'server-only'
import type { RedditLink } from '@/lib/reddit/schemas/link'
import type { ImageSet, PostMedia } from '@/lib/view-models'
import { imageSet, previewImageSet } from '../images'
import { safeLinkUrl } from '../url'

/**
 * Resolver 12, the terminal one: an outbound link with the best thumbnail we
 * have. `thumbnail` holds sentinels (`self`, `default`, `nsfw`, `spoiler`,
 * `image`, `""`) as often as URLs; those fail the media URL check.
 */
export function resolveLinkCard(link: RedditLink): PostMedia {
  const url = safeLinkUrl(link.url_overridden_by_dest ?? link.url)
  if (!url) return { type: 'none' }
  return {
    type: 'link',
    url,
    domain: link.domain,
    thumbnail: previewImageSet(link.preview?.images[0]) ?? thumbnail(link),
  }
}

function thumbnail(link: RedditLink): ImageSet | null {
  const { thumbnail: url, thumbnail_width: width, thumbnail_height: height } = link
  return url && width && height ? imageSet({ url, width, height }) : null
}
