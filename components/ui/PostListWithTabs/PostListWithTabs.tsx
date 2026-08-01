'use client'

import {SortTabs, TIME_FILTER_TABS} from '@/components/ui/SortTabs/SortTabs'
import {TransitionOverlay} from '@/components/ui/TransitionOverlay/TransitionOverlay'
import {useInfiniteScroll} from '@/lib/hooks/useInfiniteScroll'
import {RedditPost, SortOption, TimeFilter} from '@/lib/types/reddit'
import {Center, Group, Loader, Stack, Text} from '@mantine/core'
import {
  IconClock,
  IconFlame,
  IconRocket,
  IconTrendingUp
} from '@tabler/icons-react'
import {useRouter} from 'next/navigation'
import {useTransition} from 'react'
import {PostCard} from '@/components/ui/PostCard/PostCard'
import styles from '@/components/ui/PostList/PostList.module.css'

const POST_SORT_TABS = [
  {
    value: 'hot',
    label: 'Hot',
    icon: <IconFlame aria-hidden="true" size={16} />
  },
  {
    value: 'new',
    label: 'New',
    icon: <IconClock aria-hidden="true" size={16} />
  },
  {
    value: 'top',
    label: 'Top',
    icon: <IconTrendingUp aria-hidden="true" size={16} />
  },
  {
    value: 'rising',
    label: 'Rising',
    icon: <IconRocket aria-hidden="true" size={16} />
  }
]

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
  /** Subreddit name (for infinite scroll) */
  subreddit?: string
  /** Username (for user profile infinite scroll) */
  username?: string
}

/**
 * Display a list of Reddit posts with sort tabs and infinite scroll.
 * Allows switching between Hot, New, Top, and Rising sorts, with a time filter for Top and Controversial.
 */
export function PostListWithTabs({
  posts: initialPosts,
  after: initialAfter,
  activeSort,
  activeTimeFilter = 'week',
  subreddit,
  username
}: Readonly<PostListWithTabsProps>) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const {posts, hasMore, sentinelRef} = useInfiniteScroll({
    initialPosts,
    initialAfter,
    subreddit,
    username,
    sort: activeSort,
    timeFilter: activeTimeFilter
  })

  const handleSortChange = (sort: string) => {
    if (isPending) return // Prevent race conditions

    startTransition(() => {
      // Keep time filter when switching to top/controversial, default to week
      if (sort === 'top' || sort === 'controversial') {
        const timeFilter = activeTimeFilter || 'week'
        router.push(`?sort=${sort}&time=${timeFilter}`)
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

  return (
    <Stack gap="md">
      <SortTabs
        value={activeSort}
        onChange={handleSortChange}
        disabled={isPending}
        tabs={POST_SORT_TABS}
      />

      {showTimeFilter && (
        <Group gap="xs">
          <Text size="sm" fw={500} c="dimmed">
            Time:
          </Text>
          <SortTabs
            value={activeTimeFilter}
            onChange={handleTimeFilterChange}
            disabled={isPending}
            tabs={TIME_FILTER_TABS}
          />
        </Group>
      )}

      <Stack
        gap="md"
        className={styles.container}
        style={{position: 'relative'}}
      >
        <TransitionOverlay
          visible={isPending}
          label={`Loading ${activeSort} posts...`}
        />

        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
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
    </Stack>
  )
}
