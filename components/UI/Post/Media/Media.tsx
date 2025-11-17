'use client'

import {Gallery} from '@/components/UI/Post/Media/Gallery/Gallery'
import {HlsPlayer} from '@/components/UI/Post/Media/HlsPlayer/HlsPlayer'
import {ResponsiveImage} from '@/components/UI/Post/Media/ResponsiveImage/ResponsiveImage'
import {YouTubePlayer} from '@/components/UI/Post/Media/YouTubePlayer/YouTubePlayer'
import {
  useGalleryData,
  type GalleryItem
} from '@/lib/hooks/media/useGalleryData'
import {useMediaAssets} from '@/lib/hooks/media/useMediaAssets'
import {useMediaType} from '@/lib/hooks/media/useMediaType'
import {useAppSelector} from '@/lib/store/hooks'
import type {AutoPostChildData} from '@/lib/store/services/postsApi'
import {getIsVertical} from '@/lib/utils/formatting/media/getIsVertical'
import {logError} from '@/lib/utils/logging/logError'
import {
  decodeAndSanitizeHtml,
  decodeHtmlEntities
} from '@/lib/utils/validation/text/sanitizeText'
import clsx from 'clsx'
import {Suspense} from 'react'
import styles from './Media.module.css'

const HLS_DEFAULTS = {
  autoPlay: true,
  controls: true,
  loop: true,
  muted: true,
  playsInline: true,
  preload: 'none'
} as const

/**
 * Extract image vertical data from post.
 */
function getImageVerticalData(post: AutoPostChildData) {
  const preview = (post as any).preview
  const width = preview?.images?.[0]?.source?.width
  const height = preview?.images?.[0]?.source?.height
  return {
    isVertical: getIsVertical(width, height)
  }
}

/**
 * Extract Reddit video data from post.
 */
function getRedditVideoData(post: AutoPostChildData) {
  const preview = (post as any).preview
  const video =
    preview?.reddit_video_preview ?? (post.media as any)?.reddit_video
  return {
    video,
    isVertical: getIsVertical(video?.width, video?.height)
  }
}

/**
 * Extract link video data from post.
 */
function getLinkVideoData(post: AutoPostChildData) {
  const videoPreview = (post as any).video_preview
  return {
    isVertical: getIsVertical(videoPreview?.width, videoPreview?.height)
  }
}

/**
 * Render gallery media type.
 */
function renderGallery(galleryItems: GalleryItem[] | null, title: string) {
  if (!galleryItems?.length) return null

  return (
    <Suspense fallback={<div>Loading gallery...</div>}>
      <div className={styles.container}>
        <Gallery items={galleryItems} title={title} />
      </div>
    </Suspense>
  )
}

/**
 * Render YouTube media type.
 */
function renderYouTube(videoId: string) {
  return (
    <Suspense fallback={<div>Loading YouTube...</div>}>
      <div className={styles.container}>
        <YouTubePlayer videoId={videoId} />
      </div>
    </Suspense>
  )
}

/**
 * Render image media type.
 */
function renderImage(
  title: string | undefined,
  src: string | undefined,
  isVertical: boolean
) {
  return (
    <div
      className={clsx(styles.container, isVertical ? styles.vertical : null)}
    >
      <ResponsiveImage alt={title} src={src} />
    </div>
  )
}

/**
 * Render Reddit video media type.
 */
function renderRedditVideo(
  post: AutoPostChildData,
  video: any,
  isVertical: boolean,
  posterUrl: string | undefined,
  isMuted: boolean
) {
  return (
    <div
      className={clsx(styles.container, isVertical ? styles.vertical : null)}
    >
      <HlsPlayer
        {...HLS_DEFAULTS}
        dataHint={(post as any).post_hint}
        height={video?.height}
        fallbackUrl={video?.fallback_url}
        id={post.id}
        poster={posterUrl}
        src={video?.hls_url}
        muted={isMuted}
        width={video?.width}
      />
    </div>
  )
}

/**
 * Render link video media type.
 */
function renderLinkVideo(
  post: AutoPostChildData,
  isVertical: boolean,
  fallbackUrl: string | undefined,
  posterUrl: string | undefined,
  isMuted: boolean
) {
  return (
    <div
      className={clsx(styles.container, isVertical ? styles.vertical : null)}
    >
      <HlsPlayer
        {...HLS_DEFAULTS}
        dataHint={fallbackUrl ? 'link:gifv' : 'link'}
        height={(post as any).video_preview?.height}
        fallbackUrl={fallbackUrl}
        id={post.id}
        poster={posterUrl}
        muted={isMuted}
        src={(post as any).video_preview?.hls_url}
        width={(post as any).video_preview?.width}
      />
    </div>
  )
}

/**
 * Render selftext media type.
 */
function renderSelftext(selftextHtml: string) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: decodeAndSanitizeHtml(selftextHtml)
      }}
    />
  )
}

/**
 * Render unsupported media type.
 */
function renderUnsupported(post: AutoPostChildData) {
  logError(`Unsupported media type: "${post.url}"`, {
    component: 'Media',
    action: 'renderMedia',
    postUrl: post.url,
    postId: post.id,
    context: 'Unsupported media type encountered'
  })
  return <p>Unsupported post type</p>
}

/**
 * Get decoded image source for link posts.
 */
function getLinkImageSrc(
  mediumImageUrl: string | undefined,
  thumbnail: string | undefined
) {
  const decodedSrc = mediumImageUrl || thumbnail
  return decodedSrc ? decodeHtmlEntities(decodedSrc) : decodedSrc
}

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
    isGallery,
    isImage,
    isLink,
    isRedditVideo,
    isYouTube,
    isLinkWithVideo,
    youtubeVideoId
  } = useMediaType(post)
  const galleryItems = useGalleryData(post)
  const {mediumImage, fallbackUrl} = useMediaAssets(post)
  const isMuted = useAppSelector((state) => state.settings.isMuted)

  const imageVerticalData =
    isImage || isLink ? getImageVerticalData(post) : null
  const redditVideoData = isRedditVideo ? getRedditVideoData(post) : null
  const linkVideoData = isLinkWithVideo ? getLinkVideoData(post) : null

  if (isGallery) {
    return renderGallery(galleryItems, post.title ?? 'Gallery')
  }

  if (isYouTube && youtubeVideoId) {
    return renderYouTube(youtubeVideoId)
  }

  if (isImage && imageVerticalData) {
    return renderImage(post.title, post.url, imageVerticalData.isVertical)
  }

  if (isRedditVideo && redditVideoData) {
    return renderRedditVideo(
      post,
      redditVideoData.video,
      redditVideoData.isVertical,
      mediumImage?.url,
      isMuted
    )
  }

  if (isLinkWithVideo && linkVideoData) {
    return renderLinkVideo(
      post,
      linkVideoData.isVertical,
      fallbackUrl || undefined,
      mediumImage?.url,
      isMuted
    )
  }

  if (isLink && imageVerticalData) {
    const imageSrc = getLinkImageSrc(mediumImage?.url, post.thumbnail)
    return renderImage(post.title, imageSrc, imageVerticalData.isVertical)
  }

  if (post.selftext) {
    return renderSelftext(post.selftext_html ?? '')
  }

  return renderUnsupported(post)
}
