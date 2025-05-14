'use client'

import type {HlsPlayerProps} from '@/lib/types'
import {debounce} from '@/lib/utils/debounce'
import Hls from 'hls.js'
import {useEffect, useMemo, useRef, useState} from 'react'

/**
 * The HlsPlayer component.
 *
 * This component is responsible for rendering a video player that can handle HLS (HTTP Live Streaming)
 * video streams. It lazy-loads the video using an IntersectionObserver and prevents multiple videos from
 * playing simultaneously by pausing other videos when one starts playing.
 *
 * @param {Readonly<HlsPlayerProps>} props - The properties for the HLS player.
 * @returns {JSX.Element} A video element capable of handling HLS and MP4 fallbacks.
 *
 * @see https://github.com/video-dev/hls.js/
 */
export default function HlsPlayer(props: Readonly<HlsPlayerProps>) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const hasLoadedRef = useRef(false)

  /**
   * Debounced visibility handler for IntersectionObserver.
   * Triggers when the video element enters the viewport.
   */
  const handleIntersection = useMemo(
    () =>
      debounce((entries: IntersectionObserverEntry[]) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      }, 100),
    []
  )

  /**
   * Effect to observe video visibility using IntersectionObserver.
   */
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.25
    })

    observer.observe(video)
    return () => observer.disconnect()
  }, [handleIntersection])

  /**
   * Memoized video attributes to avoid unnecessary re-renders.
   */
  const videoAttributes = useMemo(
    () => ({
      autoPlay: props.autoPlay ?? false,
      className: props.className,
      controls: props.controls ?? true,
      crossOrigin: props.crossOrigin,
      height: props.height,
      id: props.id,
      loop: props.loop ?? false,
      muted: props.muted ?? true,
      playsInline: props.playsInline ?? true,
      poster: isVisible ? props.poster : undefined,
      preload: isVisible ? (props.preload ?? 'none') : 'none',
      width: props.width
    }),
    [props, isVisible]
  )

  /**
   * Prevent multiple videos from playing simultaneously.
   */
  useEffect(() => {
    const handlePlay = (event: Event) => {
      const playingVideo = event.target as HTMLVideoElement
      const videos = document.querySelectorAll('video')
      videos.forEach((v) => {
        if (v !== playingVideo && !v.paused && !v.ended) {
          v.pause()
        }
      })
    }

    document.addEventListener('play', handlePlay, true)
    return () => document.removeEventListener('play', handlePlay, true)
  }, [])

  /**
   * Load HLS when video becomes visible and hasn't already been loaded.
   */
  useEffect(() => {
    if (!isVisible || !props.src || hasLoadedRef.current) return

    const video = videoRef.current
    let hls: Hls | null = null

    const loadHls = () => {
      if (!video) return

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = props.src!
      } else if (Hls.isSupported()) {
        hls = new Hls()
        hls.loadSource(props.src!)
        hls.attachMedia(video)
      }
      hasLoadedRef.current = true
    }

    loadHls()

    return () => {
      if (hls) hls.destroy()
    }
  }, [isVisible, props.src])

  return (
    <video ref={videoRef} {...videoAttributes} data-id={props.id}>
      {props.fallbackUrl && <source src={props.fallbackUrl} type="video/mp4" />}
    </video>
  )
}
