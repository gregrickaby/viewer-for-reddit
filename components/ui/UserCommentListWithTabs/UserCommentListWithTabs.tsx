'use client'

import {SortTabs, TIME_FILTER_TABS} from '@/components/ui/SortTabs/SortTabs'
import {TransitionOverlay} from '@/components/ui/TransitionOverlay/TransitionOverlay'
import {Comment} from '@/components/ui/Comment/Comment'
import {RedditComment, SortOption, TimeFilter} from '@/lib/types/reddit'
import {getUserProfileHref} from '@/lib/utils/reddit-helpers'
import {Box, Group, Stack, Text, Title} from '@mantine/core'
import {
  IconClock,
  IconFlame,
  IconRocket,
  IconTrendingUp
} from '@tabler/icons-react'
import {useRouter} from 'next/navigation'
import {useTransition} from 'react'

const USER_COMMENT_SORT_TABS = [
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
    value: 'controversial',
    label: 'Controversial',
    icon: <IconRocket aria-hidden="true" size={16} />
  }
]

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
  /** Username for URL construction */
  username: string
}

/**
 * Display a list of user comments with sort tabs.
 * Allows switching between Hot, New, Top, and Controversial sorts with an optional time filter.
 */
export function UserCommentListWithTabs({
  comments,
  activeSort,
  activeTimeFilter,
  username
}: Readonly<UserCommentListWithTabsProps>) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleSortChange = (sort: string) => {
    if (isPending) return // Prevent race conditions

    const href = getUserProfileHref(username)
    if (!href) return

    startTransition(() => {
      const params = new URLSearchParams()
      params.set('tab', 'comments')
      params.set('sort', sort)

      // Add time filter for top/controversial
      if ((sort === 'top' || sort === 'controversial') && activeTimeFilter) {
        params.set('time', activeTimeFilter)
      }

      router.push(`${href}?${params.toString()}`, {scroll: false})
    })
  }

  const handleTimeFilterChange = (time: string) => {
    if (isPending) return

    const href = getUserProfileHref(username)
    if (!href) return

    startTransition(() => {
      const params = new URLSearchParams()
      params.set('tab', 'comments')
      params.set('sort', activeSort)
      params.set('time', time)

      router.push(`${href}?${params.toString()}`, {scroll: false})
    })
  }

  const showTimeFilter = activeSort === 'top' || activeSort === 'controversial'

  return (
    <>
      <Box mb="lg">
        <SortTabs
          value={activeSort}
          onChange={handleSortChange}
          disabled={isPending}
          tabs={USER_COMMENT_SORT_TABS}
        />
      </Box>

      {showTimeFilter && (
        <Box mb="md">
          <Group gap="xs">
            <Text size="sm" fw={500} c="dimmed">
              Time:
            </Text>
            <SortTabs
              value={activeTimeFilter || 'all'}
              onChange={handleTimeFilterChange}
              disabled={isPending}
              tabs={TIME_FILTER_TABS}
            />
          </Group>
        </Box>
      )}

      <Stack gap="md" style={{position: 'relative', minHeight: '200px'}}>
        <TransitionOverlay
          visible={isPending}
          label={`Loading ${activeSort} comments...`}
        />

        {comments.length === 0 ? (
          <Title order={4}>No comments yet</Title>
        ) : (
          comments.map((comment) => (
            <Comment key={comment.id} comment={comment} />
          ))
        )}
      </Stack>
    </>
  )
}
