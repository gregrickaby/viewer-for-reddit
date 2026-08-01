'use client'

import type {ManagedMultireddit} from '@/lib/hooks/useMultiredditManager'
import {ActionIcon, Menu, Tooltip} from '@mantine/core'
import {IconCheck, IconList} from '@tabler/icons-react'
import {useRouter} from 'next/navigation'
import {useTransition} from 'react'

interface MultiredditMenuButtonProps {
  /** Multireddits to render as menu options */
  multireddits: ManagedMultireddit[]
  /** Label shown above the menu options */
  menuLabel: string
  /** Tooltip and aria-label for the trigger button */
  triggerLabel: string
  /** Returns whether the given multireddit already contains the target */
  isInMulti: (multi: ManagedMultireddit) => boolean
  /** Adds the target to the multireddit at the given path */
  onAdd: (path: string) => Promise<unknown>
  /** Removes the target from the multireddit at the given path */
  onRemove: (path: string) => Promise<unknown>
}

/**
 * Menu button for adding or removing a target (subreddit or user) from the
 * viewer's multireddits. Renders nothing when the viewer has no multireddits.
 */
export function MultiredditMenuButton({
  multireddits,
  menuLabel,
  triggerLabel,
  isInMulti,
  onAdd,
  onRemove
}: Readonly<MultiredditMenuButtonProps>) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleToggle = (multi: ManagedMultireddit) => {
    if (isPending) return

    startTransition(async () => {
      if (isInMulti(multi)) {
        await onRemove(multi.path)
      } else {
        await onAdd(multi.path)
      }
      router.refresh()
    })
  }

  if (multireddits.length === 0) return null

  return (
    <Menu shadow="md" withinPortal>
      <Menu.Target>
        <Tooltip label={triggerLabel} withArrow>
          <ActionIcon
            variant="light"
            size="lg"
            disabled={isPending}
            aria-label={triggerLabel}
          >
            <IconList size={18} />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{menuLabel}</Menu.Label>
        {multireddits.map((multi) => (
          <Menu.Item
            key={multi.path}
            leftSection={isInMulti(multi) ? <IconCheck size={14} /> : undefined}
            onClick={() => handleToggle(multi)}
          >
            {multi.displayName}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}
