'use client'

/*
 * Shared bookkeeping for every video on the page (design §8.7, "Playback"):
 * - one lazily created observer for attaching players as they near the
 *   viewport, and one for visibility, instead of one per video;
 * - observe the wrapper, never the <video> (iOS WebKit stops reporting a
 *   playing, layer-promoted video);
 * - at most MAX_ATTACHED players hold a decoder; the least recently seen
 *   offscreen one goes back to its poster;
 * - starting an audible video pauses the other audible ones (GIF-style loops
 *   are silent and exempt).
 */

export const MAX_ATTACHED = 6
/** How far ahead of the viewport a player attaches. */
export const ATTACH_MARGIN = '600px 0px'
/** How much of a player must show to count as visible. */
export const VISIBLE_RATIO = 0.5

export type PlayerHandlers = {
  /** Load the media (set `src`, start hls.js). */
  attach?: () => void
  /** Release the decoder and go back to the poster. */
  detach?: () => void
  /** Play or pause as the player enters or leaves view. */
  visibility?: (visible: boolean) => void
  /** Pause because another audible player started. Only audible players set this. */
  yieldAudio?: () => void
}

type Entry = PlayerHandlers & { attached: boolean; visible: boolean; lastSeen: number }

/** Fullscreen hides the rest of the page, so every player reads as scrolled away. */
function inFullscreen() {
  const doc = document as Document & { webkitFullscreenElement?: Element | null }
  return Boolean(document.fullscreenElement ?? doc.webkitFullscreenElement)
}

const entries = new Map<Element, Entry>()
let attachObserver: IntersectionObserver | null = null
let visibilityObserver: IntersectionObserver | null = null

function observers(): [IntersectionObserver, IntersectionObserver] {
  attachObserver ??= new IntersectionObserver(
    (changes) => {
      for (const change of changes) if (change.isIntersecting) attach(change.target)
    },
    { rootMargin: ATTACH_MARGIN },
  )
  visibilityObserver ??= new IntersectionObserver(
    (changes) => {
      for (const change of changes) {
        const entry = entries.get(change.target)
        if (!entry) continue
        const visible = change.intersectionRatio >= VISIBLE_RATIO
        // Rotating a fullscreen player fires this too; the change after exit corrects it.
        if (!visible && inFullscreen()) continue
        entry.visible = visible
        if (visible) entry.lastSeen = performance.now()
        entry.visibility?.(visible)
      }
    },
    { threshold: [0, VISIBLE_RATIO] },
  )
  return [attachObserver, visibilityObserver]
}

function attach(element: Element) {
  const entry = entries.get(element)
  if (!entry || entry.attached || !entry.attach) return
  const attached = [...entries.entries()].filter(([, other]) => other.attached)
  if (attached.length >= MAX_ATTACHED) {
    const offscreen = attached.filter(([, other]) => !other.visible)
    const [oldest] = offscreen.sort(([, a], [, b]) => a.lastSeen - b.lastSeen)
    if (!oldest) return // everything attached is on screen; try again when one scrolls away
    oldest[1].attached = false
    oldest[1].detach?.()
  }
  entry.attached = true
  entry.lastSeen = performance.now()
  entry.attach()
}

/** Tracks a player's wrapper element. Returns the cleanup, which detaches it. */
export function registerPlayer(element: Element, handlers: PlayerHandlers): () => void {
  const [attaching, visibility] = observers()
  entries.set(element, { ...handlers, attached: false, visible: false, lastSeen: 0 })
  attaching.observe(element)
  visibility.observe(element)

  return () => {
    const entry = entries.get(element)
    attaching.unobserve(element)
    visibility.unobserve(element)
    entries.delete(element)
    if (entry?.attached) entry.detach?.()
    if (entries.size === 0) {
      attachObserver?.disconnect()
      visibilityObserver?.disconnect()
      attachObserver = visibilityObserver = null
    }
  }
}

/** An audible player started: every other audible player pauses. */
export function claimAudio(element: Element) {
  for (const [other, entry] of entries) if (other !== element) entry.yieldAudio?.()
}
