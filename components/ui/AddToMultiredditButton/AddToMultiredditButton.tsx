'use client'

import {
  addSubredditToMultireddit,
  removeSubredditFromMultireddit
} from '@/lib/actions/reddit'
import type {ManagedMultireddit} from '@/lib/hooks'
import {ActionIcon, Menu, Tooltip} from '@mantine/core'
import {IconCheck, IconList} from '@tabler/icons-react'
import {useTransition} from 'react'

interface AddToMultiredditButtonProps {
  subredditName: string
  multireddits: ManagedMultireddit[]
}

/**
 * Menu button for adding or removing the current subreddit from the user's multireddits.
 * Renders nothing when the user has no multireddits.
 *
 * @param subredditName - Current subreddit name (without 'r/' prefix)
 * @param multireddits - User's multireddits list
 */
export function AddToMultiredditButton({
  subredditName,
  multireddits
}: Readonly<AddToMultiredditButtonProps>) {
  const [isPending, startTransition] = useTransition()

  const handleToggle = (multi: ManagedMultireddit) => {
    if (isPending) return

    const isInMulti = multi.subreddits.some(
      (s) => s.toLowerCase() === subredditName.toLowerCase()
    )

    startTransition(async () => {
      if (isInMulti) {
        await removeSubredditFromMultireddit(multi.path, subredditName)
      } else {
        await addSubredditToMultireddit(multi.path, subredditName)
      }
    })
  }

  if (multireddits.length === 0) return null

  return (
    <Menu shadow="md" withinPortal>
      <Menu.Target>
        <Tooltip label="Add to multireddit" withArrow>
          <ActionIcon
            variant="light"
            size="lg"
            disabled={isPending}
            aria-label="Add to multireddit"
          >
            <IconList size={18} />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Your Multireddits</Menu.Label>
        {multireddits.map((multi) => {
          const isInMulti = multi.subreddits.some(
            (s) => s.toLowerCase() === subredditName.toLowerCase()
          )
          return (
            <Menu.Item
              key={multi.path}
              leftSection={isInMulti ? <IconCheck size={14} /> : undefined}
              onClick={() => handleToggle(multi)}
            >
              {multi.displayName}
            </Menu.Item>
          )
        })}
      </Menu.Dropdown>
    </Menu>
  )
}
