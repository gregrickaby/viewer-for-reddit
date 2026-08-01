'use client'

import {
  addUserToMultireddit,
  removeUserFromMultireddit
} from '@/lib/actions/reddit/multireddits'
import {MultiredditMenuButton} from '@/components/ui/MultiredditMenuButton/MultiredditMenuButton'
import type {ManagedMultireddit} from '@/lib/hooks/useMultiredditManager'

interface AddUserToMultiredditButtonProps {
  /** Reddit username (without the u/ prefix) */
  username: string
  /** Viewer's multireddits list */
  multireddits: ManagedMultireddit[]
}

/**
 * Menu button for adding or removing the current user from the viewer's custom feeds.
 * Renders nothing when the viewer has no custom feeds.
 */
export function AddUserToMultiredditButton({
  username,
  multireddits
}: Readonly<AddUserToMultiredditButtonProps>) {
  const userSubreddit = `u_${username}`

  return (
    <MultiredditMenuButton
      multireddits={multireddits}
      menuLabel="Your Custom Feeds"
      triggerLabel="Add to custom feed"
      isInMulti={(multi) =>
        multi.subreddits.some(
          (s) => s.toLowerCase() === userSubreddit.toLowerCase()
        )
      }
      onAdd={(path) => addUserToMultireddit(path, username)}
      onRemove={(path) => removeUserFromMultireddit(path, username)}
    />
  )
}
