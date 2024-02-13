'use client'

import {HlsPlayerProps} from '@/lib/types'
import Hls from 'hls.js'
import {LegacyRef, useEffect, useRef} from 'react'

/**
 * The HlsPlayer component.
 *
 * @see https://github.com/video-dev/hls.js/
 */
export default function HlsPlayer(props: HlsPlayerProps) {
  // Create a ref to the video element.
  const videoRef = useRef<HTMLMediaElement>(null)

  /**
   * Initialize Hls.js.
   *
   * @see https://github.com/video-dev/hls.js/#embedding-hlsjs
   */
  useEffect(() => {
    const video = videoRef.current

    if (props.src !== undefined && video !== null) {
      // First check for native browser HLS support.
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = props.src

        // If no native HLS support, check if HLS.js is supported.
      } else if (Hls.isSupported()) {
        const hls = new Hls()
        hls.loadSource(props.src)
        hls.attachMedia(video)
      }
    }
  }, [props.src, videoRef])

  /**
   * Pause this video if another starts playing.
   */
  useEffect(() => {
    const video = videoRef.current

    // Dispatch a custom event whenever a video starts playing.
    const playHandler = () => {
      window.dispatchEvent(new CustomEvent('videoPlayed', {detail: {video}}))
    }

    if (video) {
      // Listen for native event.
      video.addEventListener('play', playHandler)

      // Set up the custom event.
      const pauseIfNotCurrent = (event: Event) => {
        const customEvent = event as CustomEvent<{video: HTMLVideoElement}>

        // Pause this video if another starts playing.
        if (customEvent.detail.video !== video) {
          video.pause()
        }
      }

      // Add the event listener.
      window.addEventListener('videoPlayed', pauseIfNotCurrent)

      // Clean up the event listeners.
      return () => {
        video.removeEventListener('play', playHandler)
        window.removeEventListener('videoPlayed', pauseIfNotCurrent)
      }
    }
  }, [])

  return (
    <video
      autoPlay={props.autoPlay}
      className={props.className}
      controls={props.controls}
      crossOrigin={props.crossOrigin}
      data-hint={props.dataHint}
      height={props.height}
      id={props.id}
      loop={props.loop}
      muted={props.muted}
      playsInline={props.playsInline}
      poster={props.poster}
      preload={props.preload}
      ref={videoRef as LegacyRef<HTMLVideoElement>}
      width={props.width}
    >
      {props.children}
    </video>
  )
}
