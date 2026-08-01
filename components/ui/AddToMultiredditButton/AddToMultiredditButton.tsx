'use client'

import {
  addSubredditToMultireddit,
  removeSubredditFromMultireddit
} from '@/lib/actions/reddit/multireddits'
import {MultiredditMenuButton} from '@/components/ui/MultiredditMenuButton/MultiredditMenuButton'
import type {ManagedMultireddit} from '@/lib/hooks/useMultiredditManager'

interface AddToMultiredditButtonProps {
  /** Current subreddit name (without the r/ prefix) */
  subredditName: string
  /** User's multireddits list */
  multireddits: ManagedMultireddit[]
}

/**
 * Menu button for adding or removing the current subreddit from the user's multireddits.
 * Renders nothing when the user has no multireddits.
 */
export function AddToMultiredditButton({
  subredditName,
  multireddits
}: Readonly<AddToMultiredditButtonProps>) {
  return (
    <MultiredditMenuButton
      multireddits={multireddits}
      menuLabel="Your Multireddits"
      triggerLabel="Add to multireddit"
      isInMulti={(multi) =>
        multi.subreddits.some(
          (s) => s.toLowerCase() === subredditName.toLowerCase()
        )
      }
      onAdd={(path) => addSubredditToMultireddit(path, subredditName)}
      onRemove={(path) => removeSubredditFromMultireddit(path, subredditName)}
    />
  )
}
