'use client'

import {logger} from '@/lib/datadog/client'
import videojs from 'video.js'
import type Player from 'video.js/dist/types/player'
import {useEffect, useRef} from 'react'

/**
 * Max players attached (i.e. actively buffering/decoding) at once. Feeds with
 * many videos would otherwise accumulate an unbounded number of live players
 * over a long scroll session; once this cap is hit, the oldest off-screen
 * player is disposed to make room and reverts to its poster placeholder.
 */
export const MAX_ACTIVE_PLAYERS = 6

/**
 * How far outside the viewport a video starts loading, so it's ready by the
 * time the user actually scrolls to it.
 */
const ATTACH_ROOT_MARGIN = '600px 0px'

/**
 * Fires once per container when it nears the viewport, to lazily create its
 * player. Shared across all videos (one observer, not one per instance).
 */
let attachObserver: IntersectionObserver | null = null
const attachCallbacks = new Map<Element, () => void>()

function getAttachObserver(): IntersectionObserver {
  attachObserver ??= new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        attachCallbacks.get(entry.target)?.()
      })
    },
    {rootMargin: ATTACH_ROOT_MARGIN}
  )
  return attachObserver
}

function observeForAttach(container: Element, attach: () => void) {
  attachCallbacks.set(container, attach)
  getAttachObserver().observe(container)
}

function unobserveForAttach(container: Element) {
  attachCallbacks.delete(container)
  attachObserver?.unobserve(container)
  if (attachCallbacks.size === 0) {
    attachObserver?.disconnect()
    attachObserver = null
  }
}

/**
 * Tracks visibility (for pause-on-scroll-away and eviction candidacy) for
 * every currently-attached player. Shared across all videos.
 *
 * Observes each video's *container* div, not the `<video>` element itself:
 * on iOS, WebKit promotes an actively-playing `<video>` to its own hardware
 * compositing layer, and IntersectionObserver callbacks reliably stop firing
 * for elements in that state (a known WebKit bug). The container is never
 * reparented or layer-promoted, so its intersection stays accurate.
 */
let visibilityObserver: IntersectionObserver | null = null
const visibilityCallbacks = new Map<
  Element,
  (entry: IntersectionObserverEntry) => void
>()

function getVisibilityObserver(): IntersectionObserver {
  visibilityObserver ??= new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        visibilityCallbacks.get(entry.target)?.(entry)
      })
    },
    {threshold: 0.25}
  )
  return visibilityObserver
}

function observeForVisibility(
  videoElement: Element,
  onChange: (entry: IntersectionObserverEntry) => void
) {
  visibilityCallbacks.set(videoElement, onChange)
  getVisibilityObserver().observe(videoElement)
}

function unobserveForVisibility(videoElement: Element) {
  visibilityCallbacks.delete(videoElement)
  visibilityObserver?.unobserve(videoElement)
  if (visibilityCallbacks.size === 0) {
    visibilityObserver?.disconnect()
    visibilityObserver = null
  }
}

/** Registry of attached players, used to pause others on play and to pick an eviction candidate. */
interface ActivePlayerEntry {
  visible: boolean
  detach: () => void
}
const activePlayers = new Map<Player, ActivePlayerEntry>()

function evictOneIfNeeded() {
  if (activePlayers.size < MAX_ACTIVE_PLAYERS) return
  for (const [, entry] of activePlayers) {
    if (!entry.visible) {
      entry.detach()
      return
    }
  }
  // All attached players are currently visible - over the cap, but nothing
  // safe to evict. Leave it be rather than yanking something on screen.
}

/**
 * Options for the useVideoPlayer hook.
 */
export interface UseVideoPlayerOptions {
  /** Video source URL */
  src: string
  /** Video type (HLS stream or MP4) */
  type?: 'hls' | 'mp4'
  /** Poster image URL (preview/thumbnail) */
  poster?: string
}

/**
 * Custom hook for video player functionality, backed by video.js.
 *
 * video.js bundles its own HLS implementation (VHS, `@videojs/http-streaming`)
 * so no separate hls.js dependency or Safari/native branching is needed - VHS
 * falls back to native HLS automatically where the browser supports it.
 *
 * Features:
 * - HLS and MP4 playback via video.js (adaptive quality, built-in error recovery)
 * - Lazy player creation: nothing loads until the container nears the viewport
 * - A capped number of concurrently-attached players, LRU-evicted by visibility
 * - Auto-pause when scrolled out of view (IntersectionObserver)
 * - Auto-pause other videos when one starts playing
 * - Automatic cleanup on unmount via `player.dispose()`
 *
 * @param options - Configuration options
 * @returns Ref to attach to the container element that hosts the player
 *
 * @example
 * ```typescript
 * const containerRef = useVideoPlayer({
 *   src: 'https://v.redd.it/abc123/DASH_720.mp4',
 *   type: 'mp4'
 * })
 *
 * return <div ref={containerRef} />
 * ```
 */
export function useVideoPlayer({
  src,
  type = 'mp4',
  poster
}: UseVideoPlayerOptions): React.RefObject<HTMLDivElement | null> {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let player: Player | null = null
    let posterImg: HTMLImageElement | null = null

    const showPoster = () => {
      if (!poster) return
      posterImg = document.createElement('img')
      posterImg.src = poster
      posterImg.alt = ''
      posterImg.className = 'vjs-poster-placeholder'
      container.appendChild(posterImg)
    }

    // Dispose the player and go back to showing the poster placeholder,
    // re-arming lazy attach so scrolling back into view recreates it.
    const detach = () => {
      if (!player) return
      const disposedPlayer = player
      activePlayers.delete(disposedPlayer)
      unobserveForVisibility(container)
      if (!disposedPlayer.isDisposed()) disposedPlayer.dispose()
      player = null
      showPoster()
      observeForAttach(container, attach)
    }

    const attach = () => {
      if (player) return
      unobserveForAttach(container)
      evictOneIfNeeded()

      posterImg?.remove()
      posterImg = null

      // video.js takes ownership of this element's DOM subtree, so it's
      // created imperatively rather than as JSX - React never reconciles
      // inside it. (aria-label lives on the React-rendered container
      // instead: video.js copies the tag's attributes onto its own wrapper
      // div too, so setting aria-label here would duplicate the accessible
      // name.)
      const newVideoElement = document.createElement('video')
      newVideoElement.className = 'video-js'
      newVideoElement.setAttribute('playsinline', 'true')
      container.appendChild(newVideoElement)

      const newPlayer = videojs(newVideoElement, {
        controls: true,
        preload: 'none',
        fluid: false,
        poster,
        sources: [
          {
            src,
            type: type === 'hls' ? 'application/x-mpegURL' : 'video/mp4'
          }
        ]
      })
      player = newPlayer

      // Pause other videos when this one starts playing
      const handlePlay = () => {
        activePlayers.forEach((_entry, otherPlayer) => {
          if (otherPlayer !== newPlayer && !otherPlayer.paused()) {
            otherPlayer.pause()
          }
        })
      }

      // Log playback errors (network failures, unsupported media, etc.)
      const handleError = () => {
        const mediaError = newPlayer.error()
        logger.error('Video playback error', {
          src,
          type,
          code: mediaError?.code,
          message: mediaError?.message
        })
      }

      newPlayer.on('play', handlePlay)
      newPlayer.on('error', handleError)

      const handleVisibilityChange = (entry: IntersectionObserverEntry) => {
        const activeEntry = activePlayers.get(newPlayer)
        if (activeEntry) activeEntry.visible = entry.isIntersecting
        if (!entry.isIntersecting && !newPlayer.paused()) {
          newPlayer.pause()
        }
      }

      activePlayers.set(newPlayer, {visible: false, detach})
      observeForVisibility(container, handleVisibilityChange)
    }

    // Lazy-load: attach immediately if already close to the viewport,
    // otherwise wait until scrolled near it.
    showPoster()
    observeForAttach(container, attach)

    return () => {
      unobserveForAttach(container)
      posterImg?.remove()

      if (player) {
        activePlayers.delete(player)
        unobserveForVisibility(container)
        // Releases the VHS/hls instance, native <video> resources, and DOM -
        // a single call replaces the manual hls.destroy()/video.src cleanup
        // this hook used to need.
        if (!player.isDisposed()) player.dispose()
      }
    }
  }, [src, type, poster])

  return containerRef
}
