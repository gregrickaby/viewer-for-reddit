'use client'

import {useVideoPlayer} from '@/lib/hooks/useVideoPlayer'
import {getIsVertical} from '@/lib/utils/reddit-helpers'
import clsx from 'clsx'
import 'video.js/dist/video-js.css'
import styles from './VideoPlayer.module.css'

/**
 * Props for the VideoPlayer component.
 */
interface VideoPlayerProps {
  /** Video source URL */
  src: string
  /** Video title for accessibility */
  title: string
  /** Video type (HLS stream or MP4) */
  type?: 'hls' | 'mp4'
  /** Video width (for aspect ratio calculation) */
  width?: number
  /** Video height (for aspect ratio calculation) */
  height?: number
  /** Poster image URL (preview/thumbnail) */
  poster?: string
}

/**
 * Validate video URL to prevent XSS attacks.
 * Only allows HTTPS URLs from Reddit video/media domains.
 *
 * @param url - URL to validate
 * @returns True if URL is safe to use
 */
function isValidVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    // Only allow https for videos
    if (parsed.protocol !== 'https:') {
      return false
    }
    // Allow Reddit video/media domains
    const allowedDomains = [
      'v.redd.it',
      'reddit.com',
      'preview.redd.it',
      'external-preview.redd.it',
      'i.redd.it'
    ]
    const hostname = parsed.hostname.toLowerCase()
    return allowedDomains.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    )
  } catch {
    return false
  }
}

/**
 * Video player with automatic pause when scrolled out of view.
 * Supports HLS streaming and MP4; validates URLs to prevent XSS.
 */
export function VideoPlayer({
  src,
  title,
  type = 'mp4',
  width,
  height,
  poster
}: Readonly<VideoPlayerProps>) {
  // Use custom hook for video player logic
  const containerRef = useVideoPlayer({src, type, poster})

  // Determine if video is vertical (portrait orientation)
  const isVertical = getIsVertical(width, height)

  // Validate URL before rendering
  if (!isValidVideoUrl(src)) {
    return <div className={styles.error}>Video unavailable</div>
  }

  // Calculate aspect ratio for container to prevent layout shifts
  const containerStyle =
    width && height ? {aspectRatio: `${width} / ${height}`} : undefined

  return (
    <div
      aria-label={`Video: ${title}`}
      className={clsx(styles.container, isVertical && styles.vertical)}
      ref={containerRef}
      style={containerStyle}
    />
  )
}
