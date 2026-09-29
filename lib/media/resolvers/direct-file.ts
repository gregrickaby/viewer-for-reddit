import 'server-only'
import type { RedditLink } from '@/lib/reddit/schemas/link'
import type { PostMedia } from '@/lib/view-models'
import { imageSet, loopVideo, previewImageSet } from '../images'
import { safeMediaUrl } from '../url'

/**
 * Resolver 8: a link straight to a media file on a Reddit media host, sized
 * from Reddit's preview. (Imgur and Giphy files are handled by their providers.)
 */
export function resolveDirectFile(link: RedditLink): PostMedia | null {
  const url = safeMediaUrl(link.url_overridden_by_dest ?? link.url)
  const source = link.preview?.images[0]?.source
  if (!url || !source) return null
  const extension = /\.([a-z0-9]+)$/i.exec(new URL(url).pathname)?.[1]?.toLowerCase()
  const poster = previewImageSet(link.preview?.images[0])

  switch (extension) {
    case 'mp4':
    case 'webm': {
      const loop = loopVideo(url, source.width, source.height)
      return loop ? { type: 'animated', loop, gif: null, poster } : null
    }
    case 'gif': {
      const gif = imageSet({ url, width: source.width, height: source.height })
      return gif ? { type: 'animated', loop: null, gif, poster } : null
    }
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'webp':
    case 'avif':
      return poster ? { type: 'image', image: poster } : null
    default:
      return null
  }
}
