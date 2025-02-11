import { memo, useCallback, useMemo } from 'react'
import { IconNoMedia } from '../icons/NoMedia'
import type { RedditChild } from '../types/reddit'
import { getCachedUrl, prefetchMedia } from '../utils/cache'
import { sanitizeText } from '../utils/sanitizeText'
import { HlsPlayer } from './HlsPlayer'
import { ResponsiveImage } from './ResponsiveImage'

/**
 * Media Component
 *
 * A versatile media renderer for Reddit content that handles:
 * 1. Gallery posts (shows first image)
 * 2. Direct media links (GIFs, MP4s)
 * 3. Reddit-hosted videos (HLS)
 * 4. Standard images
 * 5. Rich media embeds
 * 6. Article links
 * 7. Text posts
 *
 * Features:
 * - Automatic format detection
 * - Adaptive quality selection
 * - Blur-up loading effects
 * - Responsive sizing
 * - URL caching
 * - Media prefetching
 *
 * @param {Object} props - Component props
 * @param {RedditChild['data']} props.post - Reddit post data
 */
export const Media = memo(function MediaContent({
  post
}: Readonly<{
  post: RedditChild['data']
}>) {
  // HLS player configuration.
  const hlsDefaults = useMemo(
    () => ({
      autoPlay: true,
      controls: false,
      loop: true,
      muted: true,
      playsInline: true,
      preload: 'auto' as const
    }),
    []
  )

  /**
   * Creates an HLS player instance with consistent configuration.
   *
   * @param {string} id - Unique identifier
   * @param {string} src - HLS stream URL
   * @param {string} fallbackUrl - MP4 fallback URL
   * @param {string} [poster] - Optional poster image
   */
  const renderHlsPlayer = useCallback(
    (id: string, src: string, fallbackUrl: string, poster?: string) => (
      <HlsPlayer
        {...hlsDefaults}
        id={id}
        src={src}
        fallbackUrl={fallbackUrl}
        poster={poster}
      />
    ),
    [hlsDefaults]
  )

  // Gallery post handler - displays first image.
  if (post.is_gallery && post.gallery_data?.items[0]?.media_id) {
    const metadata = post.media_metadata?.[post.gallery_data.items[0].media_id]
    if (metadata?.status === 'valid' && metadata.s?.u) {
      return (
        <ResponsiveImage src={metadata.s.u} thumbnail={metadata.p?.[0]?.u} />
      )
    }
  }

  // Handle direct media links (GIFs, MP4s).
  if (post.url?.match(/\.(gif|mp4)$/i)) {
    const cachedUrl = getCachedUrl(post.url)
    // Prefetch preview image for better UX.
    if (post.preview?.images[0]?.source.url) {
      prefetchMedia(post.preview.images[0].source.url)
    }
    return <HlsPlayer {...hlsDefaults} id={post.id} fallbackUrl={cachedUrl} />
  }

  // Handle different post types based on hint.
  switch (post.post_hint) {
    case 'image': {
      // Standard image with blur-up effect.
      const thumbnail = post.preview?.images[0]?.resolutions[0]?.url
      if (thumbnail) prefetchMedia(thumbnail)
      return <ResponsiveImage src={post.url} thumbnail={thumbnail} />
    }

    case 'hosted:video':
    case 'rich:video': {
      // Reddit-hosted videos with HLS streaming.
      const videoPreview =
        post.media?.reddit_video || post.preview?.reddit_video_preview
      return videoPreview
        ? renderHlsPlayer(
            post.id,
            videoPreview.hls_url,
            getCachedUrl(videoPreview.fallback_url),
            post.preview?.images[0]?.source.url
          )
        : null
    }

    case 'link': {
      // Handle article links with media preview
      if (post.preview?.images[0]?.source.url) {
        const thumbnail = post.preview.images[0].resolutions[0]?.url
        if (thumbnail) prefetchMedia(thumbnail)
        return (
          <a
            aria-label="View Article"
            className="relative block h-full w-full"
            href={post.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ResponsiveImage
              src={post.preview.images[0].source.url}
              thumbnail={thumbnail}
            />
            <div className="absolute inset-0 z-50 flex items-center justify-center">
              <div className="rounded bg-black/75 px-4 py-2 text-sm text-white">
                View Article ↗
              </div>
            </div>
          </a>
        )
      }
      break
    }
  }

  // Handle text posts
  if (post.selftext) {
    return (
      <div className="absolute inset-0 flex">
        <div className="z-50 max-w-[77%] overflow-y-auto py-8 pl-4 lg:w-full">
          <div
            className="line-clamp-24"
            dangerouslySetInnerHTML={{ __html: sanitizeText(post.selftext) }}
          />
        </div>
      </div>
    )
  }

  // Fallback for unsupported content.
  return (
    <div className="absolute top-1/3 right-0 left-0 flex flex-col items-center gap-4 text-center text-zinc-400 dark:text-zinc-600">
      <IconNoMedia />
      <p className="w-72 text-lg">
        This post is text-only or has unsupported media. Keep scrolling!
      </p>
    </div>
  )
})
