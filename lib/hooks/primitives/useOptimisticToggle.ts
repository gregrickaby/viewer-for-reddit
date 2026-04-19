'use client'

import {useOptimistic, useState, useTransition} from 'react'

interface UseOptimisticToggleReturn {
  value: boolean
  isPending: boolean
  toggle: () => void
}

/**
 * Primitive for optimistic boolean toggle mutations.
 *
 * Owns the useState + useOptimistic + useTransition choreography, the
 * committed/optimistic split, the isPending race-condition guard, and the
 * startTransition block. React auto-reverts the optimistic value when the
 * mutation fails.
 *
 * Side effects (logging, callbacks) belong in the mutationFn wrapper at the
 * call site.
 *
 * @param initial - The initial boolean value.
 * @param mutationFn - Async function that performs the mutation. Receives the
 *   next boolean value and returns `{success: boolean}`.
 * @returns `value` (optimistic display value), `isPending`, and `toggle`.
 */
export function useOptimisticToggle(
  initial: boolean,
  mutationFn: (next: boolean) => Promise<{success: boolean}>
): UseOptimisticToggleReturn {
  const [committed, setCommitted] = useState(initial)
  const [optimistic, setOptimistic] = useOptimistic(committed)
  const [isPending, startTransition] = useTransition()

  const toggle = () => {
    if (isPending) return
    const next = !committed

    startTransition(async () => {
      setOptimistic(next)
      const result = await mutationFn(next)
      if (result.success) {
        setCommitted(next)
      }
    })
  }

  return {value: optimistic, isPending, toggle}
}
