'use client'

/* eslint-disable @next/next/no-img-element -- the poster is Reddit's own resized preview */
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'

import { registerPlayer } from './player-registry'
import styles from './players.module.css'

export interface EmbedFacadeProps {
  provider: string
  /** Display name for the badge, e.g. "YouTube". */
  providerName: string
  title: string
  iframeSrc: string
  aspectRatio: number
  height: number | null
  allow: string
  sandbox: string
  originalUrl: string
  poster: string | null
}

/**
 * A click-to-load embed: until the reader presses play, it is
 * a plain link with Reddit's preview, and no request reaches the provider.
 * Without JavaScript the link opens the original. Scrolling the player out of
 * view unloads it, which stops the audio.
 */
export function EmbedFacade(props: EmbedFacadeProps) {
  const [active, setActive] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const box = props.height
    ? { blockSize: props.height }
    : { aspectRatio: String(props.aspectRatio) }

  // Move focus into the player once it exists, so keyboard users land on it.
  useEffect(() => {
    if (active) iframeRef.current?.focus()
  }, [active])

  // A cross-origin player can't be paused, so scrolling it out of view drops back
  // to the facade, which unloads it. Only after it was seen, so a tall embed that
  // never reaches half visible isn't unloaded on arrival.
  useEffect(() => {
    const element = boxRef.current
    if (!active || !element) return
    let seen = false
    return registerPlayer(element, {
      visibility: (visible) => {
        if (visible) seen = true
        else if (seen) setActive(false)
      },
    })
  }, [active])

  // Activity hides a page you leave with display: none, and a hidden iframe keeps
  // playing. Dropping back to the facade unloads the player.
  useLayoutEffect(() => () => setActive(false), [])

  function activate(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    setActive(true)
  }

  if (active) {
    return (
      <div className={styles.embed} ref={boxRef} style={box}>
        <iframe
          allow={props.allow}
          allowFullScreen
          className={styles.iframe}
          ref={iframeRef}
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox={props.sandbox}
          src={props.iframeSrc}
          title={props.title}
        />
      </div>
    )
  }

  return (
    <a
      aria-label={`Play ${props.title} (${props.providerName})`}
      className={styles.facade}
      href={props.originalUrl}
      onClick={activate}
      rel="noopener noreferrer nofollow ugc"
      style={box}
      target="_blank"
    >
      {props.poster ? (
        <img
          alt=""
          className={styles.facadePoster}
          decoding="async"
          loading="lazy"
          src={props.poster}
        />
      ) : null}
      <span className={styles.facadeBadge} data-provider={props.provider}>
        {props.providerName}
      </span>
      <span aria-hidden="true" className={styles.facadePlay}>
        ▶
      </span>
    </a>
  )
}
