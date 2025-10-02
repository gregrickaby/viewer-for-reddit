'use client'

import {SidebarSection} from '@/components/Sidebar/SidebarSection'
import {useHeaderState} from '@/lib/hooks/useHeaderState'
import {useRemoveFromFavorites} from '@/lib/hooks/useRemoveFromFavorites'
import {useRemoveItemFromHistory} from '@/lib/hooks/useRemoveItemFromHistory'
import {useAppSelector} from '@/lib/store/hooks'
import {
  useGetUserCustomFeedsQuery,
  useGetUserSubscriptionsQuery
} from '@/lib/store/services/authenticatedApi'
import {useGetPopularSubredditsQuery} from '@/lib/store/services/subredditApi'
import {NavLink, ScrollArea, Stack} from '@mantine/core'
import {useMounted} from '@mantine/hooks'
import Link from 'next/link'
import {
  FaHeart,
  FaHistory,
  FaHome,
  FaInfoCircle,
  FaRegArrowAltCircleUp,
  FaUserCircle
} from 'react-icons/fa'
import {FaArrowTrendUp, FaLayerGroup} from 'react-icons/fa6'
import {MdDynamicFeed} from 'react-icons/md'

/**
 * Sidebar component
 */
export function Sidebar() {
  const mounted = useMounted()
  const recent = useAppSelector((state) => state.settings.recent)
  const favorites = useAppSelector((state) => state.settings.favorites)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const {remove: removeFromHistory} = useRemoveItemFromHistory()
  const {remove: removeFromFavorites} = useRemoveFromFavorites()
  const {data: trending = []} = useGetPopularSubredditsQuery({limit: 10})
  const {toggleNavbarOnMobileHandler} = useHeaderState()

  // Fetch user subscriptions and custom feeds using RTK Query
  const {data: subscriptions = []} = useGetUserSubscriptionsQuery(undefined, {
    skip: !isAuthenticated
  })
  const {data: customFeeds = []} = useGetUserCustomFeedsQuery(undefined, {
    skip: !isAuthenticated
  })

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

        {isAuthenticated && subscriptions.length > 0 && (
          <SidebarSection
            enableFavorite
            label="My Communities"
            subreddits={subscriptions}
            leftSection={<FaUserCircle />}
          />
        )}

        {isAuthenticated && customFeeds.length > 0 && (
          <NavLink label="My Custom Feeds" leftSection={<FaLayerGroup />}>
            {customFeeds.map((feed) => (
              <NavLink
                key={feed.path}
                label={feed.display_name || feed.name}
                component={Link}
                href={feed.path}
                onClick={toggleNavbarOnMobileHandler}
              />
            ))}
          </NavLink>
        )}

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
