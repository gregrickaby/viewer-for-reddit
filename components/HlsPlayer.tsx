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

  return (
    <video
      autoPlay={props.autoPlay}
      className={props.className}
      controls={props.controls}
      crossOrigin={props.crossOrigin}
      data-hint={props.dataHint}
      height={props.height}
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
