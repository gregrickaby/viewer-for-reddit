'use client'

import appIcon from '@/app/icon.png'
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
}

export function SubredditName({
  name,
  icon,
  onDelete,
  enableFavorite
}: Readonly<SubredditNameProps>) {
  return (
    <Group className={classes.name} justify="space-between" wrap="nowrap">
      <Group gap="xs" wrap="nowrap" align="center">
        <Image
          alt={`Icon for subreddit ${name}`}
          className={classes.icon}
          height={24}
          width={24}
          src={icon || appIcon}
          unoptimized
        />
        <span title={`r/${name}`}>{`r/${name}`}</span>
      </Group>

      <Group gap="xs" wrap="nowrap">
        {enableFavorite && <Favorite subreddit={name} />}

        {onDelete && (
          <Tooltip label="Clear subreddit" position="bottom" withArrow>
            <ActionIcon
              size="xs"
              color="red"
              variant="subtle"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDelete()
              }}
              aria-label="Clear subreddit"
            >
              <FaTrashAlt />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
    </Group>
  )
}
