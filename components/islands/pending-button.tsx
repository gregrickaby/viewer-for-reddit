'use client'

import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'

/**
 * A submit button that shows it's working: disabled and
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
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}) {
  const status = useFormStatus()
  const busy = pending ?? status.pending
  return (
    <Button aria-busy={busy} disabled={busy} size="sm" type="submit" variant={variant}>
      {children}
    </Button>
  )
}
