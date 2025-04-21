'use client'

import {debounce} from '@/lib/functions'
import {HlsPlayerProps} from '@/lib/types'
import Hls from 'hls.js'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

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
  // Ref to store the video element.
  const videoRef = useRef<HTMLVideoElement>(null)

  // State to track whether the video is visible in the viewport.
  const [isVisible, setIsVisible] = useState(false)

  /**
   * Debounced visibility handler for IntersectionObserver.
   *
   * This function is triggered by the IntersectionObserver whenever the video element
   * intersects the viewport. Debouncing is applied to reduce frequent triggers as the
   * user scrolls the page.
   *
   * @param {IntersectionObserverEntry[]} entries - The entries provided by the observer.
   */
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      debounce(() => {
        const [entry] = entries
        if (entry.isIntersecting) {
          setIsVisible(true) // Mark the video as visible when 50% or more is in the viewport.
        }
      }, 100)() // 100ms debounce to avoid rapid re-triggering.
    },
    []
  )

  /**
   * Effect for lazy-loading HLS video using IntersectionObserver.
   *
   * This effect observes the video element and triggers the debounced intersection handler
   * when the element enters the viewport.
   */
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Set up the IntersectionObserver with a 25% threshold.
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.25
    })

    // Observe the video element.
    observer.observe(video)

    // Cleanup observer on component unmount.
    return () => {
      observer.disconnect()
    }
  }, [handleIntersection])

  /**
   * Memoized video attributes.
   *
   * The attributes for the video element are memoized to avoid re-renders unless
   * the `props` or `isVisible` state changes.
   */
  const videoAttributes = useMemo(
    () => ({
      autoPlay: props.autoPlay,
      className: props.className,
      controls: props.controls,
      crossOrigin: props.crossOrigin,
      height: props.height,
      id: props.id,
      loop: props.loop,
      muted: props.muted,
      playsInline: props.playsInline,
      poster: isVisible ? props.poster : undefined, // Only show the poster if the video is visible.
      preload: isVisible ? props.preload : 'none', // Prevent preloading if the video is not visible.
      width: props.width
    }),
    [props, isVisible]
  )

  /**
   * Effect to handle video playback behavior.
   *
   * This effect adds a `play` event listener to the document that pauses all other videos when
   * a new video starts playing. This prevents multiple videos from playing simultaneously.
   */
  useEffect(() => {
    // Event handler for pausing other videos when one plays.
    const handlePlay = (event: Event) => {
      const playingVideo = event.target as HTMLVideoElement

      // Pause all other videos except the one that is currently playing.
      const videos = document.querySelectorAll('video')
      videos.forEach((v) => {
        if (v !== playingVideo && !v.paused) {
          v.pause()
        }
      })
    }

    // Add the 'play' event listener to the document.
    document.addEventListener('play', handlePlay, true)

    // Cleanup the event listener on component unmount.
    return () => {
      document.removeEventListener('play', handlePlay, true)
    }
  }, [])

  /**
   * Effect for initializing Hls.js when the video becomes visible.
   *
   * This effect is triggered when the video becomes visible (`isVisible`) and a source (`props.src`)
   * is provided. If HLS is supported, it uses Hls.js to load and attach the stream to the video element.
   */
  useEffect(() => {
    if (!isVisible || !props.src) return

    const video = videoRef.current
    let hls: Hls | null = null

    // Function to load the HLS stream using Hls.js.
    const loadHls = () => {
      if (!video) return

      // If the browser can natively play HLS, set the video source directly.
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = props.src
      } else if (Hls.isSupported()) {
        // Otherwise, use Hls.js to handle the HLS stream.
        hls = new Hls()
        hls.loadSource(props.src)
        hls.attachMedia(video)
      }
    }

    loadHls()

    // Cleanup Hls.js when the component unmounts or `isVisible`/`src` changes.
    return () => {
      if (hls) {
        hls.destroy()
      }
    }
  }, [isVisible, props.src])

  return (
    <video ref={videoRef} {...videoAttributes}>
      {/* Provide an MP4 fallback if HLS is not supported */}
      {props.fallbackUrl && <source src={props.fallbackUrl} type="video/mp4" />}
    </video>
  )
}
