'use client'

import {SidebarNavLink} from '@/components/Sidebar/SidebarNavLink'
import {useSidebarSection} from '@/lib/hooks/useSidebarSection'
import type {SubredditItem} from '@/lib/types'
import {NavLink, Skeleton, Stack} from '@mantine/core'

interface SidebarSectionProps {
  enableDelete?: boolean
  enableFavorite?: boolean
  label: string
  leftSection?: React.ReactNode
  onDelete?: (sub: SubredditItem) => void
  subreddits: SubredditItem[]
  isLoading?: boolean
}

export function SidebarSection({
  label,
  leftSection,
  subreddits,
  enableDelete = false,
  enableFavorite = false,
  onDelete,
  isLoading = false
}: Readonly<SidebarSectionProps>) {
  const {handleDelete} = useSidebarSection(onDelete)

  if (!subreddits.length && !isLoading) return null

  return (
    <NavLink label={label} childrenOffset={8} leftSection={leftSection}>
      {isLoading ? (
        <Stack gap="xs" aria-hidden="true">
          {Array.from({length: 3}).map((_, index) => (
            <Skeleton key={index} height={18} radius="sm" />
          ))}
        </Stack>
      ) : (
        subreddits.map((sub) => {
          const value = sub.value?.trim()
          if (!value) {
            return null
          }

          const href = value.startsWith('/') ? value : `/${value}`
          const isSubreddit = value.startsWith('r/')
          const label = isSubreddit ? `r/${sub.display_name}` : href

          return (
            <SidebarNavLink
              key={`${sub.display_name}-${value}`}
              name={sub.display_name}
              icon={sub.icon_img}
              enableFavorite={enableFavorite && isSubreddit}
              onDelete={enableDelete ? () => handleDelete(sub) : undefined}
              href={href}
              label={label}
            />
          )
        })
      )}
    </NavLink>
  )
}
