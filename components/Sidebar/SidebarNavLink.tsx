'use client'

import {
  SubredditName,
  type SubredditNameProps
} from '@/components/SubredditName/SubredditName'
import {useHeaderState} from '@/lib/hooks/useHeaderState'
import {NavLink} from '@mantine/core'
import Link from 'next/link'

interface SidebarNavLinkProps extends SubredditNameProps {
  href: string
}

export function SidebarNavLink({
  href,
  ...props
}: Readonly<SidebarNavLinkProps>) {
  const {toggleNavbarOnMobileHandler} = useHeaderState()

  return (
    <NavLink
      component={Link}
      href={href}
      label={<SubredditName {...props} />}
      onClick={toggleNavbarOnMobileHandler}
    />
  )
}
