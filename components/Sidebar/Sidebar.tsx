'use client'

import {SidebarNavLink} from '@/components/SidebarNavLink/SidebarNavLink'
import {
  clearSingleFavorite,
  clearSingleRecent
} from '@/lib/store/features/settingsSlice'
import {useAppDispatch, useAppSelector} from '@/lib/store/hooks'
import {useGetPopularSubredditsQuery} from '@/lib/store/services/publicApi'
import {NavLink, ScrollArea, Stack} from '@mantine/core'
import {useMounted} from '@mantine/hooks'
import {showNotification} from '@mantine/notifications'
import Link from 'next/link'

export function Sidebar() {
  const mounted = useMounted()
  const dispatch = useAppDispatch()
  const recent = useAppSelector((state) => state.settings.recent)
  const favorites = useAppSelector((state) => state.settings.favorites)
  const {
    data: popular,
    isError,
    isLoading
  } = useGetPopularSubredditsQuery({limit: 5})

  const children = popular?.data?.children ?? []

  if (!mounted) return null

  return (
    <ScrollArea type="auto" h="100%">
      <Stack gap="xs" p="sm">
        <NavLink label="All" component={Link} href="/r/all" />
        <NavLink label="Popular" component={Link} href="/r/popular" />

        <NavLink label="Trending" childrenOffset={8}>
          {!isLoading &&
            !isError &&
            children?.length > 0 &&
            children.map((sub) => (
              <SidebarNavLink
                key={sub.data.display_name}
                name={sub.data.display_name ?? ''}
                icon={sub.data.icon_img}
              />
            ))}
        </NavLink>

        <NavLink label="Favorites" childrenOffset={8}>
          {favorites.length > 0 &&
            favorites.map((sub) => (
              <SidebarNavLink
                key={sub.display_name}
                name={sub.display_name}
                icon={sub.icon_img}
                onDelete={() => {
                  dispatch(clearSingleFavorite(sub.display_name))
                  showNotification({
                    title: 'Deleted',
                    message: `r/${sub.display_name} removed from favorites.`
                  })
                }}
              />
            ))}
        </NavLink>

        <NavLink label="Recent" childrenOffset={8}>
          {recent.length > 0 &&
            recent.map((sub) => (
              <SidebarNavLink
                key={sub.display_name}
                name={sub.display_name}
                icon={sub.icon_img}
                onDelete={() => {
                  dispatch(clearSingleRecent(sub.display_name))
                  showNotification({
                    title: 'Deleted',
                    message: `r/${sub.display_name} removed from recent history.`
                  })
                }}
              />
            ))}
        </NavLink>
      </Stack>
    </ScrollArea>
  )
}
