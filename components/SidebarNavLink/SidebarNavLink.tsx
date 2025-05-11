'use client'

import appIcon from '@/app/icon.png'
import {ActionIcon, Group, NavLink, Tooltip} from '@mantine/core'
import Image from 'next/image'
import Link from 'next/link'
import {FaTrashAlt} from 'react-icons/fa'
import classes from './SidebarNavLink.module.css'

interface SidebarNavLinkProps {
  name: string
  icon?: string
  onDelete?: () => void
}

function RenderLink({name, icon, onDelete}: Readonly<SidebarNavLinkProps>) {
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
      {onDelete && (
        <Tooltip label="Remove subreddit" position="bottom" withArrow>
          <ActionIcon
            size="xs"
            color="red"
            variant="subtle"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete()
            }}
            aria-label="Delete subreddit"
          >
            <FaTrashAlt />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  )
}

export function SidebarNavLink({name, icon, onDelete}: SidebarNavLinkProps) {
  return (
    <NavLink
      label={<RenderLink name={name} icon={icon} onDelete={onDelete} />}
      component={Link}
      href={`/r/${name}`}
    />
  )
}
