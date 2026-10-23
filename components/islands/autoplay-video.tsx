'use client'

import { useEffect, useRef, useState } from 'react'

import { registerPlayer } from './player-registry'
import styles from './players.module.css'
import { useReducedMotion } from './use-reduced-motion'

export interface AutoplayVideoProps {
  mp4: string
  width: number
  height: number
  poster: string | null
  label: string
}

/**
 * A GIF-style loop: muted and silent, it plays only while at
 * least half visible and loads only as it nears the viewport. Under reduced
 * motion it waits for a ▶ press instead of autoplaying.
 */
export function AutoplayVideo({ mp4, width, height, poster, label }: AutoplayVideoProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const reduced = useReducedMotion()
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const frame = frameRef.current
    const video = videoRef.current
    if (!frame || !video) return
    return registerPlayer(
      frame,
      {
        attach: () => {
          video.src = mp4
        },
        detach: () => {
          video.pause()
          video.removeAttribute('src')
          video.load()
        },
        visibility: (visible) => {
          if (visible && !reduced) void video.play().catch(() => {})
          else video.pause()
        },
      },
      { release: true },
    )
  }, [mp4, reduced])

  function toggle() {
    const video = videoRef.current
    if (!video) return
    if (!video.getAttribute('src')) video.src = mp4
    if (video.paused) void video.play().catch(() => {})
    else video.pause()
  }

  return (
    <div className={styles.frame} ref={frameRef} style={{ aspectRatio: `${width} / ${height}` }}>
      <video
        aria-label={label}
        className={`${styles.media} ${styles.scripted}`}
        height={height}
        loop
        muted
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        playsInline
        poster={poster ?? undefined}
        preload="metadata"
        ref={videoRef}
        width={width}
      />
      {reduced ? (
        <button aria-pressed={playing} className={styles.playToggle} onClick={toggle} type="button">
          {playing ? 'Pause' : '▶ Play'}
        </button>
      ) : null}
      <noscript>
        <video
          aria-label={label}
          autoPlay
          className={styles.media}
          loop
          muted
          playsInline
          poster={poster ?? undefined}
          src={mp4}
        />
      </noscript>
    </div>
  )
}
