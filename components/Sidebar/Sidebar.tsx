'use client'

import {SidebarNavLink} from '@/components/SidebarNavLink/SidebarNavLink'
import {
  clearSingleFavorite,
  clearSingleRecent,
  toggleFavoriteSubreddit
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
  const {data: popular} = useGetPopularSubredditsQuery({limit: 5})
  const children = popular?.data?.children ?? []

  if (!mounted) return null

  return (
    <ScrollArea type="auto" h="100%">
      <Stack gap="xs" p="sm">
        <NavLink label="All" component={Link} href="/r/all" />
        <NavLink label="Popular" component={Link} href="/r/popular" />

        <NavLink label="Trending" childrenOffset={8}>
          {children.map((sub) => {
            const displayName = sub.data.display_name
            const isFavorite = favorites.some(
              (f) => f.display_name === displayName
            )

            return (
              <SidebarNavLink
                key={displayName}
                name={displayName ?? ''}
                icon={sub.data.icon_img}
                isFavorite={isFavorite}
                onFavoriteToggle={() => {
                  dispatch(
                    toggleFavoriteSubreddit({
                      display_name: displayName ?? '',
                      icon_img: sub.data.icon_img ?? '',
                      over18: sub.data.over18 ?? false,
                      subscribers: sub.data.subscribers ?? 0
                    })
                  )
                  showNotification({
                    title: isFavorite ? 'Removed' : 'Added',
                    message: `r/${displayName} ${isFavorite ? 'removed from' : 'added to'} favorites.`
                  })
                }}
              />
            )
          })}
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
            recent.map((sub) => {
              const isFavorite = favorites.some(
                (f) => f.display_name === sub.display_name
              )

              return (
                <SidebarNavLink
                  key={sub.display_name}
                  name={sub.display_name}
                  icon={sub.icon_img}
                  isFavorite={isFavorite}
                  onDelete={() => {
                    dispatch(clearSingleRecent(sub.display_name))
                    showNotification({
                      title: 'Deleted',
                      message: `r/${sub.display_name} removed from recent history.`
                    })
                  }}
                  onFavoriteToggle={() => {
                    dispatch(
                      toggleFavoriteSubreddit({
                        display_name: sub.display_name,
                        icon_img: sub.icon_img ?? '',
                        over18: sub.over18 ?? false,
                        subscribers: sub.subscribers ?? 0
                      })
                    )
                    showNotification({
                      title: isFavorite ? 'Removed' : 'Added',
                      message: `r/${sub.display_name} ${isFavorite ? 'removed from' : 'added to'} favorites.`
                    })
                  }}
                />
              )
            })}
        </NavLink>
      </Stack>
    </ScrollArea>
  )
}
