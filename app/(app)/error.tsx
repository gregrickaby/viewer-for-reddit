'use client'

import { addNextjsError } from '@datadog/browser-rum-nextjs'
import { useEffect } from 'react'

import { Button, LinkButton } from '@/components/ui/button'
import styles from './status-page.module.css'

/** The route-level fallback behind every `SectionError` (design §12). */
export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => addNextjsError(error), [error])

  return (
    <div className={styles.root} role="alert">
      <h1 className={styles.title}>Something went wrong</h1>
      <p className={styles.detail}>Reddit may be busy or rate-limiting us.</p>
      <div className={styles.actions}>
        <Button variant="secondary" size="sm" onClick={() => retry()}>
          Try again
        </Button>
        <LinkButton href="/home" variant="ghost" size="sm" transitionTypes={['nav-back']}>
          Home
        </LinkButton>
      </div>
    </div>
  )
}
