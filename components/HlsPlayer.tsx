import Hls from 'hls.js'
import {LegacyRef, useEffect, useRef, VideoHTMLAttributes} from 'react'

export interface HlsPlayerProps
  extends Omit<VideoHTMLAttributes<HTMLVideoElement>, 'data-hint'> {
  dataHint?: any
}

/**
 * HlsPlayer component.
 *
 * @see https://github.com/video-dev/hls.js/
 */
export default function HlsPlayer(props: HlsPlayerProps) {
  const videoRef = useRef<HTMLMediaElement>(null)

  useEffect(() => {
    const video = videoRef.current

    if (props.src != undefined && video !== null) {
      if (Hls.isSupported()) {
        const hls = new Hls()
        hls.loadSource(props.src)
        hls.attachMedia(video)
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = props.src
      }
    }
  }, [props.src, videoRef])

  return (
    <video
      className={props.className}
      controls={props.controls}
      crossOrigin={props.crossOrigin}
      data-hint={props.dataHint}
      height={props.height}
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
