'use client'

import {useSharePost} from '@/lib/hooks/useSharePost'
import {formatNumber} from '@/lib/utils/formatters'
import {getVoteColor} from '@/lib/utils/reddit-helpers'
import {ActionIcon, Anchor, Group, Text} from '@mantine/core'
import {notifications} from '@mantine/notifications'
import {
  IconArrowDown,
  IconArrowUp,
  IconBookmark,
  IconBookmarkFilled,
  IconMessage,
  IconShare
} from '@tabler/icons-react'
import Link from 'next/link'

/**
 * Props for the PostActions component.
 */
interface PostActionsProps {
  /** URL to the post's comments page */
  postUrl: string
  /** Number of comments on the post */
  numComments: number
  /** Current vote state: 1 (upvoted), 0 (no vote), -1 (downvoted) */
  voteState: 1 | 0 | -1 | null
  /** Current score/karma count */
  score: number
  /** Whether the post is saved */
  isSaved: boolean
  /** Whether an action is in progress */
  isPending: boolean
  /** Vote handler function */
  onVote: (direction: 1 | -1) => void
  /** Toggle save handler function */
  onToggleSave: () => void
  /** Whether the current user is authenticated */
  isAuthenticated?: boolean
}

/**
 * Action buttons for a Reddit post: vote, comment, save, and share.
 * Displays vote score, comment count, and save status.
 */
export function PostActions({
  postUrl,
  numComments,
  voteState,
  score,
  isSaved,
  isPending,
  onVote,
  onToggleSave,
  isAuthenticated = false
}: Readonly<PostActionsProps>) {
  const {sharePost} = useSharePost()

  const handleShare = () => sharePost(postUrl)

  const handleSave = () => {
    onToggleSave()
    notifications.show({
      message: isSaved ? 'Post unsaved' : 'Post saved',
      color: isSaved ? 'gray' : 'yellow',
      autoClose: 3000
    })
  }

  return (
    <Group gap="sm">
      <Group gap={2}>
        <ActionIcon
          variant="subtle"
          color={voteState === 1 ? 'orange' : 'gray'}
          aria-label="Upvote"
          onClick={() => isAuthenticated && onVote(1)}
          loading={isPending}
          disabled={!isAuthenticated}
          style={{cursor: isAuthenticated ? 'pointer' : 'not-allowed'}}
          data-umami-event="upvote"
        >
          <IconArrowUp aria-hidden="true" size={18} />
        </ActionIcon>
        <Text size="sm" fw={600} c={getVoteColor(voteState)}>
          {formatNumber(score)}
        </Text>
        <ActionIcon
          variant="subtle"
          color={voteState === -1 ? 'blue' : 'gray'}
          aria-label="Downvote"
          onClick={() => isAuthenticated && onVote(-1)}
          loading={isPending}
          disabled={!isAuthenticated}
          style={{cursor: isAuthenticated ? 'pointer' : 'not-allowed'}}
          data-umami-event="downvote"
        >
          <IconArrowDown aria-hidden="true" size={18} />
        </ActionIcon>
      </Group>

      <Anchor
        component={Link}
        href={`${postUrl}#comments`}
        underline="never"
        c="inherit"
        data-umami-event="view-comments"
      >
        <Group gap={2}>
          <ActionIcon variant="subtle" color="gray" aria-label="View comments">
            <IconMessage aria-hidden="true" size={18} />
          </ActionIcon>
          <Text size="sm">{formatNumber(numComments)}</Text>
        </Group>
      </Anchor>

      <ActionIcon
        variant={isSaved ? 'light' : 'subtle'}
        color={isSaved ? 'yellow' : 'gray'}
        aria-label={isSaved ? 'Unsave post' : 'Save post'}
        onClick={handleSave}
        disabled={!isAuthenticated || isPending}
        style={{cursor: isAuthenticated ? 'pointer' : 'not-allowed'}}
        data-umami-event={isSaved ? 'unsave-post' : 'save-post'}
      >
        {isSaved ? (
          <IconBookmarkFilled aria-hidden="true" size={18} />
        ) : (
          <IconBookmark aria-hidden="true" size={18} />
        )}
      </ActionIcon>

      <ActionIcon
        variant="subtle"
        color="gray"
        aria-label="Share post"
        onClick={handleShare}
        data-umami-event="share-post"
      >
        <IconShare aria-hidden="true" size={18} />
      </ActionIcon>
    </Group>
  )
}
