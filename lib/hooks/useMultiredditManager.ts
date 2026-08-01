'use client'

import {
  addSubredditToMultireddit,
  createMultireddit,
  deleteMultireddit,
  removeSubredditFromMultireddit,
  updateMultiredditName
} from '@/lib/actions/reddit/multireddits'
import {logger} from '@/lib/datadog/client'
import {useRef, useState} from 'react'
import {useOptimisticMutation} from './primitives/useOptimisticMutation'

export interface ManagedMultireddit {
  name: string
  displayName: string
  path: string
  subreddits: string[]
  icon?: string
}

interface UseMultiredditManagerOptions {
  initialMultireddits: ManagedMultireddit[]
}

type MultiredditAction =
  | {type: 'create'; name: string; displayName: string}
  | {type: 'remove'; multiPath: string}
  | {type: 'rename'; multiPath: string; newDisplayName: string}
  | {type: 'addSubreddit'; multiPath: string; subredditName: string}
  | {type: 'removeSubreddit'; multiPath: string; subredditName: string}

/**
 * Derives the next optimistic multireddits list from the current committed
 * list and the dispatched action. `create` uses a placeholder path until the
 * server assigns the real one (swapped in by the mutation function).
 */
function computeNextMultireddits(
  committed: ManagedMultireddit[],
  action: MultiredditAction
): ManagedMultireddit[] {
  switch (action.type) {
    case 'create':
      return [
        ...committed,
        {
          name: action.name,
          displayName: action.displayName,
          path: `_pending_${action.name}`,
          subreddits: []
        }
      ]
    case 'remove':
      return committed.filter((m) => m.path !== action.multiPath)
    case 'rename':
      return committed.map((m) =>
        m.path === action.multiPath
          ? {...m, displayName: action.newDisplayName}
          : m
      )
    case 'addSubreddit':
      return committed.map((m) =>
        m.path === action.multiPath
          ? {...m, subreddits: [...m.subreddits, action.subredditName]}
          : m
      )
    case 'removeSubreddit':
      return committed.map((m) =>
        m.path === action.multiPath
          ? {
              ...m,
              subreddits: m.subreddits.filter((s) => s !== action.subredditName)
            }
          : m
      )
  }
}

/**
 * Hook for managing multireddits with optimistic updates.
 * Handles create, delete, rename, and subreddit add/remove with rollback on failure.
 *
 * @param options.initialMultireddits - Initial multireddits list from server
 * @returns Multireddits state, pending status, error, and mutation functions
 *
 * @example
 * ```typescript
 * const {multireddits, isPending, error, create, remove} = useMultiredditManager({
 *   initialMultireddits: fetchedMultireddits
 * })
 * ```
 */
export function useMultiredditManager({
  initialMultireddits
}: Readonly<UseMultiredditManagerOptions>) {
  const [error, setError] = useState<string | null>(null)

  const {
    state: multireddits,
    isPending,
    mutate,
    setState: setMultireddits
  } = useOptimisticMutation<ManagedMultireddit[], MultiredditAction>(
    initialMultireddits,
    computeNextMultireddits,
    async (next, action) => {
      setError(null)

      switch (action.type) {
        case 'create': {
          const result = await createMultireddit(
            action.name,
            action.displayName
          )
          if (result.success && result.path) {
            const committed = next.map((m) =>
              m.path === `_pending_${action.name}`
                ? {...m, path: result.path!}
                : m
            )
            return {success: true, committed}
          }
          const msg = result.error ?? 'Failed to create multireddit'
          setError(msg)
          logger.error('Failed to create multireddit', {
            error: msg,
            context: 'useMultiredditManager',
            name: action.name
          })
          return {success: false}
        }
        case 'remove': {
          const result = await deleteMultireddit(action.multiPath)
          if (!result.success) {
            const msg = result.error ?? 'Failed to delete multireddit'
            setError(msg)
            logger.error('Failed to delete multireddit', {
              error: msg,
              context: 'useMultiredditManager',
              multiPath: action.multiPath
            })
          }
          return {success: result.success}
        }
        case 'rename': {
          const result = await updateMultiredditName(
            action.multiPath,
            action.newDisplayName
          )
          if (!result.success) {
            const msg = result.error ?? 'Failed to rename multireddit'
            setError(msg)
            logger.error('Failed to rename multireddit', {
              error: msg,
              context: 'useMultiredditManager',
              multiPath: action.multiPath
            })
          }
          return {success: result.success}
        }
        case 'addSubreddit': {
          const result = await addSubredditToMultireddit(
            action.multiPath,
            action.subredditName
          )
          if (!result.success) {
            const msg = result.error ?? 'Failed to add subreddit'
            setError(msg)
            logger.error('Failed to add subreddit to multireddit', {
              error: msg,
              context: 'useMultiredditManager',
              multiPath: action.multiPath,
              subredditName: action.subredditName
            })
          }
          return {success: result.success}
        }
        case 'removeSubreddit': {
          const result = await removeSubredditFromMultireddit(
            action.multiPath,
            action.subredditName
          )
          if (!result.success) {
            const msg = result.error ?? 'Failed to remove subreddit'
            setError(msg)
            logger.error('Failed to remove subreddit from multireddit', {
              error: msg,
              context: 'useMultiredditManager',
              multiPath: action.multiPath,
              subredditName: action.subredditName
            })
          }
          return {success: result.success}
        }
      }
    }
  )

  const prevInitialRef = useRef(initialMultireddits)
  if (prevInitialRef.current !== initialMultireddits) {
    prevInitialRef.current = initialMultireddits
    setMultireddits(initialMultireddits)
  }

  return {
    multireddits,
    error,
    isPending,
    clearError: () => setError(null),
    create: (name: string, displayName: string) =>
      mutate({type: 'create', name, displayName}),
    remove: (multiPath: string) => mutate({type: 'remove', multiPath}),
    rename: (multiPath: string, newDisplayName: string) =>
      mutate({type: 'rename', multiPath, newDisplayName}),
    addSubreddit: (multiPath: string, subredditName: string) =>
      mutate({type: 'addSubreddit', multiPath, subredditName}),
    removeSubreddit: (multiPath: string, subredditName: string) =>
      mutate({type: 'removeSubreddit', multiPath, subredditName})
  }
}
