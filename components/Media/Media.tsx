'use client'

import {HlsPlayer} from '@/components/HlsPlayer/HlsPlayer'
import {MediaContainer} from '@/components/MediaContainer/MediaContainer'
import {ResponsiveImage} from '@/components/ResponsiveImage/ResponsiveImage'
import {YouTubePlayer} from '@/components/YouTubePlayer/YouTubePlayer'
import {useMediaAssets} from '@/lib/hooks/useMediaAssets'
import {useMediaType} from '@/lib/hooks/useMediaType'
import {useAppSelector} from '@/lib/store/hooks'
import type {AutoPostChildData} from '@/lib/store/services/postsApi'
import {getIsVertical} from '@/lib/utils/getIsVertical'
import {logError} from '@/lib/utils/logError'
import {decodeHtmlEntities} from '@/lib/utils/sanitizeText'
import {Suspense, useMemo} from 'react'

const HLS_DEFAULTS = {
  autoPlay: true,
  controls: true,
  loop: true,
  muted: true,
  playsInline: true,
  preload: 'none'
} as const

/**
 * Media component for rendering all supported Reddit post media types.
 *
 * Handles images, YouTube, Reddit-hosted video, HLS/gifv links, and fallback selftext.
 * Uses Mantine, custom containers, and lazy loading for optimal performance.
 *
 * @param post - The Reddit post data (AutoPostChildData)
 * @returns JSX.Element for the appropriate media type
 */
export function Media(post: Readonly<AutoPostChildData>) {
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

  const imageVerticalData = useMemo(() => {
    if (!isImage && !isLink) return null
    const preview = (post as any).preview
    return {
      isVertical: getIsVertical(
        preview?.images?.[0]?.source?.width,
        preview?.images?.[0]?.source?.height
      )
    }
  }, [isImage, isLink, (post as any).preview?.images])

  const redditVideoData = useMemo(() => {
    if (!isRedditVideo) return null
    const preview = (post as any).preview
    const video =
      preview?.reddit_video_preview ?? (post.media as any)?.reddit_video
    return {
      video,
      isVertical: getIsVertical(video?.width, video?.height)
    }
  }, [isRedditVideo, (post as any).preview, post.media])

  const linkVideoData = useMemo(() => {
    if (!isLinkWithVideo) return null
    return {
      isVertical: getIsVertical(
        (post as any).video_preview?.width,
        (post as any).video_preview?.height
      )
    }
  }, [isLinkWithVideo, post])

  if (isYouTube && youtubeVideoId) {
    return (
      <Suspense fallback={<div>Loading YouTube...</div>}>
        <MediaContainer isVertical={false}>
          <YouTubePlayer videoId={youtubeVideoId} />
        </MediaContainer>
      </Suspense>
    )
  }

  if (isImage && imageVerticalData) {
    return (
      <MediaContainer isVertical={imageVerticalData.isVertical}>
        <ResponsiveImage alt={post.title} src={post.url} />
      </MediaContainer>
    )
  }

  if (isRedditVideo && redditVideoData) {
    const {video, isVertical} = redditVideoData
    return (
      <MediaContainer isVertical={isVertical}>
        <HlsPlayer
          {...HLS_DEFAULTS}
          dataHint={(post as any).post_hint}
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

  if (isLinkWithVideo && linkVideoData) {
    return (
      <MediaContainer isVertical={linkVideoData.isVertical}>
        <HlsPlayer
          {...HLS_DEFAULTS}
          dataHint={fallbackUrl ? 'link:gifv' : 'link'}
          height={(post as any).video_preview?.height}
          fallbackUrl={fallbackUrl}
          id={post.id}
          poster={mediumImage?.url}
          muted={isMuted}
          src={(post as any).video_preview?.hls_url}
          width={(post as any).video_preview?.width}
        />
      </MediaContainer>
    )
  }

  if (isLink && imageVerticalData) {
    const decodedSrc = mediumImage?.url || post.thumbnail
    const imageSrc = decodedSrc ? decodeHtmlEntities(decodedSrc) : decodedSrc

    return (
      <MediaContainer isVertical={imageVerticalData.isVertical}>
        <ResponsiveImage alt={post.title} src={imageSrc} />
      </MediaContainer>
    )
  }

  if (post.selftext) {
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: post.selftext_html ?? ''
        }}
      />
    )
  }

  logError(`Unsupported media type: "${post.url}"`, {
    component: 'Media',
    action: 'renderMedia',
    postUrl: post.url,
    postId: post.id,
    context: 'Unsupported media type encountered'
  })
  return <p>Unsupported post type</p>
}
