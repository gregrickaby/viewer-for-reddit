'use client'

import {CommentSortOption, RedditComment} from '@/lib/types/reddit'
import {Loader, Stack, Tabs, Text, Title} from '@mantine/core'
import {
  IconClock,
  IconFlame,
  IconMessageQuestion,
  IconStar,
  IconTrendingUp
} from '@tabler/icons-react'
import {useRouter} from 'next/navigation'
import {startTransition, useTransition} from 'react'
import {Comment} from '../Comment/Comment'

/**
 * Props for the CommentListWithTabs component.
 */
interface CommentListWithTabsProps {
  /** Array of comments to display */
  comments: RedditComment[]
  /** Active sort option */
  activeSort: CommentSortOption
  /** Whether the current user is authenticated */
  isAuthenticated?: boolean
}

/**
 * Display a list of Reddit comments with sort tabs.
 * Allows switching between Best, Top, New, Controversial, Old, and Q&A sorts.
 *
 * Features:
 * - Tabs for sort options (Best, Top, New, Controversial, Old, Q&A)
 * - Loading state during sort changes
 * - URL query parameter updates (?sort=best)
 * - No scroll on sort change (preserves position)
 * - Empty state for no comments
 *
 * @example
 * ```typescript
 * <CommentListWithTabs
 *   comments={redditComments}
 *   activeSort="best"
 *   isAuthenticated={true}
 * />
 * ```
 */
export function CommentListWithTabs({
  comments,
  activeSort,
  isAuthenticated = false
}: Readonly<CommentListWithTabsProps>) {
  const router = useRouter()
  const [isPending] = useTransition()

  const handleSortChange = (sort: string) => {
    if (isPending) return // Prevent race conditions

    startTransition(() => {
      router.push(`?sort=${sort}`, {scroll: false})
    })
  }

  return (
    <>
      <Tabs value={activeSort} mb="lg">
        <Tabs.List grow={false} style={{flexWrap: 'nowrap', overflowX: 'auto'}}>
          <Tabs.Tab
            value="best"
            leftSection={<IconStar size={16} />}
            onClick={() => handleSortChange('best')}
            disabled={isPending}
            data-umami-event="sort-comments-best"
          >
            Best
          </Tabs.Tab>
          <Tabs.Tab
            value="top"
            leftSection={<IconTrendingUp size={16} />}
            onClick={() => handleSortChange('top')}
            disabled={isPending}
            data-umami-event="sort-comments-top"
          >
            Top
          </Tabs.Tab>
          <Tabs.Tab
            value="new"
            leftSection={<IconClock size={16} />}
            onClick={() => handleSortChange('new')}
            disabled={isPending}
            data-umami-event="sort-comments-new"
          >
            New
          </Tabs.Tab>
          <Tabs.Tab
            value="controversial"
            leftSection={<IconFlame size={16} />}
            onClick={() => handleSortChange('controversial')}
            disabled={isPending}
            data-umami-event="sort-comments-controversial"
          >
            Controversial
          </Tabs.Tab>
          <Tabs.Tab
            value="old"
            leftSection={<IconClock size={16} />}
            onClick={() => handleSortChange('old')}
            disabled={isPending}
            data-umami-event="sort-comments-old"
          >
            Old
          </Tabs.Tab>
          <Tabs.Tab
            value="qa"
            leftSection={<IconMessageQuestion size={16} />}
            onClick={() => handleSortChange('qa')}
            disabled={isPending}
            data-umami-event="sort-comments-qa"
          >
            Q&A
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

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
