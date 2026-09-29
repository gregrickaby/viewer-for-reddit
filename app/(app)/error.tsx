'use client'

import { Button } from '@/components/ui/button'
import styles from './status-page.module.css'

/** The route-level fallback behind every `SectionError` (design §12). */
export default function AppError({
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <div className={styles.root} role="alert">
      <h1 className={styles.title}>Something went wrong</h1>
      <p className={styles.detail}>Reddit may be busy or rate-limiting us.</p>
      <Button variant="secondary" size="sm" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  )
}
