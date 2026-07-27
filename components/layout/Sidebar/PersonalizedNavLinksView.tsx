'use client'

import {NavLink} from '@mantine/core'
import {IconBookmark, IconTrendingUp} from '@tabler/icons-react'
import Link from 'next/link'

interface PersonalizedNavLinksViewProps {
  username: string
}

/**
 * Renders the Popular/All/Saved links. Split out from `PersonalizedNavLinks`
 * (a Server Component) because `NavLink`'s `component={Link}` prop passes a
 * component reference, and functions can't cross the server/client boundary
 * as props -- only plain data can. This file imports `Link` locally instead.
 */
export function PersonalizedNavLinksView({
  username
}: Readonly<PersonalizedNavLinksViewProps>) {
  return (
    <>
      <NavLink
        component={Link}
        href="/r/popular"
        label="Popular"
        leftSection={<IconTrendingUp size={16} />}
      />
      <NavLink
        component={Link}
        href="/r/all"
        label="All"
        leftSection={<IconTrendingUp size={16} />}
      />
      <NavLink
        component={Link}
        href={`/user/${username}/saved`}
        label="Saved"
        leftSection={<IconBookmark size={16} />}
      />
    </>
  )
}
