'use client'

/* eslint-disable @next/next/no-img-element -- the poster is Reddit's own resized preview */
import { useEffect, useRef, useState } from 'react'

import { logger } from '@/lib/datadog/client'

import { claimAudio, registerPlayer } from './player-registry'
import styles from './players.module.css'

export interface RedditVideoProps {
  hls: string
  mp4Fallback: string | null
  width: number
  height: number
  poster: string | null
  label: string
}

interface Hls {
  loadSource(src: string): void
  attachMedia(media: HTMLMediaElement): void
  destroy(): void
}

/**
 * A v.redd.it video with sound. The poster shows until the
 * player nears the viewport; then HLS plays through a lazily loaded hls.js,
 * or natively where Media Source Extensions are missing. If HLS fails, the
 * silent MP4 plays with a "no audio" note. Scrolling it out of view pauses it. Leaving the page (or Activity
 * hiding it) releases the decoder.
 */
export function RedditVideo({ hls, mp4Fallback, width, height, poster, label }: RedditVideoProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [attached, setAttached] = useState(false)
  const [noAudio, setNoAudio] = useState(false)

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    return registerPlayer(frame, {
      attach: () => setAttached(true),
      detach: () => setAttached(false),
      visibility: (visible) => {
        if (!visible) videoRef.current?.pause()
      },
      yieldAudio: () => videoRef.current?.pause(),
    })
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!attached || !video) return
    let player: Hls | null = null
    let cancelled = false

    const fallBack = (reason: unknown) => {
      player?.destroy()
      player = null
      logger.warn('[media:video_error]', { hls, reason: String(reason) })
      if (mp4Fallback) {
        video.src = mp4Fallback
        setNoAudio(true)
      }
    }

    // hls.js wherever Media Source Extensions exist. Native HLS only as the
    // fallback: some Chrome builds answer canPlayType('…mpegurl') with "maybe"
    // and then fail Reddit's streams with MEDIA_ERR_SRC_NOT_SUPPORTED.
    import('hls.js')
      .then(({ default: Hls }) => {
        if (cancelled) return
        if (Hls.isSupported()) {
          const instance = new Hls({ capLevelToPlayerSize: true })
          player = instance
          instance.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) fallBack(data.details)
          })
          instance.loadSource(hls)
          instance.attachMedia(video)
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.addEventListener('error', () => fallBack('native HLS failed'), { once: true })
          video.src = hls
        } else {
          fallBack('no HLS support')
        }
      })
      .catch(fallBack)

    return () => {
      cancelled = true
      player?.destroy()
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
  }, [attached, hls, mp4Fallback])

  return (
    <div className={styles.frame} ref={frameRef} style={{ aspectRatio: `${width} / ${height}` }}>
      {attached ? (
        <video
          aria-label={label}
          className={styles.media}
          controls
          height={height}
          onPlay={() => {
            if (frameRef.current) claimAudio(frameRef.current)
          }}
          playsInline
          poster={poster ?? undefined}
          preload="none"
          ref={videoRef}
          width={width}
        />
      ) : poster ? (
        <img
          alt=""
          className={`${styles.media} ${styles.scripted}`}
          decoding="async"
          height={height}
          loading="lazy"
          src={poster}
          width={width}
        />
      ) : (
        <span className={styles.scripted} />
      )}
      {noAudio ? <span className={styles.badge}>No audio</span> : null}
      <noscript>
        <video
          aria-label={label}
          className={styles.media}
          controls
          playsInline
          poster={poster ?? undefined}
          preload="none"
        >
          <source src={hls} type="application/vnd.apple.mpegurl" />
          {mp4Fallback ? <source src={mp4Fallback} type="video/mp4" /> : null}
        </video>
      </noscript>
    </div>
  )
}
