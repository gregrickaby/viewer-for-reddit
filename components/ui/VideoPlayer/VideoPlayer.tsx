'use client'

import {getIsVertical} from '@/lib/utils/reddit-helpers'
import clsx from 'clsx'
import {useEffect, useRef} from 'react'
import styles from './VideoPlayer.module.css'

// Shared IntersectionObserver instance for all videos (performance optimization)
let sharedObserver: IntersectionObserver | null = null
const videoCallbacks = new Map<HTMLVideoElement, () => void>()

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
 * Video player component with automatic pause on scroll.
 * Optimized for Reddit videos (v.redd.it) and animated GIFs.
 *
 * Features:
 * - URL validation (prevents XSS)
 * - Auto-pause when scrolled out of view (IntersectionObserver)
 * - Auto-pause other videos when one starts playing
 * - Shared IntersectionObserver for performance
 * - Vertical video detection and styling
 * - Download prevention via controlsList
 *
 * @example
 * ```typescript
 * <VideoPlayer
 *   src="https://v.redd.it/abc123/DASH_720.mp4"
 *   title="Funny cat video"
 *   type="mp4"
 *   width={1280}
 *   height={720}
 * />
 * ```
 */
export function VideoPlayer({
  src,
  title,
  type = 'mp4',
  width,
  height,
  poster
}: Readonly<VideoPlayerProps>) {
  const videoRef = useRef<HTMLVideoElement>(null)

  // Determine if video is vertical (portrait orientation)
  const isVertical = getIsVertical(width, height)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Pause other videos when this one starts playing
    const handlePlay = () => {
      const allVideos = document.querySelectorAll('video')
      allVideos.forEach((v) => {
        if (v !== video && !v.paused) {
          v.pause()
        }
      })
    }

    // Create shared observer on first video mount
    sharedObserver ??= new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const callback = videoCallbacks.get(entry.target as HTMLVideoElement)
          if (callback) callback()
        })
      },
      {threshold: 0.25}
    )

    // Pause video when scrolled out of view
    const handleIntersection = () => {
      if (!video.paused) {
        video.pause()
      }
    }

    videoCallbacks.set(video, handleIntersection)
    video.addEventListener('play', handlePlay)
    sharedObserver.observe(video)

    return () => {
      video.removeEventListener('play', handlePlay)
      videoCallbacks.delete(video)
      if (sharedObserver) {
        sharedObserver.unobserve(video)
        // Clean up shared observer if no videos remain
        if (videoCallbacks.size === 0) {
          sharedObserver.disconnect()
          sharedObserver = null
        }
      }
    }
  }, [])

  // Validate URL before rendering
  if (!isValidVideoUrl(src)) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#666',
          borderRadius: 8,
          backgroundColor: '#f5f5f5'
        }}
      >
        Video unavailable
      </div>
    )
  }

  return (
    <div className={clsx(styles.container, isVertical && styles.vertical)}>
      <video
        aria-label={`Video: ${title}`}
        className={styles.video}
        controls
        controlsList="nodownload"
        playsInline
        poster={poster}
        preload="metadata"
        ref={videoRef}
      >
        <source
          src={src}
          type={type === 'hls' ? 'application/x-mpegURL' : 'video/mp4'}
        />
        <track kind="captions" label="English" />
        Your browser does not support the video tag.
      </video>
    </div>
  )
}
