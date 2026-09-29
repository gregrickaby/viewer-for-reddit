'use client'

import { type FormEvent, startTransition, useState, useTransition } from 'react'
import { type ServerAction, formAction } from '@/lib/actions/form-action'
import type { ActionResult } from '@/lib/actions/result'

type Handlers<T> = {
  /** Runs first, inside the transition: set optimistic state here. */
  optimistic: (formData: FormData) => void
  /** Runs when the action returns, in a new transition: commit confirmed state here. */
  settled?: (result: ActionResult<T>, formData: FormData) => void
}

/**
 * Keeps a `<form action={serverAction}>` progressively enhanced (it posts
 * before hydration and without JS) and, once hydrated, runs the action in a
 * transition with optimistic state (design §8.6).
 *
 * Calling `preventDefault()` in `onSubmit` stops React from also running the
 * form's `action`; React only records the pending form status.
 */
export function useEnhancedForm<T>(serverAction: ServerAction<T>, handlers: Handlers<T>) {
  const [isPending, startPending] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const submitter = (event.nativeEvent as SubmitEvent).submitter
    const formData = new FormData(event.currentTarget, submitter)
    startPending(async () => {
      setError(null)
      handlers.optimistic(formData)
      const result = await serverAction(formData)
      // State updates after an `await` need their own transition.
      startTransition(() => {
        if (!result.ok) setError(result.error.message)
        handlers.settled?.(result, formData)
      })
    })
  }

  return { formProps: { action: formAction(serverAction), onSubmit }, isPending, error }
}
