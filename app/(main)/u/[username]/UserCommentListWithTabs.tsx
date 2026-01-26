'use client'

import {Comment} from '@/components/ui/Comment/Comment'
import {RedditComment, SortOption, TimeFilter} from '@/lib/types/reddit'
import {Loader, Stack, Tabs, Text, Title} from '@mantine/core'
import {
  IconClock,
  IconFlame,
  IconRocket,
  IconTrendingUp
} from '@tabler/icons-react'
import {useRouter} from 'next/navigation'
import {startTransition, useTransition} from 'react'

/**
 * Props for the UserCommentListWithTabs component.
 */
interface UserCommentListWithTabsProps {
  /** Array of comments to display */
  comments: RedditComment[]
  /** Active sort option */
  activeSort: SortOption
  /** Active time filter */
  activeTimeFilter?: TimeFilter
  /** Whether the current user is authenticated */
  isAuthenticated?: boolean
  /** Username for URL construction */
  username: string
}

/**
 * Display a list of user comments with sort tabs.
 * Allows switching between Hot, New, Top, and Controversial sorts.
 *
 * Features:
 * - Tabs for sort options (Hot, New, Top, Controversial)
 * - Optional time filter for Top/Controversial
 * - Loading state during sort changes
 * - URL query parameter updates (?tab=comments&sort=top)
 * - No scroll on sort change (preserves position)
 * - Empty state for no comments
 *
 * @example
 * ```typescript
 * <UserCommentListWithTabs
 *   comments={redditComments}
 *   activeSort="new"
 *   isAuthenticated={true}
 *   username="spez"
 * />
 * ```
 */
export function UserCommentListWithTabs({
  comments,
  activeSort,
  activeTimeFilter,
  isAuthenticated = false,
  username
}: Readonly<UserCommentListWithTabsProps>) {
  const router = useRouter()
  const [isPending] = useTransition()

  const handleSortChange = (sort: string) => {
    if (isPending) return // Prevent race conditions

    startTransition(() => {
      const params = new URLSearchParams()
      params.set('tab', 'comments')
      params.set('sort', sort)

      // Add time filter for top/controversial
      if ((sort === 'top' || sort === 'controversial') && activeTimeFilter) {
        params.set('time', activeTimeFilter)
      }

      router.push(`/u/${username}?${params.toString()}`, {scroll: false})
    })
  }

  const handleTimeFilterChange = (time: string) => {
    if (isPending) return

    startTransition(() => {
      const params = new URLSearchParams()
      params.set('tab', 'comments')
      params.set('sort', activeSort)
      params.set('time', time)

      router.push(`/u/${username}?${params.toString()}`, {scroll: false})
    })
  }

  const showTimeFilter = activeSort === 'top' || activeSort === 'controversial'

  return (
    <>
      <Tabs value={activeSort} mb="lg">
        <Tabs.List grow={false} style={{flexWrap: 'nowrap', overflowX: 'auto'}}>
          <Tabs.Tab
            value="hot"
            leftSection={<IconFlame aria-hidden="true" size={16} />}
            onClick={() => handleSortChange('hot')}
            disabled={isPending}
            data-umami-event="sort-user-comments-hot"
          >
            Hot
          </Tabs.Tab>
          <Tabs.Tab
            value="new"
            leftSection={<IconClock aria-hidden="true" size={16} />}
            onClick={() => handleSortChange('new')}
            disabled={isPending}
            data-umami-event="sort-user-comments-new"
          >
            New
          </Tabs.Tab>
          <Tabs.Tab
            value="top"
            leftSection={<IconTrendingUp aria-hidden="true" size={16} />}
            onClick={() => handleSortChange('top')}
            disabled={isPending}
            data-umami-event="sort-user-comments-top"
          >
            Top
          </Tabs.Tab>
          <Tabs.Tab
            value="controversial"
            leftSection={<IconRocket aria-hidden="true" size={16} />}
            onClick={() => handleSortChange('controversial')}
            disabled={isPending}
            data-umami-event="sort-user-comments-controversial"
          >
            Controversial
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {showTimeFilter && (
        <Tabs value={activeTimeFilter || 'all'} mb="md">
          <Tabs.List
            grow={false}
            style={{flexWrap: 'nowrap', overflowX: 'auto'}}
          >
            <Tabs.Tab
              value="hour"
              onClick={() => handleTimeFilterChange('hour')}
              disabled={isPending}
              data-umami-event="filter-user-comments-hour"
            >
              Hour
            </Tabs.Tab>
            <Tabs.Tab
              value="day"
              onClick={() => handleTimeFilterChange('day')}
              disabled={isPending}
              data-umami-event="filter-user-comments-day"
            >
              Today
            </Tabs.Tab>
            <Tabs.Tab
              value="week"
              onClick={() => handleTimeFilterChange('week')}
              disabled={isPending}
              data-umami-event="filter-user-comments-week"
            >
              Week
            </Tabs.Tab>
            <Tabs.Tab
              value="month"
              onClick={() => handleTimeFilterChange('month')}
              disabled={isPending}
              data-umami-event="filter-user-comments-month"
            >
              Month
            </Tabs.Tab>
            <Tabs.Tab
              value="year"
              onClick={() => handleTimeFilterChange('year')}
              disabled={isPending}
              data-umami-event="filter-user-comments-year"
            >
              Year
            </Tabs.Tab>
            <Tabs.Tab
              value="all"
              onClick={() => handleTimeFilterChange('all')}
              disabled={isPending}
              data-umami-event="filter-user-comments-all"
            >
              All Time
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      )}

      <Stack gap="md" style={{position: 'relative', minHeight: '200px'}}>
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
              Loading {activeSort} comments...
            </Text>
          </Stack>
        )}

        {comments.length === 0 ? (
          <Title order={4}>No comments yet</Title>
        ) : (
          comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              isAuthenticated={isAuthenticated}
            />
          ))
        )}
      </Stack>
    </>
  )
}
