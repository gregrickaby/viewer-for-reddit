'use client'

import {SidebarNavLink} from '@/components/Layout/Sidebar/SidebarNavLink'
import {useSidebarSection} from '@/lib/hooks/ui/useSidebarSection'
import type {SubredditItem} from '@/lib/types'
import {NavLink} from '@mantine/core'

interface SidebarSectionProps {
  enableDelete?: boolean
  enableFavorite?: boolean
  label: string
  leftSection?: React.ReactNode
  onDelete?: (sub: SubredditItem) => void
  subreddits: SubredditItem[]
}

export function SidebarSection({
  label,
  leftSection,
  subreddits,
  enableDelete = false,
  enableFavorite = false,
  onDelete
}: Readonly<SidebarSectionProps>) {
  const {handleDelete} = useSidebarSection(onDelete)

  if (!subreddits.length) return null

  // Generate event name from label (e.g., "My Communities" -> "sidebar my communities section")
  const sectionEvent = `sidebar ${label.toLowerCase()} section`

  return (
    <NavLink
      data-umami-event={sectionEvent}
      label={label}
      childrenOffset={8}
      leftSection={leftSection}
    >
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
