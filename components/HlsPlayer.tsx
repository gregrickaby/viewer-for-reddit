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
   * Effect for initializing Hls.js.
   *
   * @see https://github.com/video-dev/hls.js/#embedding-hlsjs
   */
  useEffect(() => {
    const video = videoRef.current

    if (!video || props.src === undefined) return

    const loadHls = () => {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = props.src
      } else if (Hls.isSupported()) {
        const hls = new Hls()
        hls.loadSource(props.src)
        hls.attachMedia(video)
      }
    }

    loadHls()
  }, [props.src, videoRef])

  /**
   * Effect for pausing videos.
   *
   * If a user starts a video, pause all other videos.
   */
  useEffect(() => {
    // Get the video element.
    const video = videoRef.current

    // No video? Bail.
    if (!video) return

    const handlePause = () => {
      // Get all videos.
      const videos = document.querySelectorAll('video')

      // Loop through all videos.
      videos.forEach((v) => {
        if (v !== video && !v.paused) {
          v.pause() // Pause all other videos.
        }
      })
    }

    // Add event listener.
    video.addEventListener('play', handlePause)

    // Cleanup event listener.
    return () => {
      video.removeEventListener('play', handlePause)
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
