'use client'

import {
  addUserToMultireddit,
  removeUserFromMultireddit
} from '@/lib/actions/reddit/multireddits'
import type {ManagedMultireddit} from '@/lib/hooks/useMultiredditManager'
import {ActionIcon, Menu, Tooltip} from '@mantine/core'
import {IconCheck, IconList} from '@tabler/icons-react'
import {useRouter} from 'next/navigation'
import {useTransition} from 'react'

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
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleToggle = (multi: ManagedMultireddit) => {
    if (isPending) return

    const userSubreddit = `u_${username}`
    const isInMulti = multi.subreddits.some(
      (s) => s.toLowerCase() === userSubreddit.toLowerCase()
    )

    startTransition(async () => {
      if (isInMulti) {
        await removeUserFromMultireddit(multi.path, username)
      } else {
        await addUserToMultireddit(multi.path, username)
      }
      router.refresh()
    })
  }

  if (multireddits.length === 0) return null

  return (
    <Menu shadow="md" withinPortal>
      <Menu.Target>
        <Tooltip label="Add to custom feed" withArrow>
          <ActionIcon
            variant="light"
            size="lg"
            disabled={isPending}
            aria-label="Add to custom feed"
          >
            <IconList size={18} />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Your Custom Feeds</Menu.Label>
        {multireddits.map((multi) => {
          const userSubreddit = `u_${username}`
          const isInMulti = multi.subreddits.some(
            (s) => s.toLowerCase() === userSubreddit.toLowerCase()
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
