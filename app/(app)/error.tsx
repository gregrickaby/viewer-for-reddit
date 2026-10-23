'use client'

import { useEffect } from 'react'
import { addNextjsError } from '@datadog/browser-rum-nextjs'

import { Button, LinkButton } from '@/components/ui/button'

import styles from './status-page.module.css'

/** The route-level fallback behind every `SectionError`. */
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
        <Button onClick={() => retry()} size="sm" variant="secondary">
          Try again
        </Button>
        <LinkButton href="/home" size="sm" transitionTypes={['nav-back']} variant="ghost">
          Home
        </LinkButton>
      </div>
    </div>
  )
}
