'use client'

import {SidebarSection} from '@/components/Layout/Sidebar/SidebarSection'
import {UserMenu} from '@/components/UI/Auth/UserMenu'
import {Settings} from '@/components/UI/Settings/Settings'
import {useRemoveFromFavorites} from '@/lib/hooks/subreddit/useRemoveFromFavorites'
import {useHeaderState} from '@/lib/hooks/ui/useHeaderState'
import {useRemoveItemFromHistory} from '@/lib/hooks/util/useRemoveItemFromHistory'
import {useAppSelector} from '@/lib/store/hooks'
import {
  useGetUserCustomFeedsQuery,
  useGetUserSubscriptionsQuery
} from '@/lib/store/services/authenticatedApi'
import {useGetPopularSubredditsQuery} from '@/lib/store/services/subredditApi'
import {Box, Divider, Group, NavLink, ScrollArea, Stack} from '@mantine/core'
import {useMounted} from '@mantine/hooks'
import Link from 'next/link'
import {
  FaBookmark,
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
  const username = useAppSelector((state) => state.auth.username)
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

  // Sort subscriptions alphabetically by display_name
  const sortedSubscriptions = [...subscriptions].sort((a, b) =>
    a.display_name.localeCompare(b.display_name)
  )

  // Sort custom feeds alphabetically by display_name or name
  const sortedCustomFeeds = [...customFeeds].sort((a, b) =>
    (a.display_name || a.name).localeCompare(b.display_name || b.name)
  )

  if (!mounted) return null

  return (
    <ScrollArea type="never" h="100%">
      <Stack gap="xs">
        <Box hiddenFrom="sm">
          <Group gap="sm" mb="md" justify="center">
            <Settings />
            <UserMenu />
          </Group>
          <Divider mb="md" />
        </Box>

        <NavLink
          component={Link}
          data-umami-event="sidebar home"
          href="/"
          label="Home"
          leftSection={<FaHome />}
          onClick={toggleNavbarOnMobileHandler}
        />

        {isAuthenticated && sortedSubscriptions.length > 0 && (
          <SidebarSection
            enableFavorite
            label="My Communities"
            leftSection={<FaUserCircle />}
            subreddits={sortedSubscriptions}
          />
        )}

        {isAuthenticated && sortedCustomFeeds.length > 0 && (
          <NavLink
            data-umami-event="sidebar custom feeds section"
            label="My Custom Feeds"
            leftSection={<FaLayerGroup />}
          >
            {sortedCustomFeeds.map((feed) => (
              <NavLink
                component={Link}
                data-umami-event="sidebar custom feed click"
                href={feed.path}
                key={feed.path}
                label={feed.display_name || feed.name}
                onClick={toggleNavbarOnMobileHandler}
              />
            ))}
          </NavLink>
        )}

        {isAuthenticated && username && (
          <NavLink
            component={Link}
            data-umami-event="sidebar saved posts"
            href={`/user/${username}/saved`}
            label="My Saved Posts"
            leftSection={<FaBookmark />}
            onClick={toggleNavbarOnMobileHandler}
          />
        )}

        <SidebarSection
          enableDelete
          enableFavorite
          label="Viewing History"
          leftSection={<FaHistory />}
          onDelete={(sub) => removeFromHistory(sub.display_name)}
          subreddits={recent}
        />

        {!isAuthenticated && (
          <SidebarSection
            enableDelete
            label="Favorites"
            leftSection={<FaHeart />}
            onDelete={(sub) => removeFromFavorites(sub.display_name)}
            subreddits={favorites}
          />
        )}

        <SidebarSection
          enableFavorite
          label="Trending"
          leftSection={<FaArrowTrendUp />}
          subreddits={trending}
        />

        <NavLink
          component={Link}
          data-umami-event="sidebar all"
          href="/r/all"
          label="All"
          leftSection={<MdDynamicFeed />}
          onClick={toggleNavbarOnMobileHandler}
        />

        <NavLink
          component={Link}
          data-umami-event="sidebar popular"
          href="/r/popular"
          label="Popular"
          leftSection={<FaRegArrowAltCircleUp />}
          onClick={toggleNavbarOnMobileHandler}
        />

        <NavLink
          component={Link}
          data-umami-event="sidebar about"
          href="/about"
          label="About"
          leftSection={<FaInfoCircle />}
          onClick={toggleNavbarOnMobileHandler}
        />
      </Stack>
    </ScrollArea>
  )
}
