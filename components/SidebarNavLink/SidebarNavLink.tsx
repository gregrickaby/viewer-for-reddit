'use client'

import appIcon from '@/app/icon.png'
import {ActionIcon, Group, NavLink, Tooltip} from '@mantine/core'
import Image from 'next/image'
import Link from 'next/link'
import {FaHeart, FaRegHeart, FaTrashAlt} from 'react-icons/fa'
import classes from './SidebarNavLink.module.css'

interface SidebarNavLinkProps {
  name: string
  icon?: string
  onDelete?: () => void
  isFavorite?: boolean
  onFavoriteToggle?: () => void
}

function RenderLink({
  name,
  icon,
  onDelete,
  isFavorite,
  onFavoriteToggle
}: Readonly<SidebarNavLinkProps>) {
  return (
    <Group justify="space-between" gap="xs" wrap="nowrap">
      <div className={classes.navLink}>
        <Image
          alt=""
          className={classes.icon}
          height={24}
          width={24}
          src={icon || appIcon}
          unoptimized
        />
        <span>{`r/${name}`}</span>
      </div>

      <Group gap="xs" wrap="nowrap">
        {onFavoriteToggle && (
          <Tooltip
            label={isFavorite ? 'Unfavorite' : 'Add to favorites'}
            position="bottom"
            withArrow
          >
            <ActionIcon
              size="xs"
              color="red"
              variant="subtle"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onFavoriteToggle()
              }}
              aria-label="Toggle favorite"
            >
              {isFavorite ? <FaHeart /> : <FaRegHeart />}
            </ActionIcon>
          </Tooltip>
        )}

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

export function SidebarNavLink({
  name,
  icon,
  onDelete,
  isFavorite,
  onFavoriteToggle
}: Readonly<SidebarNavLinkProps>) {
  return (
    <NavLink
      label={
        <RenderLink
          name={name}
          icon={icon}
          onDelete={onDelete}
          isFavorite={isFavorite}
          onFavoriteToggle={onFavoriteToggle}
        />
      }
      component={Link}
      href={`/r/${name}`}
    />
  )
}
