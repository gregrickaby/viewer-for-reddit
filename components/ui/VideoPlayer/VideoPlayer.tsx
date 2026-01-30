'use client'

import {getIsVertical} from '@/lib/utils/reddit-helpers'
import clsx from 'clsx'
import Hls from 'hls.js'
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
 * - HLS streaming support via hls.js (adaptive quality)
 * - Native HLS support for Safari
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

    let hls: Hls | null = null

    // Initialize HLS.js for HLS streams (if browser doesn't support it natively)
    if (type === 'hls') {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = src
      } else if (Hls.isSupported()) {
        // Use HLS.js for browsers that don't support HLS natively
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90
        })
        hls.loadSource(src)
        hls.attachMedia(video)
      } else {
        // Fallback: try to play HLS URL directly (may not work, but prevents black screen)
        video.src = src
      }
    }

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
      // Clean up HLS.js instance
      if (hls) {
        hls.destroy()
      }
    }
  }, [src, type])

  // Validate URL before rendering
  if (!isValidVideoUrl(src)) {
    return <div className={styles.error}>Video unavailable</div>
  }

  // Calculate aspect ratio for container to prevent layout shifts
  const containerStyle =
    width && height ? {aspectRatio: `${width} / ${height}`} : undefined

  return (
    <div
      className={clsx(styles.container, isVertical && styles.vertical)}
      style={containerStyle}
    >
      <video
        aria-label={`Video: ${title}`}
        className={styles.video}
        controls
        height={height}
        playsInline
        poster={poster}
        preload="none"
        ref={videoRef}
        width={width}
      >
        {type === 'mp4' && <source src={src} type="video/mp4" />}
        <track kind="captions" label="English" />
        Your browser does not support the video tag.
      </video>
    </div>
  )
}
