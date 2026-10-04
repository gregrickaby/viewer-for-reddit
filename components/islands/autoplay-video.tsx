'use client'

import { useEffect, useRef, useState } from 'react'
import { registerPlayer } from './player-registry'
import styles from './players.module.css'
import { useReducedMotion } from './use-reduced-motion'

export type AutoplayVideoProps = {
  mp4: string
  width: number
  height: number
  poster: string | null
  label: string
}

/**
 * A GIF-style loop (design §8.7): muted and silent, it plays only while at
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
    <div ref={frameRef} className={styles.frame} style={{ aspectRatio: `${width} / ${height}` }}>
      <video
        ref={videoRef}
        className={`${styles.media} ${styles.scripted}`}
        width={width}
        height={height}
        poster={poster ?? undefined}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={label}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {reduced ? (
        <button type="button" className={styles.playToggle} onClick={toggle} aria-pressed={playing}>
          {playing ? 'Pause' : '▶ Play'}
        </button>
      ) : null}
      <noscript>
        <video
          className={styles.media}
          src={mp4}
          poster={poster ?? undefined}
          muted
          loop
          playsInline
          autoPlay
          aria-label={label}
        />
      </noscript>
    </div>
  )
}
