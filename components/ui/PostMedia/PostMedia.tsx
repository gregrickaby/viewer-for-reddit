'use client'

import {RedditPost} from '@/lib/types/reddit'
import {
  decodeImageUrl,
  extractGalleryItems,
  getMediumImage,
  isValidThumbnail
} from '@/lib/utils/media-helpers'
import {Anchor} from '@mantine/core'
import Link from 'next/link'
import {memo} from 'react'
import {Gallery} from '../Gallery/Gallery'
import {VideoPlayer} from '../VideoPlayer/VideoPlayer'
import styles from './PostMedia.module.css'

/**
 * Props for the PostMedia component.
 */
interface PostMediaProps {
  /** Reddit post data */
  post: RedditPost
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
 * - Memoized for performance
 *
 * @example
 * ```typescript
 * <PostMedia post={redditPost} />
 * ```
 */
function PostMediaComponent({post}: Readonly<PostMediaProps>) {
  const galleryItems = extractGalleryItems(post)

  // Render gallery if this is a gallery post
  if (galleryItems && galleryItems.length > 0) {
    return <Gallery items={galleryItems} title={post.title} />
  }

  // Check for Reddit-hosted video in multiple locations
  const redditVideo =
    post.preview?.reddit_video_preview ?? post.media?.reddit_video

  // Render Reddit-hosted video
  if (redditVideo?.hls_url || redditVideo?.fallback_url) {
    return (
      <VideoPlayer
        src={redditVideo.hls_url || redditVideo.fallback_url}
        title={post.title}
        type={redditVideo.hls_url ? 'hls' : 'mp4'}
        width={redditVideo.width}
        height={redditVideo.height}
      />
    )
  }

  // Check for animated GIF/video in variants.mp4 (common for i.redd.it gifs)
  const variantsMp4 = post.preview?.images?.[0]?.variants?.mp4
  if (variantsMp4?.source?.url) {
    return (
      <VideoPlayer
        src={variantsMp4.source.url}
        title={post.title}
        type="mp4"
        width={variantsMp4.source.width}
        height={variantsMp4.source.height}
      />
    )
  }

  // Render external video
  if (post.is_video && post.url) {
    return <VideoPlayer src={post.url} title={post.title} type="mp4" />
  }

  // Render medium-sized image (640px width preferred)
  const mediumImage = getMediumImage(post)
  if (mediumImage) {
    const imageUrl = decodeImageUrl(mediumImage)
    const sourceImage = post.preview?.images?.[0]?.source
    const shouldRenderLink = post.url?.startsWith('http')

    // Calculate aspect ratio to prevent CLS
    const aspectRatio =
      sourceImage?.width && sourceImage?.height
        ? sourceImage.width / sourceImage.height
        : 16 / 9

    const imageElement = (
      <div
        className={styles.imageContainer}
        style={{
          aspectRatio: aspectRatio.toString()
        }}
      >
        <img
          src={imageUrl}
          alt={post.title}
          loading="lazy"
          decoding="async"
          className={styles.image}
        />
      </div>
    )

    if (!shouldRenderLink) {
      return imageElement
    }

    return (
      <Anchor
        component={Link}
        href={post.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={styles.imageLink}
      >
        {imageElement}
      </Anchor>
    )
  }

  // Fallback to thumbnail if no preview available
  if (isValidThumbnail(post.thumbnail)) {
    return (
      <img
        src={post.thumbnail}
        alt={post.title}
        width={140}
        height={140}
        loading="lazy"
        decoding="async"
        className={styles.thumbnail}
      />
    )
  }

  return null
}

// Memoize to prevent unnecessary re-renders when parent updates
export const PostMedia = memo(PostMediaComponent)
