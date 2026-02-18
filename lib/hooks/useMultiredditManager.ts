'use client'

import {
  addSubredditToMultireddit,
  createMultireddit,
  deleteMultireddit,
  removeSubredditFromMultireddit,
  updateMultiredditName
} from '@/lib/actions/reddit'
import {logger} from '@/lib/utils/logger'
import {useState, useTransition} from 'react'

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
  const [multireddits, setMultireddits] =
    useState<ManagedMultireddit[]>(initialMultireddits)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const clearError = () => setError(null)

  const create = (name: string, displayName: string) => {
    if (isPending) return
    setError(null)

    startTransition(async () => {
      const result = await createMultireddit(name, displayName)
      if (result.success && result.path) {
        setMultireddits((prev) => [
          ...prev,
          {name, displayName, path: result.path!, subreddits: []}
        ])
      } else {
        const msg = result.error ?? 'Failed to create multireddit'
        setError(msg)
        logger.error('Failed to create multireddit', msg, {
          context: 'useMultiredditManager',
          name
        })
      }
    })
  }

  const remove = (multiPath: string) => {
    if (isPending) return
    setError(null)

    const snapshot = [...multireddits]
    setMultireddits((prev) => prev.filter((m) => m.path !== multiPath))

    startTransition(async () => {
      const result = await deleteMultireddit(multiPath)
      if (!result.success) {
        setMultireddits(snapshot)
        const msg = result.error ?? 'Failed to delete multireddit'
        setError(msg)
        logger.error('Failed to delete multireddit', msg, {
          context: 'useMultiredditManager',
          multiPath
        })
      }
    })
  }

  const rename = (multiPath: string, newDisplayName: string) => {
    if (isPending) return
    setError(null)

    const snapshot = [...multireddits]
    setMultireddits((prev) =>
      prev.map((m) =>
        m.path === multiPath ? {...m, displayName: newDisplayName} : m
      )
    )

    startTransition(async () => {
      const result = await updateMultiredditName(multiPath, newDisplayName)
      if (!result.success) {
        setMultireddits(snapshot)
        const msg = result.error ?? 'Failed to rename multireddit'
        setError(msg)
        logger.error('Failed to rename multireddit', msg, {
          context: 'useMultiredditManager',
          multiPath
        })
      }
    })
  }

  const addSubreddit = (multiPath: string, subredditName: string) => {
    if (isPending) return
    setError(null)

    const snapshot = [...multireddits]
    setMultireddits((prev) =>
      prev.map((m) =>
        m.path === multiPath
          ? {...m, subreddits: [...m.subreddits, subredditName]}
          : m
      )
    )

    startTransition(async () => {
      const result = await addSubredditToMultireddit(multiPath, subredditName)
      if (!result.success) {
        setMultireddits(snapshot)
        const msg = result.error ?? 'Failed to add subreddit'
        setError(msg)
        logger.error('Failed to add subreddit to multireddit', msg, {
          context: 'useMultiredditManager',
          multiPath,
          subredditName
        })
      }
    })
  }

  const removeSubreddit = (multiPath: string, subredditName: string) => {
    if (isPending) return
    setError(null)

    const snapshot = [...multireddits]
    setMultireddits((prev) =>
      prev.map((m) =>
        m.path === multiPath
          ? {...m, subreddits: m.subreddits.filter((s) => s !== subredditName)}
          : m
      )
    )

    startTransition(async () => {
      const result = await removeSubredditFromMultireddit(
        multiPath,
        subredditName
      )
      if (!result.success) {
        setMultireddits(snapshot)
        const msg = result.error ?? 'Failed to remove subreddit'
        setError(msg)
        logger.error('Failed to remove subreddit from multireddit', msg, {
          context: 'useMultiredditManager',
          multiPath,
          subredditName
        })
      }
    })
  }

  return {
    multireddits,
    error,
    isPending,
    clearError,
    create,
    remove,
    rename,
    addSubreddit,
    removeSubreddit
  }
}
