'use client'

import {Favorite} from '@/components/Favorite/Favorite'
import {ActionIcon, Group, Tooltip} from '@mantine/core'
import Image from 'next/image'
import {FaTrashAlt} from 'react-icons/fa'
import classes from './SubredditName.module.css'

export interface SubredditNameProps {
  name: string
  icon?: string
  onDelete?: () => void
  enableFavorite?: boolean
  label?: string
}

export function SubredditName({
  name,
  icon,
  onDelete,
  enableFavorite,
  label
}: Readonly<SubredditNameProps>) {
  const displayLabel = label ?? `r/${name}`

  const fallbackIcon = '/icon.png'

  return (
    <Group className={classes.name} justify="space-between" wrap="nowrap">
      <Group gap="xs" wrap="nowrap" align="center">
        <Image
          alt={`Icon for subreddit ${name}`}
          className={classes.icon}
          height={24}
          width={24}
          src={icon || fallbackIcon}
          unoptimized
        />
        <span title={displayLabel}>{displayLabel}</span>
      </Group>

      <Group gap="xs" wrap="nowrap">
        {enableFavorite && <Favorite subreddit={name} />}

        {onDelete && (
          <Tooltip label="Remove" position="bottom" withArrow>
            <ActionIcon
              aria-label="Remove"
              size="xs"
              color="red"
              variant="subtle"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDelete()
              }}
            >
              <FaTrashAlt />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
    </Group>
  )
}
