'use client'

import {RedditPost} from '@/lib/types/reddit'
import {
  decodeImageUrl,
  extractGalleryItems,
  getHighestQualityVideoUrl,
  getMediumImage,
  getPosterImage,
  isValidThumbnail
} from '@/lib/utils/media-helpers'
import {Anchor} from '@mantine/core'
import Image from 'next/image'
import Link from 'next/link'
import {Gallery} from '../Gallery/Gallery'
import {VideoPlayer} from '../VideoPlayer/VideoPlayer'
import styles from './PostMedia.module.css'

/**
 * Props for the PostMedia component.
 */
interface PostMediaProps {
  /** Reddit post data */
  post: RedditPost
  /** Whether this is a priority post (for LCP optimization) */
  priority?: boolean
}

/**
 * Render a Reddit-hosted or external video player
 */
function renderVideo(
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
 * Render Reddit video (hosted or external)
 * Uses highest quality video URL when fallback_url is provided
 */
function renderRedditVideo(post: RedditPost) {
  const redditVideo =
    post.preview?.reddit_video_preview ?? post.media?.reddit_video

  if (redditVideo?.hls_url || redditVideo?.fallback_url) {
    // Prefer HLS for adaptive streaming, otherwise use highest quality MP4
    let videoUrl = redditVideo.hls_url || redditVideo.fallback_url

    // If using fallback_url (MP4), upgrade to highest quality version
    if (!redditVideo.hls_url && redditVideo.fallback_url) {
      videoUrl = getHighestQualityVideoUrl(redditVideo.fallback_url)
    }

    return renderVideo(
      videoUrl,
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
 * Uses highest quality variant available
 */
function renderAnimatedGif(post: RedditPost) {
  const variantsMp4 = post.preview?.images?.[0]?.variants?.mp4

  // Try to get highest resolution from variants.mp4.resolutions array
  const resolutions = variantsMp4?.resolutions
  const highestRes =
    resolutions && resolutions.length > 0
      ? resolutions.at(-1) // Last item is highest resolution
      : variantsMp4?.source

  if (highestRes?.url) {
    return renderVideo(
      highestRes.url,
      post.title,
      'mp4',
      highestRes.width,
      highestRes.height,
      post.preview?.images?.[0]?.source?.url
    )
  }

  return null
}

/**
 * Render external video
 */
function renderExternalVideo(post: RedditPost) {
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
function renderImage(
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

/**
 * Display post media (images, videos, galleries) with appropriate rendering.
 * Handles multiple media types from Reddit's API.
 *
 * Supports:
 * - Image galleries (r/pics multi-image posts)
 * - Reddit-hosted videos (v.redd.it)
 * - Animated GIFs (rendered as videos)
 * - External videos
 * - Static images (with 640px preferred size)
 * - Thumbnails (fallback)
 *
 * Features:
 * - Aspect ratio calculation to prevent CLS
 * - Lazy loading with blur placeholders
 * - Proper external link handling (noopener, nofollow)
 *
 * @example
 * ```typescript
 * <PostMedia post={redditPost} />
 * ```
 */
export function PostMedia({post, priority = false}: Readonly<PostMediaProps>) {
  // Render gallery if available
  const galleryItems = extractGalleryItems(post)
  if (galleryItems && galleryItems.length > 0) {
    return <Gallery items={galleryItems} title={post.title} />
  }

  // Try to render video (Reddit, animated GIF, or external)
  const videoElement =
    renderRedditVideo(post) ||
    renderAnimatedGif(post) ||
    renderExternalVideo(post)
  if (videoElement) {
    return videoElement
  }

  // Render medium-sized image
  const mediumImage = getMediumImage(post)
  if (mediumImage) {
    return renderImage(
      decodeImageUrl(mediumImage.url),
      post.title,
      mediumImage.width,
      mediumImage.height,
      priority,
      post.url?.startsWith('http') ? post.url : undefined
    )
  }

  // Fallback to thumbnail
  if (isValidThumbnail(post.thumbnail)) {
    return (
      <Image
        src={post.thumbnail}
        alt={post.title}
        width={140}
        height={140}
        priority={priority}
        quality={75}
        className={styles.thumbnail}
      />
    )
  }

  return null
}
