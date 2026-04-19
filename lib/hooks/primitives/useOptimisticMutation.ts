'use client'

import {useOptimistic, useState, useTransition} from 'react'

interface UseOptimisticMutationReturn<TState, TAction> {
  state: TState
  isPending: boolean
  mutate: (action: TAction) => void
}

/**
 * Primitive for optimistic mutations with complex state.
 *
 * Owns the useState + useOptimistic + useTransition choreography, the
 * committed/optimistic split, the isPending race-condition guard, and the
 * startTransition block. React auto-reverts the optimistic state when the
 * mutation fails.
 *
 * Side effects (logging, callbacks) belong in the mutationFn wrapper at the
 * call site.
 *
 * @param initial - The initial committed state.
 * @param computeNext - Pure function that derives the next state from the
 *   current committed state and the dispatched action.
 * @param mutationFn - Async function that performs the mutation. Receives the
 *   computed next state and the original action, returns `{success: boolean}`.
 * @returns `state` (optimistic display state), `isPending`, and `mutate`.
 */
export function useOptimisticMutation<TState, TAction>(
  initial: TState,
  computeNext: (committed: TState, action: TAction) => TState,
  mutationFn: (next: TState, action: TAction) => Promise<{success: boolean}>
): UseOptimisticMutationReturn<TState, TAction> {
  const [committed, setCommitted] = useState(initial)
  const [optimistic, setOptimistic] = useOptimistic(committed)
  const [isPending, startTransition] = useTransition()

  const mutate = (action: TAction) => {
    if (isPending) return
    const next = computeNext(committed, action)

    startTransition(async () => {
      setOptimistic(next)
      const result = await mutationFn(next, action)
      if (result.success) {
        setCommitted(next)
      }
    })
  }

  return {state: optimistic, isPending, mutate}
}
