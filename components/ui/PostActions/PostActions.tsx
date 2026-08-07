'use client'

import {ActionPill} from '@/components/ui/ActionPill/ActionPill'
import {VotePill} from '@/components/ui/VotePill/VotePill'
import {useSharePost} from '@/lib/hooks/useSharePost'
import {formatNumber} from '@/lib/utils/formatters'
import {Group} from '@mantine/core'
import {notifications} from '@mantine/notifications'
import {
  IconBookmark,
  IconBookmarkFilled,
  IconMessage,
  IconShare
} from '@tabler/icons-react'

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
  onToggleSave
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
      <VotePill
        voteState={voteState}
        score={score}
        isPending={isPending}
        onVote={onVote}
        upvoteLabel="Upvote"
        downvoteLabel="Downvote"
      />

      <ActionPill
        href={`${postUrl}#comments`}
        icon={<IconMessage aria-hidden="true" size={16} />}
        label={formatNumber(numComments)}
        ariaLabel={`View comments, ${formatNumber(numComments)}`}
      />

      <ActionPill
        onClick={handleSave}
        disabled={isPending}
        ariaLabel={isSaved ? 'Unsave post' : 'Save post'}
        icon={
          isSaved ? (
            <IconBookmarkFilled
              aria-hidden="true"
              size={16}
              color="var(--mantine-color-yellow-6)"
            />
          ) : (
            <IconBookmark aria-hidden="true" size={16} />
          )
        }
      />

      <ActionPill
        onClick={handleShare}
        ariaLabel="Share post"
        icon={<IconShare aria-hidden="true" size={16} />}
        label="Share"
      />
    </Group>
  )
}
