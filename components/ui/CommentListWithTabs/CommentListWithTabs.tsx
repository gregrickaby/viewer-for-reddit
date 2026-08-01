'use client'

import {SortTabs} from '@/components/ui/SortTabs/SortTabs'
import {TransitionOverlay} from '@/components/ui/TransitionOverlay/TransitionOverlay'
import {CommentSortOption, RedditComment} from '@/lib/types/reddit'
import {Box, Stack, Title} from '@mantine/core'
import {
  IconClock,
  IconFlame,
  IconMessageQuestion,
  IconStar,
  IconTrendingUp
} from '@tabler/icons-react'
import {useRouter} from 'next/navigation'
import {useTransition} from 'react'
import {Comment} from '@/components/ui/Comment/Comment'

const COMMENT_SORT_TABS = [
  {
    value: 'best',
    label: 'Best',
    icon: <IconStar aria-hidden="true" size={16} />
  },
  {
    value: 'top',
    label: 'Top',
    icon: <IconTrendingUp aria-hidden="true" size={16} />
  },
  {
    value: 'new',
    label: 'New',
    icon: <IconClock aria-hidden="true" size={16} />
  },
  {
    value: 'controversial',
    label: 'Controversial',
    icon: <IconFlame aria-hidden="true" size={16} />
  },
  {
    value: 'old',
    label: 'Old',
    icon: <IconClock aria-hidden="true" size={16} />
  },
  {
    value: 'qa',
    label: 'Q&A',
    icon: <IconMessageQuestion aria-hidden="true" size={16} />
  }
]

/**
 * Props for the CommentListWithTabs component.
 */
interface CommentListWithTabsProps {
  /** Array of comments to display */
  comments: RedditComment[]
  /** Active sort option */
  activeSort: CommentSortOption
}

/**
 * Display a list of Reddit comments with sort tabs.
 * Allows switching between Best, Top, New, Controversial, Old, and Q&A sorts.
 */
export function CommentListWithTabs({
  comments,
  activeSort
}: Readonly<CommentListWithTabsProps>) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleSortChange = (sort: string) => {
    if (isPending) return // Prevent race conditions

    startTransition(() => {
      router.push(`?sort=${sort}`, {scroll: false})
    })
  }

  return (
    <>
      <Box mb="lg">
        <SortTabs
          value={activeSort}
          onChange={handleSortChange}
          disabled={isPending}
          tabs={COMMENT_SORT_TABS}
        />
      </Box>

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
