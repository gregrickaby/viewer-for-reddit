'use client'

import {useAppSelector} from '@/lib/store/hooks'
import {Stack, Text} from '@mantine/core'
import {CommentForm} from '../CommentForm/CommentForm'

/**
 * Props for CommentsEmpty component.
 */
interface CommentsEmptyProps {
  /** Post ID for top-level commenting (e.g., t3_abc123) */
  postId?: string
}

/**
 * Renders an empty state message when no comments are available.
 *
 * Displays a user-friendly message encouraging users to be the first
 * to comment on a post. If user is authenticated and postId is provided,
 * also shows the comment form to allow posting the first comment.
 *
 * @param {CommentsEmptyProps} props - Component props
 * @returns JSX.Element empty state message with optional comment form
 */
export function CommentsEmpty({postId}: Readonly<CommentsEmptyProps>) {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  return (
    <Stack gap="md">
      <output
        aria-label="No comments available"
        aria-describedby="empty-description"
      >
        <Text size="sm" c="dimmed" id="empty-description">
          No comments to display.
          {isAuthenticated
            ? ' Be the first to comment!'
            : ' Be the first to comment on Reddit!'}
        </Text>
      </output>
      {isAuthenticated && postId && <CommentForm thingId={postId} />}
    </Stack>
  )
}
