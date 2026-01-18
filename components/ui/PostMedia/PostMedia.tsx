'use client'

import {RedditPost} from '@/lib/types/reddit'
import {
  decodeImageUrl,
  extractGalleryItems,
  getMediumImage,
  isValidThumbnail
} from '@/lib/utils/media-helpers'
import Image from 'next/image'
import {memo} from 'react'
import {Gallery} from '../Gallery/Gallery'
import {
  renderAnimatedGif,
  renderExternalVideo,
  renderImage,
  renderRedditVideo
} from './PostMedia.helpers'
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
function PostMediaComponent({
  post,
  priority = false
}: Readonly<PostMediaProps>) {
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

// Memoize to prevent unnecessary re-renders when parent updates
export const PostMedia = memo(PostMediaComponent)
