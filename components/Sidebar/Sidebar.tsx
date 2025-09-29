'use client'

import {SidebarSection} from '@/components/Sidebar/SidebarSection'
import {useHeaderState} from '@/lib/hooks/useHeaderState'
import {useRemoveFromFavorites} from '@/lib/hooks/useRemoveFromFavorites'
import {useRemoveItemFromHistory} from '@/lib/hooks/useRemoveItemFromHistory'
import {useAppSelector} from '@/lib/store/hooks'
import {useGetPopularSubredditsQuery} from '@/lib/store/services/subredditApi'
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
import {MdDynamicFeed} from 'react-icons/md'

/**
 * Sidebar component
 */
export function Sidebar() {
  const mounted = useMounted()
  const recent = useAppSelector((state) => state.settings.recent)
  const favorites = useAppSelector((state) => state.settings.favorites)
  const {remove: removeFromHistory} = useRemoveItemFromHistory()
  const {remove: removeFromFavorites} = useRemoveFromFavorites()
  const {data: trending = []} = useGetPopularSubredditsQuery({limit: 10})
  const {toggleNavbarOnMobileHandler} = useHeaderState()

  if (!mounted) return null

  return (
    <ScrollArea type="never" h="100%">
      <Stack gap="xs">
        <NavLink
          label="Home"
          component={Link}
          href="/"
          onClick={toggleNavbarOnMobileHandler}
          leftSection={<FaHome />}
        />

        <NavLink
          label="All"
          component={Link}
          href="/r/all"
          onClick={toggleNavbarOnMobileHandler}
          leftSection={<MdDynamicFeed />}
        />

        <NavLink
          label="Popular"
          component={Link}
          href="/r/popular"
          onClick={toggleNavbarOnMobileHandler}
          leftSection={<FaRegArrowAltCircleUp />}
        />

        <SidebarSection
          enableDelete
          label="Favorites"
          onDelete={(sub) => removeFromFavorites(sub.display_name)}
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
          onDelete={(sub) => removeFromHistory(sub.display_name)}
          subreddits={recent}
          leftSection={<FaHistory />}
        />

        <NavLink
          label="About"
          component={Link}
          href="/about"
          onClick={toggleNavbarOnMobileHandler}
          leftSection={<FaInfoCircle />}
        />
      </Stack>
    </ScrollArea>
  )
}
