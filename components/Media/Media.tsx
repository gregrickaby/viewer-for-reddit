'use client'

import {useAppSelector} from '@/lib/store/hooks'
import type {PostChildData} from '@/lib/types/posts'
import {getMediumImage} from '@/lib/utils/getMediumImage'
import dynamic from 'next/dynamic'
import {Suspense, useMemo} from 'react'
import styles from './Media.module.css'

// Dynamic imports.
const HlsPlayer = dynamic(() => import('@/components/HlsPlayer/HlsPlayer'))
const YouTubePlayer = dynamic(
  () => import('@/components/YouTubePlayer/YouTubePlayer')
)

// Set HLS player defaults.
const hlsDefaults = {
  autoPlay: true,
  controls: true,
  loop: true,
  muted: true,
  playsInline: true,
  preload: 'none'
}

// Helper to detect vertical video.
function getIsVertical(width?: number, height?: number): boolean {
  return !!(width && height && height > width)
}

/**
 * The media component.
 */
export function Media(post: Readonly<PostChildData>) {
  // Set the medium image asset.
  const mediumImageAsset = useMemo(() => {
    return getMediumImage(post.preview?.images?.[0]?.resolutions ?? []) || null
  }, [post.preview?.images])

  // Get the YouTube video ID.
  const youtubeVideoId = useMemo(() => {
    return /embed\/([a-zA-Z0-9_-]+)/.exec(post.media?.oembed?.html ?? '')?.[1]
  }, [post.media?.oembed])

  const isMuted = useAppSelector((state) => state.settings.isMuted)

  // Determine the media type and render the appropriate component.
  switch (post.post_hint) {
    case 'image': {
      return (
        <a
          aria-label="view full image"
          href={post.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          <img
            alt={post.title ?? 'reddit image'}
            data-hint="image"
            decoding="async"
            id={post.id}
            height={mediumImageAsset?.height}
            loading="lazy"
            src={mediumImageAsset?.url}
            width={mediumImageAsset?.width}
          />
        </a>
      )
    }

    case 'hosted:video':
    case 'rich:video': {
      const videoPreview =
        post.preview?.reddit_video_preview ?? post.media?.reddit_video

      const isYouTube = post.media?.oembed?.provider_name === 'YouTube'

      if (isYouTube && youtubeVideoId) {
        return (
          <Suspense fallback={<div>Loading YouTube...</div>}>
            <YouTubePlayer videoId={youtubeVideoId} />
          </Suspense>
        )
      }

      const isVertical = getIsVertical(
        videoPreview?.width,
        videoPreview?.height
      )

      return (
        <div
          className={`${styles.wrapper} ${isVertical ? styles.vertical : styles.horizontal}`}
        >
          <HlsPlayer
            {...hlsDefaults}
            dataHint={post.post_hint}
            height={videoPreview?.height}
            fallbackUrl={videoPreview?.fallback_url}
            id={post.id}
            poster={mediumImageAsset?.url}
            src={videoPreview?.hls_url}
            muted={isMuted}
            width={videoPreview?.width}
          />
        </div>
      )
    }

    case 'link': {
      const isGifv = post.url?.includes('gifv')
      const videoUrl = isGifv
        ? post.url?.replace('.gifv', '.mp4')
        : post.video_preview?.fallback_url

      const isVertical = getIsVertical(
        post.video_preview?.width,
        post.video_preview?.height
      )

      return (
        <div
          className={`${styles.wrapper} ${isVertical ? styles.vertical : styles.horizontal}`}
        >
          <HlsPlayer
            {...hlsDefaults}
            dataHint={videoUrl ? 'link:gifv' : 'link'}
            height={post.video_preview?.height}
            fallbackUrl={videoUrl}
            id={post.id}
            poster={mediumImageAsset?.url}
            muted={isMuted}
            src={post.video_preview?.hls_url}
            width={post.video_preview?.width}
          />
        </div>
      )
    }

    default:
      return post.selftext ? (
        <div
          className="prose dark:prose-invert text-left"
          dangerouslySetInnerHTML={{
            __html: post.selftext_html ?? ''
          }}
        />
      ) : (
        <p className="text-sm text-zinc-500 italic">Unsupported media.</p>
      )
  }
}
