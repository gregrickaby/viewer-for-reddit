'use client'

import {Gallery} from '@/components/UI/Post/Media/Gallery/Gallery'
import {HlsPlayer} from '@/components/UI/Post/Media/HlsPlayer/HlsPlayer'
import {ResponsiveImage} from '@/components/UI/Post/Media/ResponsiveImage/ResponsiveImage'
import {YouTubePlayer} from '@/components/UI/Post/Media/YouTubePlayer/YouTubePlayer'
import {useGalleryData} from '@/lib/hooks/useGalleryData'
import {useMediaAssets} from '@/lib/hooks/useMediaAssets'
import {useMediaType} from '@/lib/hooks/useMediaType'
import {useAppSelector} from '@/lib/store/hooks'
import type {AutoPostChildData} from '@/lib/store/services/postsApi'
import {getIsVertical} from '@/lib/utils/formatting/getIsVertical'
import {logError} from '@/lib/utils/logging/logError'
import {
  decodeAndSanitizeHtml,
  decodeHtmlEntities
} from '@/lib/utils/validation/sanitizeText'
import clsx from 'clsx'
import {Suspense, useMemo} from 'react'
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

  if (isGallery && galleryItems && galleryItems.length > 0) {
    return (
      <Suspense fallback={<div>Loading gallery...</div>}>
        <div className={styles.container}>
          <Gallery items={galleryItems} title={post.title ?? 'Gallery'} />
        </div>
      </Suspense>
    )
  }

  if (isYouTube && youtubeVideoId) {
    return (
      <Suspense fallback={<div>Loading YouTube...</div>}>
        <div className={styles.container}>
          <YouTubePlayer videoId={youtubeVideoId} />
        </div>
      </Suspense>
    )
  }

  if (isImage && imageVerticalData) {
    return (
      <div
        className={clsx(
          styles.container,
          imageVerticalData.isVertical ? styles.vertical : null
        )}
      >
        <ResponsiveImage alt={post.title} src={post.url} />
      </div>
    )
  }

  if (isRedditVideo && redditVideoData) {
    const {video, isVertical} = redditVideoData
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
          poster={mediumImage?.url}
          src={video?.hls_url}
          muted={isMuted}
          width={video?.width}
        />
      </div>
    )
  }

  if (isLinkWithVideo && linkVideoData) {
    return (
      <div
        className={clsx(
          styles.container,
          linkVideoData.isVertical ? styles.vertical : null
        )}
      >
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
      </div>
    )
  }

  if (isLink && imageVerticalData) {
    const decodedSrc = mediumImage?.url || post.thumbnail
    const imageSrc = decodedSrc ? decodeHtmlEntities(decodedSrc) : decodedSrc

    return (
      <div
        className={clsx(
          styles.container,
          imageVerticalData.isVertical ? styles.vertical : null
        )}
      >
        <ResponsiveImage alt={post.title} src={imageSrc} />
      </div>
    )
  }

  if (post.selftext) {
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: decodeAndSanitizeHtml(post.selftext_html ?? '')
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
