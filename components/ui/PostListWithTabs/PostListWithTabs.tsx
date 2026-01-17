'use client'

import {useInfiniteScroll} from '@/lib/hooks'
import {RedditPost, SortOption, TimeFilter} from '@/lib/types/reddit'
import {
  Center,
  Group,
  Loader,
  SegmentedControl,
  Stack,
  Tabs,
  Text
} from '@mantine/core'
import {
  IconClock,
  IconFlame,
  IconRocket,
  IconTrendingUp
} from '@tabler/icons-react'
import {useRouter} from 'next/navigation'
import {startTransition, useTransition} from 'react'
import {PostCard} from '../PostCard/PostCard'
import styles from '../PostList/PostList.module.css'

/**
 * Props for the PostListWithTabs component.
 */
interface PostListWithTabsProps {
  /** Initial posts from server */
  posts: RedditPost[]
  /** Pagination cursor for next page */
  after?: string | null
  /** Active sort option */
  activeSort: SortOption
  /** Active time filter for top/controversial sorts */
  activeTimeFilter?: TimeFilter
  /** Whether the current user is authenticated */
  isAuthenticated?: boolean
  /** Subreddit name (for infinite scroll) */
  subreddit?: string
}

/**
 * Display a list of Reddit posts with sort tabs and infinite scroll.
 * Allows switching between Hot, New, Top, and Rising sorts.
 * Shows time filter options when Top or Controversial is selected.
 *
 * Features:
 * - Tabs for sort options (Hot, New, Top, Rising)
 * - Time filter (Hour, Day, Week, Month, Year, All) for Top/Controversial
 * - Infinite scroll for loading more posts
 * - Loading state during sort changes
 * - URL query parameter updates (?sort=hot&time=week)
 *
 * @example
 * ```typescript
 * <PostListWithTabs
 *   posts={serverPosts}
 *   after="t3_abc123"
 *   activeSort="top"
 *   activeTimeFilter="week"
 *   isAuthenticated={true}
 *   subreddit="popular"
 * />
 * ```
 */
export function PostListWithTabs({
  posts: initialPosts,
  after: initialAfter,
  activeSort,
  activeTimeFilter = 'day',
  isAuthenticated = false,
  subreddit
}: Readonly<PostListWithTabsProps>) {
  const router = useRouter()
  const [isPending] = useTransition()

  const {posts, hasMore, sentinelRef} = useInfiniteScroll({
    initialPosts,
    initialAfter,
    subreddit,
    sort: activeSort,
    timeFilter: activeTimeFilter
  })

  const handleSortChange = (sort: string) => {
    if (isPending) return // Prevent race conditions

    startTransition(() => {
      // Keep time filter when switching to top/controversial
      if (sort === 'top' || sort === 'controversial') {
        router.push(`?sort=${sort}&time=${activeTimeFilter}`)
      } else {
        router.push(`?sort=${sort}`)
      }
    })
  }

  const handleTimeFilterChange = (time: string) => {
    if (isPending) return // Prevent race conditions

    startTransition(() => {
      router.push(`?sort=${activeSort}&time=${time}`)
    })
  }

  const showTimeFilter = activeSort === 'top' || activeSort === 'controversial'

  const timeFilterOptions = [
    {value: 'hour', label: 'Hour'},
    {value: 'day', label: 'Day'},
    {value: 'week', label: 'Week'},
    {value: 'month', label: 'Month'},
    {value: 'year', label: 'Year'},
    {value: 'all', label: 'All Time'}
  ]

  return (
    <>
      <Stack gap="md" mb="lg">
        <Tabs value={activeSort}>
          <Tabs.List
            grow={false}
            style={{flexWrap: 'nowrap', overflowX: 'auto'}}
          >
            <Tabs.Tab
              value="hot"
              leftSection={<IconFlame size={16} />}
              onClick={() => handleSortChange('hot')}
              disabled={isPending}
              data-umami-event="sort-posts-hot"
            >
              Hot
            </Tabs.Tab>
            <Tabs.Tab
              value="new"
              leftSection={<IconClock size={16} />}
              onClick={() => handleSortChange('new')}
              disabled={isPending}
              data-umami-event="sort-posts-new"
            >
              New
            </Tabs.Tab>
            <Tabs.Tab
              value="top"
              leftSection={<IconTrendingUp size={16} />}
              onClick={() => handleSortChange('top')}
              disabled={isPending}
              data-umami-event="sort-posts-top"
            >
              Top
            </Tabs.Tab>
            <Tabs.Tab
              value="rising"
              leftSection={<IconRocket size={16} />}
              onClick={() => handleSortChange('rising')}
              disabled={isPending}
              data-umami-event="sort-posts-rising"
            >
              Rising
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {showTimeFilter && (
          <Group gap="xs">
            <Text size="sm" fw={500} c="dimmed">
              Time:
            </Text>
            <SegmentedControl
              value={activeTimeFilter}
              onChange={handleTimeFilterChange}
              data={timeFilterOptions}
              size="xs"
              disabled={isPending}
              data-umami-event="filter-posts-time"
            />
          </Group>
        )}
      </Stack>

      <Stack
        gap="md"
        className={styles.container}
        style={{position: 'relative'}}
      >
        {isPending && (
          <Stack
            gap="md"
            align="center"
            justify="center"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'var(--mantine-color-body)',
              opacity: 0.9,
              zIndex: 10,
              pointerEvents: 'none'
            }}
          >
            <Loader size="lg" />
            <Text size="sm" c="dimmed">
              Loading {activeSort} posts...
            </Text>
          </Stack>
        )}

        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isAuthenticated={isAuthenticated}
          />
        ))}

        {hasMore && (
          <div ref={sentinelRef} className={styles.sentinel}>
            <Center>
              <Loader size="md" />
            </Center>
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <Center py="xl">
            <Text c="dimmed" size="sm">
              No more posts
            </Text>
          </Center>
        )}
      </Stack>
    </>
  )
}
