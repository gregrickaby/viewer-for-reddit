'use client'

import {savePost} from '@/lib/actions/reddit'
import {useState, useTransition} from 'react'

/**
 * Options for configuring the useSavePost hook.
 */
interface UseSavePostOptions {
  /** Full Reddit thing name (e.g., 't3_abc123') */
  postName: string
  /** Initial saved state from Reddit API */
  initialSaved: boolean
  /** Optional callback when item is unsaved (for saved items list) */
  onUnsave?: () => void
}

/**
 * Return type for useSavePost hook.
 */
interface UseSavePostReturn {
  /** Whether the post is currently saved */
  isSaved: boolean
  /** Whether a save operation is in progress */
  isPending: boolean
  /** Function to toggle save state */
  toggleSave: () => void
}

/**
 * Hook for handling Reddit post save/unsave with optimistic updates.
 * Implements race condition prevention and automatic rollback on failure.
 *
 * Features:
 * - Optimistic UI updates (immediate feedback)
 * - Automatic rollback on API failure
 * - Race condition prevention (ignores clicks while pending)
 *
 * @param options - Configuration for the save post hook
 * @returns Save state, pending status, and toggle handler
 *
 * @example
 * ```typescript
 * const {isSaved, isPending, toggleSave} = useSavePost({
 *   postName: 't3_abc123',
 *   initialSaved: false
 * })
 *
 * <button onClick={toggleSave} disabled={isPending}>
 *   {isSaved ? 'Unsave' : 'Save'}
 * </button>
 * ```
 */
export function useSavePost({
  postName,
  initialSaved,
  onUnsave
}: Readonly<UseSavePostOptions>): UseSavePostReturn {
  const [isPending, startTransition] = useTransition()
  const [isSaved, setIsSaved] = useState(initialSaved)

  const toggleSave = () => {
    // Prevent race conditions
    if (isPending) return

    const currentSaveState = isSaved
    const newSaveState = !currentSaveState

    // Optimistic update
    setIsSaved(newSaveState)

    startTransition(async () => {
      const result = await savePost(postName, newSaveState)
      if (!result.success) {
        // Revert on failure
        setIsSaved(currentSaveState)
      } else if (!newSaveState && onUnsave) {
        // Item was unsaved successfully, notify parent
        onUnsave()
      }
    })
  }

  return {
    isSaved,
    isPending,
    toggleSave
  }
}
