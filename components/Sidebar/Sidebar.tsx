'use client'

import {SidebarSection} from '@/components/Sidebar/SidebarSection'
import {useHeaderState} from '@/lib/hooks/useHeaderState'
import {useRemoveItemFromHistory} from '@/lib/hooks/useRemoveItemFromHistory'
import {useAppSelector} from '@/lib/store/hooks'
import {useGetPopularSubredditsQuery} from '@/lib/store/services/redditApi'
import {NavLink, ScrollArea, Stack} from '@mantine/core'
import {useMounted} from '@mantine/hooks'
import Link from 'next/link'
import {
  FaHeart,
  FaHistory,
  FaHome,
  FaInfoCircle,
  FaRegArrowAltCircleUp
} from 'react-icons/fa'
import {FaArrowTrendUp} from 'react-icons/fa6'

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
          label="Home"
          component={Link}
          href="/r/all"
          onClick={showNavbar ? toggleNavbarHandler : undefined}
          leftSection={<FaHome />}
        />

        <NavLink
          label="Popular"
          component={Link}
          href="/r/popular"
          onClick={showNavbar ? toggleNavbarHandler : undefined}
          leftSection={<FaRegArrowAltCircleUp />}
        />

        <SidebarSection
          enableDelete
          label="Favorites"
          onDelete={(sub) => remove(sub.display_name)}
          subreddits={favorites}
          leftSection={<FaHeart />}
        />

        <SidebarSection
          enableFavorite
          label="Trending"
          subreddits={trending}
          leftSection={<FaArrowTrendUp />}
        />

        <SidebarSection
          enableDelete
          enableFavorite
          label="History"
          onDelete={(sub) => remove(sub.display_name)}
          subreddits={recent}
          leftSection={<FaHistory />}
        />

        <NavLink
          label="About"
          component={Link}
          href="/about"
          onClick={showNavbar ? toggleNavbarHandler : undefined}
          leftSection={<FaInfoCircle />}
        />
      </Stack>
    </ScrollArea>
  )
}
