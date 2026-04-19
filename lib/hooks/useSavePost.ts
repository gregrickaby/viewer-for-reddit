'use client'

import {savePost} from '@/lib/actions/reddit/users'
import {useOptimisticToggle} from './primitives/useOptimisticToggle'

interface UseSavePostOptions {
  postName: string
  initialSaved: boolean
  onUnsave?: () => void
}

interface UseSavePostReturn {
  isSaved: boolean
  isPending: boolean
  toggleSave: () => void
}

/**
 * Toggles save/unsave state for a Reddit post with optimistic updates.
 *
 * @param options.postName - The post fullname (e.g. `t3_abc123`).
 * @param options.initialSaved - Whether the post is already saved.
 * @param options.onUnsave - Optional callback fired after a successful unsave.
 * @returns `isSaved`, `isPending`, and `toggleSave`.
 */
export function useSavePost({
  postName,
  initialSaved,
  onUnsave
}: Readonly<UseSavePostOptions>): UseSavePostReturn {
  const {
    value: isSaved,
    isPending,
    toggle: toggleSave
  } = useOptimisticToggle(initialSaved, async (next) => {
    const result = await savePost(postName, next)
    if (result.success && !next) onUnsave?.()
    return result
  })

  return {isSaved, isPending, toggleSave}
}
