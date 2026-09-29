'use client'

import { type ReactNode, useActionState } from 'react'
import type { ActionResult } from '@/lib/actions/result'
import styles from './action-form.module.css'

type FormState = ActionResult<unknown> | null

/**
 * A form whose Server Action reports errors (design §8.2). `useActionState`
 * keeps the last result, so Reddit's reason shows under the form, and because
 * the action is passed straight through, Next posts it and re-renders with
 * that state even without JavaScript.
 */
export function ActionForm({
  action,
  children,
  className,
  success,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>
  children: ReactNode
  className?: string
  /** Shown after a successful submit that stays on the page. */
  success?: string
}) {
  const [state, formAction] = useActionState(action, null)
  return (
    <form action={formAction} className={className}>
      {children}
      {state && !state.ok ? (
        <p className={styles.error} role="alert">
          {state.error.message}
        </p>
      ) : state?.ok && success ? (
        <p className={styles.success} role="status">
          {success}
        </p>
      ) : null}
    </form>
  )
}
