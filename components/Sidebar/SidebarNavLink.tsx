import {
  SubredditName,
  SubredditNameProps
} from '@/components/SubredditName/SubredditName'
import {NavLink} from '@mantine/core'
import Link from 'next/link'

export function SidebarNavLink(props: Readonly<SubredditNameProps>) {
  return (
    <NavLink
      component={Link}
      href={`/r/${props.name}`}
      label={<SubredditName {...props} />}
    />
  )
}
