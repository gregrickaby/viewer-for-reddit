'use client'

import {HlsPlayer} from '@/components/HlsPlayer/HlsPlayer'
import {MediaContainer} from '@/components/MediaContainer/MediaContainer'
import {ResponsiveImage} from '@/components/ResponsiveImage/ResponsiveImage'
import {YouTubePlayer} from '@/components/YouTubePlayer/YouTubePlayer'
import {useMediaAssets} from '@/lib/hooks/useMediaAssets'
import {useMediaType} from '@/lib/hooks/useMediaType'
import {useAppSelector} from '@/lib/store/hooks'
import type {PostChildData} from '@/lib/types/posts'
import {getIsVertical} from '@/lib/utils/getIsVertical'
import {logError} from '@/lib/utils/logError'
import {decodeHtmlEntities} from '@/lib/utils/sanitizeText'
import {Suspense} from 'react'

const hlsDefaults = {
  autoPlay: true,
  controls: true,
  loop: true,
  muted: true,
  playsInline: true,
  preload: 'none'
}

/**
 * Media component for rendering all supported Reddit post media types.
 *
 * Handles images, YouTube, Reddit-hosted video, HLS/gifv links, and fallback selftext.
 * Uses Mantine, custom containers, and lazy loading for optimal performance.
 *
 * - Images: Renders with ResponsiveImage and MediaContainer, detects vertical/horizontal.
 * - YouTube: Renders with YouTubePlayer inside Suspense for lazy loading.
 * - Reddit Video: Renders with HlsPlayer, supports mute, poster, and fallback.
 * - Link (gifv/HLS): Renders with HlsPlayer, uses fallbackUrl if present.
 * - Fallback: Renders sanitized selftext HTML or unsupported message.
 *
 * @param post - The Reddit post data (PostChildData)
 * @returns JSX.Element for the appropriate media type
 */
export function Media(post: Readonly<PostChildData>) {
  const {
    isImage,
    isLink,
    isRedditVideo,
    isYouTube,
    isLinkWithVideo,
    youtubeVideoId
  } = useMediaType(post)
  const {mediumImage, fallbackUrl} = useMediaAssets(post)
  const isMuted = useAppSelector((state) => state.settings.isMuted)

  if (isYouTube && youtubeVideoId) {
    return (
      <Suspense fallback={<div>Loading YouTube...</div>}>
        <MediaContainer isVertical={false}>
          <YouTubePlayer videoId={youtubeVideoId} />
        </MediaContainer>
      </Suspense>
    )
  }

  if (isImage) {
    const isVertical = getIsVertical(
      post.preview?.images[0]?.source?.width,
      post.preview?.images[0]?.source?.height
    )

    return (
      <MediaContainer isVertical={isVertical}>
        <ResponsiveImage alt={post.title} src={post.url} />
      </MediaContainer>
    )
  }

  if (isRedditVideo) {
    const video = post.preview?.reddit_video_preview ?? post.media?.reddit_video
    const isVertical = getIsVertical(video?.width, video?.height)

    return (
      <MediaContainer isVertical={isVertical}>
        <HlsPlayer
          {...hlsDefaults}
          dataHint={post.post_hint}
          height={video?.height}
          fallbackUrl={video?.fallback_url}
          id={post.id}
          poster={mediumImage?.url}
          src={video?.hls_url}
          muted={isMuted}
          width={video?.width}
        />
      </MediaContainer>
    )
  }

  if (isLinkWithVideo) {
    const isVertical = getIsVertical(
      post.video_preview?.width,
      post.video_preview?.height
    )

    return (
      <MediaContainer isVertical={isVertical}>
        <HlsPlayer
          {...hlsDefaults}
          dataHint={fallbackUrl ? 'link:gifv' : 'link'}
          height={post.video_preview?.height}
          fallbackUrl={fallbackUrl}
          id={post.id}
          poster={mediumImage?.url}
          muted={isMuted}
          src={post.video_preview?.hls_url}
          width={post.video_preview?.width}
        />
      </MediaContainer>
    )
  }

  if (isLink) {
    const isVertical = getIsVertical(
      post.preview?.images[0]?.source?.width,
      post.preview?.images[0]?.source?.height
    )

    const decodedSrc = mediumImage?.url || post.thumbnail
    const imageSrc = decodedSrc ? decodeHtmlEntities(decodedSrc) : decodedSrc

    return (
      <MediaContainer isVertical={isVertical}>
        <ResponsiveImage alt={post.title} src={imageSrc} />
      </MediaContainer>
    )
  }

  logError(`Unhandled post type: ${post.post_hint}`)

  return post.selftext ? (
    <div
      dangerouslySetInnerHTML={{
        __html: post.selftext_html ?? ''
      }}
    />
  ) : (
    <p>Unsupported media.</p>
  )
}
