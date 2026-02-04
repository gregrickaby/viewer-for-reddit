import Hls from 'hls.js'
import {useEffect, useRef} from 'react'

/**
 * Shared IntersectionObserver instance for all videos (performance optimization).
 * Uses a single observer to monitor all video elements and pause them when scrolled out of view.
 */
let sharedObserver: IntersectionObserver | null = null
const videoCallbacks = new Map<HTMLVideoElement, () => void>()

/**
 * Options for the useVideoPlayer hook.
 */
export interface UseVideoPlayerOptions {
  /** Video source URL */
  src: string
  /** Video type (HLS stream or MP4) */
  type?: 'hls' | 'mp4'
}

/**
 * Custom hook for video player functionality.
 * Handles HLS streaming, auto-pause on scroll, and pausing other videos.
 *
 * Features:
 * - HLS streaming support via hls.js (adaptive quality)
 * - Native HLS support for Safari
 * - Auto-pause when scrolled out of view (IntersectionObserver)
 * - Auto-pause other videos when one starts playing
 * - Shared IntersectionObserver for performance
 * - Automatic cleanup on unmount
 *
 * @param options - Configuration options
 * @returns Ref to attach to the video element
 *
 * @example
 * ```typescript
 * const videoRef = useVideoPlayer({
 *   src: 'https://v.redd.it/abc123/DASH_720.mp4',
 *   type: 'mp4'
 * })
 *
 * return <video ref={videoRef} controls />
 * ```
 */
export function useVideoPlayer({
  src,
  type = 'mp4'
}: UseVideoPlayerOptions): React.RefObject<HTMLVideoElement | null> {
  const videoRef = useRef<HTMLVideoElement>(null)

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

  return videoRef
}
