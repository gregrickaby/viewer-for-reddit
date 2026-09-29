import 'server-only'
import type { RedditLink } from '@/lib/reddit/schemas/link'
import type { RedditVideoData } from '@/lib/reddit/schemas/media'
import type { ImageSet, PostMedia } from '@/lib/view-models'
import { loopVideo, previewImageSet } from '../images'
import { safeMediaUrl } from '../url'

/** Resolver 4: a v.redd.it upload. */
export function resolveRedditVideo(link: RedditLink): PostMedia | null {
  const video = link.secure_media?.reddit_video ?? link.media?.reddit_video
  return video ? fromRedditVideo(video, poster(link)) : null
}

/** Resolver 6: Reddit's own transcode of a GIF or an external clip. */
export function resolveVideoPreview(link: RedditLink): PostMedia | null {
  const video = link.preview?.reddit_video_preview
  return video ? fromRedditVideo(video, poster(link)) : null
}

/** GIF-like uploads loop silently; everything else streams HLS with audio. */
function fromRedditVideo(video: RedditVideoData, poster: ImageSet | null): PostMedia | null {
  const { width, height } = video
  if (video.is_gif) {
    const loop = loopVideo(video.fallback_url, width, height)
    return loop ? { type: 'animated', loop, gif: null, poster } : null
  }
  const hls = safeMediaUrl(video.hls_url)
  if (!hls || width <= 0 || height <= 0) return null
  return {
    type: 'video',
    video: {
      hls,
      mp4Fallback: safeMediaUrl(video.fallback_url),
      width,
      height,
      durationSec: video.duration ?? null,
    },
    poster,
  }
}

function poster(link: RedditLink): ImageSet | null {
  return previewImageSet(link.preview?.images[0])
}
