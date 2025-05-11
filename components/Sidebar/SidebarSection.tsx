'use client'

import {SidebarNavLink} from '@/components/Sidebar/SidebarNavLink'
import {useSidebarSection} from '@/lib/hooks/useSidebarSection'
import type {SubredditItem} from '@/lib/types'
import {NavLink} from '@mantine/core'

interface SidebarSectionProps {
  label: string
  subreddits: SubredditItem[]
  enableDelete?: boolean
  enableFavorite?: boolean
  onDelete?: (sub: SubredditItem) => void
}

export function SidebarSection({
  label,
  subreddits,
  enableDelete = false,
  enableFavorite = false,
  onDelete
}: Readonly<SidebarSectionProps>) {
  const {handleDelete} = useSidebarSection(onDelete)

  if (!subreddits.length) return null

  return (
    <NavLink label={label} childrenOffset={8}>
      {subreddits.map((sub) => (
        <SidebarNavLink
          key={sub.display_name}
          name={sub.display_name}
          icon={sub.icon_img}
          enableFavorite={enableFavorite}
          onDelete={enableDelete ? () => handleDelete(sub) : undefined}
        />
      ))}
    </NavLink>
  )
}
