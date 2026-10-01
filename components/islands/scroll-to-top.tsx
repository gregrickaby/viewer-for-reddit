'use client'

import { useEffect, useState } from 'react'
import styles from './scroll-to-top.module.css'

/** How far down the page the button appears. */
const SHOW_AFTER = 200

/**
 * A fixed button that returns to the top of the page once the reader has
 * scrolled past `SHOW_AFTER`. It lives in the persistent layout, so it follows
 * the reader across navigations.
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const update = () => setVisible(window.scrollY > SHOW_AFTER)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  function top() {
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: calm ? 'instant' : 'smooth' })
  }

  return (
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
  )
}
