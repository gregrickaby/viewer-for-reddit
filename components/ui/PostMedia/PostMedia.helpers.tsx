import {RedditPost} from '@/lib/types/reddit'
import {isValidThumbnail} from '@/lib/utils/media-helpers'
import {Anchor} from '@mantine/core'
import Image from 'next/image'
import Link from 'next/link'
import {VideoPlayer} from '../VideoPlayer/VideoPlayer'
import styles from './PostMedia.module.css'

/**
 * Render a Reddit-hosted or external video player
 */
export function renderVideo(
  src: string,
  title: string,
  type: 'hls' | 'mp4',
  width?: number,
  height?: number,
  poster?: string
) {
  return (
    <VideoPlayer
      src={src}
      title={title}
      type={type}
      width={width}
      height={height}
      poster={poster}
    />
  )
}

/**
 * Get poster image from post preview or thumbnail
 */
export function getPosterImage(post: RedditPost): string | undefined {
  return (
    post.preview?.images?.[0]?.source?.url ??
    (isValidThumbnail(post.thumbnail) ? post.thumbnail : undefined)
  )
}

/**
 * Render Reddit video (hosted or external)
 */
export function renderRedditVideo(post: RedditPost) {
  const redditVideo =
    post.preview?.reddit_video_preview ?? post.media?.reddit_video

  if (redditVideo?.hls_url || redditVideo?.fallback_url) {
    return renderVideo(
      redditVideo.hls_url || redditVideo.fallback_url,
      post.title,
      redditVideo.hls_url ? 'hls' : 'mp4',
      redditVideo.width,
      redditVideo.height,
      getPosterImage(post)
    )
  }

  return null
}

/**
 * Render animated GIF as MP4 video
 */
export function renderAnimatedGif(post: RedditPost) {
  const variantsMp4 = post.preview?.images?.[0]?.variants?.mp4
  if (variantsMp4?.source?.url) {
    return renderVideo(
      variantsMp4.source.url,
      post.title,
      'mp4',
      variantsMp4.source.width,
      variantsMp4.source.height,
      post.preview?.images?.[0]?.source?.url
    )
  }
  return null
}

/**
 * Render external video
 */
export function renderExternalVideo(post: RedditPost) {
  if (post.is_video && post.url) {
    return renderVideo(
      post.url,
      post.title,
      'mp4',
      undefined,
      undefined,
      getPosterImage(post)
    )
  }
  return null
}

/**
 * Render a static image with optional link wrapper
 */
export function renderImage(
  imageUrl: string,
  title: string,
  width: number,
  height: number,
  priority: boolean,
  linkUrl?: string,
  className?: string
) {
  const imageElement = (
    <div
      className={styles.imageContainer}
      style={{
        aspectRatio: `${width} / ${height}`
      }}
    >
      <Image
        src={imageUrl}
        alt={title}
        width={width}
        height={height}
        priority={priority}
        quality={85}
        className={className || styles.image}
      />
    </div>
  )

  if (!linkUrl) {
    return imageElement
  }

  return (
    <Anchor
      component={Link}
      href={linkUrl}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={styles.imageLink}
    >
      {imageElement}
    </Anchor>
  )
}
