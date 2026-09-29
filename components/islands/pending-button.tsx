'use client'

import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'

/**
 * A submit button that shows it's working (design §8.6): disabled and
 * `aria-busy` while its form's action runs. Forms driven by
 * `useEnhancedForm` pass `pending` themselves.
 */
export function PendingButton({
  children,
  pending,
  variant = 'primary',
}: {
  children: ReactNode
  pending?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
}) {
  const status = useFormStatus()
  const busy = pending ?? status.pending
  return (
    <Button type="submit" size="sm" variant={variant} disabled={busy} aria-busy={busy}>
      {children}
    </Button>
  )
}
