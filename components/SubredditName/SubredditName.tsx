'use client'

import {Favorite} from '@/components/Favorite/Favorite'
import {selectIsAuthenticated} from '@/lib/store/features/authSlice'
import {useAppSelector} from '@/lib/store/hooks'
import {ActionIcon, Group, Tooltip} from '@mantine/core'
import Image from 'next/image'
import {FaTrashAlt} from 'react-icons/fa'
import AppIcon from '../../app/icon.png'
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
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  // If icon styles.redditmedia.com, use default icon.
  const iconSrc = icon?.includes('styles.redditmedia.com') ? AppIcon : icon

  return (
    <Group className={classes.name} justify="space-between" wrap="nowrap">
      <Group gap="xs" wrap="nowrap" align="center">
        <Image
          alt={`Icon for subreddit ${name}`}
          className={classes.icon}
          height={24}
          width={24}
          src={iconSrc || AppIcon}
          unoptimized
        />
        <span title={`r/${name}`}>{`r/${name}`}</span>
      </Group>

      <Group gap="xs" wrap="nowrap">
        {enableFavorite && !isAuthenticated && <Favorite subreddit={name} />}

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
