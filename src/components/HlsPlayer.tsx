import type Hls from 'hls.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { IconSpinner } from '../icons/Spinner'
import { useAppSelector } from '../store/hooks'
import type { HlsPlayerProps } from '../types/hls-player'

/**
 * Cached promise for loading the HLS.js module.
 *
 * This is used to avoid loading the module multiple times.
 */
let cachedHlsPromise: Promise<typeof Hls> | null = null
async function loadHlsModule(): Promise<typeof Hls> {
  if (!cachedHlsPromise) {
    cachedHlsPromise = import('hls.js').then((module) => module.default)
  }
  return cachedHlsPromise
}

/**
 * HLS-capable video player component
 *
 * Features:
 * - HLS playback with fallback to regular video
 * - Lazy loading via IntersectionObserver
 * - Automatic pause of other videos when playing
 * - Memory cleanup on unmount and when the video leaves the viewport
 * - Auto-play resumes when the video re-enters the viewport (if autoPlay is enabled)
 */
export function HlsPlayer({
  src,
  fallbackUrl,
  poster,
  id,
  dataHint,
  autoPlay = false,
  controls = true,
  loop = true,
  playsInline = true,
  preload = 'none'
}: Readonly<HlsPlayerProps>) {
  // Setup refs and state.
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const hasInitialized = useRef(false)
  const isMuted = useAppSelector((state) => state.settings.isMuted)
  const [aspectRatio, setAspectRatio] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Initialize HLS.js when the video enters the viewport.
   */
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Callback for the IntersectionObserver.
    const observerCallback = async ([entry]: IntersectionObserverEntry[]) => {
      // If the video is in view, initialize.
      if (entry.isIntersecting) {
        // If video is in view and not yet initialized, initialize HLS.
        if (!hasInitialized.current) {
          // If there is a source, try to load it with HLS.js.
          if (src) {
            try {
              const Hls = await loadHlsModule()
              if (Hls.isSupported()) {
                hlsRef.current = new Hls({ maxBufferSize: 30 * 1000 * 1000 })
                hlsRef.current.loadSource(src)
                hlsRef.current.attachMedia(video)
              } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = src
              }
            } catch (err) {
              console.warn('Failed to load HLS.js:', err)
              // Fallback to direct video if HLS fails.
              if (fallbackUrl) video.src = fallbackUrl
            }

            // If there is no source, fallback to a direct
          } else if (fallbackUrl) {
            video.src = fallbackUrl
          }

          // Update the initialization flag.
          hasInitialized.current = true
        } else {
          // If already initialized and autoPlay is enabled, resume playback.
          if (autoPlay && video.paused) {
            video.play().catch((err) => {
              console.warn('Auto-play failed:', err)
            })
          }
        }
      } else {
        // When the video leaves the viewport, pause it.
        video.pause()
        // Destroy any active HLS instance to stop playback/sound.
        if (hlsRef.current) {
          hlsRef.current.destroy()
          hlsRef.current = null
        }
        // Reset the initialization flag so the video can reinitialize when visible.
        hasInitialized.current = false
      }
    }

    // Create the IntersectionObserver instance.
    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.25
    })

    // Observe the video element.
    observer.observe(video)

    // Cleanup on unmount.
    return () => {
      observer.disconnect()
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
      hasInitialized.current = false
    }
  }, [src, fallbackUrl, autoPlay])

  // Calculate and store aspect ratio on metadata load
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      const ratio = video.videoWidth / video.videoHeight
      setAspectRatio(ratio)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    return () =>
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
  }, [])

  // Handle loading state
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleCanPlay = () => setIsLoading(false)
    video.addEventListener('canplay', handleCanPlay)
    return () => video.removeEventListener('canplay', handleCanPlay)
  }, [])

  // Calculate container classes based on aspect ratio
  const containerClasses = useMemo(() => {
    const base = 'relative h-full w-full flex items-center justify-center'

    if (!aspectRatio) return base

    // Extremely vertical videos (e.g., TikTok, Instagram Stories)
    if (aspectRatio < 0.5) {
      return `${base} max-w-[min(500px,100vw)]`
    }

    // Moderately vertical videos (e.g., 9:16, 3:4)
    if (aspectRatio < 1) {
      return `${base} max-w-[min(800px,100vw)]`
    }

    // Landscape videos
    return `${base} max-w-[min(1200px,100vw)]`
  }, [aspectRatio])

  // Calculate video classes based on aspect ratio
  const videoClasses = useMemo(() => {
    const base = 'h-full w-full'
    return `${base} object-contain` // Always use object-contain to maintain aspect ratio
  }, [])

  return (
    <div className={containerClasses}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <IconSpinner />
        </div>
      )}

      <video
        autoPlay={autoPlay}
        className={videoClasses}
        controls={controls}
        data-hint={dataHint}
        id={id}
        loop={loop}
        muted={isMuted}
        playsInline={playsInline}
        poster={poster}
        preload={preload}
        ref={videoRef}
      />
    </div>
  )
}
