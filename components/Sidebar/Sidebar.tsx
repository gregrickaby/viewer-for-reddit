'use client'

import {SidebarSection} from '@/components/Sidebar/SidebarSection'
import {useHeaderState} from '@/lib/hooks/useHeaderState'
import {useRemoveItemFromHistory} from '@/lib/hooks/useRemoveItemFromHistory'
import {useAppSelector} from '@/lib/store/hooks'
import {useGetPopularSubredditsQuery} from '@/lib/store/services/redditApi'
import {NavLink, ScrollArea, Stack} from '@mantine/core'
import {useMounted} from '@mantine/hooks'
import Link from 'next/link'

export function Sidebar() {
  const mounted = useMounted()
  const recent = useAppSelector((state) => state.settings.recent)
  const favorites = useAppSelector((state) => state.settings.favorites)
  const {remove} = useRemoveItemFromHistory()
  const {data: trending = []} = useGetPopularSubredditsQuery({limit: 10})
  const {showNavbar, toggleNavbarHandler} = useHeaderState()

  if (!mounted) return null

  return (
    <ScrollArea type="auto" h="100%">
      <Stack gap="xs">
        <NavLink
          label="All"
          component={Link}
          href="/r/all"
          onClick={showNavbar ? toggleNavbarHandler : undefined}
        />
        <NavLink
          label="Popular"
          component={Link}
          href="/r/popular"
          onClick={showNavbar ? toggleNavbarHandler : undefined}
        />

        <SidebarSection enableFavorite label="Trending" subreddits={trending} />

        <SidebarSection
          enableDelete
          label="Favorites"
          onDelete={(sub) => remove(sub.display_name)}
          subreddits={favorites}
        />

        <SidebarSection
          enableDelete
          enableFavorite
          label="Recent"
          onDelete={(sub) => remove(sub.display_name)}
          subreddits={recent}
        />

        <NavLink
          label="About Viewer for Reddit"
          component={Link}
          href="/about"
          onClick={showNavbar ? toggleNavbarHandler : undefined}
        />
      </Stack>
    </ScrollArea>
  )
}
