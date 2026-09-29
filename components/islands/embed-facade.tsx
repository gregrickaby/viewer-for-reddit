'use client'

/* eslint-disable @next/next/no-img-element -- the poster is Reddit's own resized preview */
import { type MouseEvent, useEffect, useRef, useState } from 'react'
import styles from './players.module.css'

export type EmbedFacadeProps = {
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
 * A click-to-load embed (design §8.7): until the reader presses play, it is
 * a plain link with Reddit's preview, and no request reaches the provider.
 * Without JavaScript the link opens the original.
 */
export function EmbedFacade(props: EmbedFacadeProps) {
  const [active, setActive] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const box = props.height
    ? { blockSize: props.height }
    : { aspectRatio: String(props.aspectRatio) }

  // Move focus into the player once it exists, so keyboard users land on it.
  useEffect(() => {
    if (active) iframeRef.current?.focus()
  }, [active])

  function activate(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    setActive(true)
  }

  if (active) {
    return (
      <div className={styles.embed} style={box}>
        <iframe
          ref={iframeRef}
          className={styles.iframe}
          src={props.iframeSrc}
          title={props.title}
          allow={props.allow}
          sandbox={props.sandbox}
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <a
      href={props.originalUrl}
      className={styles.facade}
      style={box}
      target="_blank"
      rel="noopener noreferrer nofollow ugc"
      onClick={activate}
      aria-label={`Play ${props.title} (${props.providerName})`}
    >
      {props.poster ? (
        <img
          className={styles.facadePoster}
          src={props.poster}
          alt=""
          loading="lazy"
          decoding="async"
        />
      ) : null}
      <span className={styles.facadeBadge} data-provider={props.provider}>
        {props.providerName}
      </span>
      <span className={styles.facadePlay} aria-hidden="true">
        ▶
      </span>
    </a>
  )
}
