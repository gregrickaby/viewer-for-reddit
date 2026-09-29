'use client'

import { type ErrorInfo, catchError } from 'next/error'
import styles from './section-error.module.css'

/**
 * A section-level error boundary (design §12): one failing section doesn't
 * blank the page, and `retry()` re-fetches just that section. Server error
 * messages are redacted in production, so the copy is generic.
 */
function SectionErrorFallback({ title }: { title: string }, { retry }: ErrorInfo) {
  return (
    <div className={styles.root} role="alert">
      <p className={styles.title}>{title}</p>
      <p className={styles.detail}>Reddit may be busy or rate-limiting us.</p>
      <button type="button" className={styles.retry} onClick={() => retry()}>
        Try again
      </button>
    </div>
  )
}

export const SectionError = catchError(SectionErrorFallback)
