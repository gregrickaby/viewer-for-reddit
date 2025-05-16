'use client'

import {
  SubredditName,
  SubredditNameProps
} from '@/components/SubredditName/SubredditName'
import {useHeaderState} from '@/lib/hooks/useHeaderState'
import {NavLink} from '@mantine/core'
import Link from 'next/link'

export function SidebarNavLink(props: Readonly<SubredditNameProps>) {
  const {showNavbar, toggleNavbarHandler} = useHeaderState()

  return (
    <NavLink
      component={Link}
      href={`/r/${props.name}`}
      label={<SubredditName {...props} />}
      onClick={showNavbar ? toggleNavbarHandler : undefined}
    />
  )
}
