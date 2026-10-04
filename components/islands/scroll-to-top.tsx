'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './scroll-to-top.module.css'

/** How far down the page the button appears. */
const SHOW_AFTER = 200

/**
 * A fixed button that returns to the top of the page once the reader has
 * scrolled past `SHOW_AFTER`, which is when a sentinel that tall at the top of
 * the page leaves the viewport. It lives in the persistent layout, so it follows
 * the reader across navigations.
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false)
  const sentinel = useRef<HTMLSpanElement>(null)

  // An observer instead of a scroll listener: nothing runs while the reader scrolls.
  useEffect(() => {
    const target = sentinel.current
    if (!target) return
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry!.isIntersecting))
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  function top() {
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: calm ? 'instant' : 'smooth' })
  }

  return (
    <>
      <span
        ref={sentinel}
        className={styles.sentinel}
        style={{ blockSize: SHOW_AFTER }}
        aria-hidden="true"
      />
      <button
        type="button"
        className={styles.button}
        data-visible={visible}
        onClick={top}
        aria-label="Scroll to top"
        // Inert, not aria-hidden: the button hides itself while it holds focus after a click.
        inert={!visible}
      >
        <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
          <path d="M10 16V4M4.5 9.5 10 4l5.5 5.5" />
        </svg>
      </button>
    </>
  )
}
