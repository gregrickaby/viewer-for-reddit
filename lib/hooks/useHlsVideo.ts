import {useAppSelector} from '@/lib/store/hooks'
import {useIntersection} from '@mantine/hooks'
import type Hls from 'hls.js'
import {useEffect, useRef, useState} from 'react'

let cachedHlsPromise: Promise<typeof Hls> | null = null
async function loadHlsModule(): Promise<typeof Hls> {
  cachedHlsPromise ??= import('hls.js').then((module) => module.default)
  return cachedHlsPromise
}

interface UseHlsVideoOptions {
  src?: string
  fallbackUrl?: string
  autoPlay?: boolean
}

export function useHlsVideo({
  src,
  fallbackUrl,
  autoPlay = false
}: UseHlsVideoOptions) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const hasInitialized = useRef(false)
  const isMuted = useAppSelector((state) => state.settings.isMuted)
  const [isLoading, setIsLoading] = useState(true)

  const {ref: intersectionRef, entry} = useIntersection({threshold: 0.25})

  // Combine refs: Mantine's intersection ref + local video ref
  useEffect(() => {
    if (intersectionRef && videoRef.current) {
      intersectionRef(videoRef.current)
    }
  }, [intersectionRef])

  // Intersection handler
  useEffect(() => {
    const video = videoRef.current
    if (!video || !entry) return

    const isVisible = entry.isIntersecting

    if (isVisible) {
      if (!hasInitialized.current) {
        if (src) {
          loadHlsModule()
            .then((Hls) => {
              if (Hls.isSupported()) {
                hlsRef.current = new Hls({maxBufferSize: 30 * 1000 * 1000})
                hlsRef.current.loadSource(src)
                hlsRef.current.attachMedia(video)
              } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = src
              } else if (fallbackUrl) {
                video.src = fallbackUrl
              }
            })
            .catch((err) => {
              console.warn('Failed to load HLS.js:', err)
              if (fallbackUrl) video.src = fallbackUrl
            })
        } else if (fallbackUrl) {
          video.src = fallbackUrl
        }

        hasInitialized.current = true
      }

      if (autoPlay && isMuted && video.paused) {
        video.play().catch((err) => {
          console.warn('Auto-play failed:', err)
        })
      }
    } else {
      video.pause()
      hlsRef.current?.destroy()
      hlsRef.current = null
      hasInitialized.current = false
    }
  }, [entry, src, fallbackUrl, autoPlay, isMuted])

  // Track canplay for loading state
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleCanPlay = () => setIsLoading(false)
    video.addEventListener('canplay', handleCanPlay)
    return () => video.removeEventListener('canplay', handleCanPlay)
  }, [])

  return {videoRef, isLoading, isMuted}
}
