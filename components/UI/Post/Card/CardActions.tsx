import {VoteButtons} from '@/components/UI/Post/VoteButtons/VoteButtons'
import type {AutoPostChildData} from '@/lib/store/services/postsApi'
import {Button, Group, NumberFormatter, Text, Tooltip} from '@mantine/core'
import Link from 'next/link'
import {FaComment} from 'react-icons/fa'

interface CardActionsProps {
  post: AutoPostChildData
  postLink: string
  hideCommentToggle?: boolean
}

/**
 * CardActions component displays action buttons for a post.
 *
 * Features:
 * - Voting buttons with score
 * - Comments link button with count (navigates to post page)
 * - Share button
 * - Horizontal layout matching Reddit's design
 */
export function CardActions({
  post,
  postLink,
  hideCommentToggle = false
}: Readonly<CardActionsProps>) {
  return (
    <Group gap="xs" mt="md" mb="md">
      <VoteButtons
        id={post.name ?? ''}
        score={post.ups ?? 0}
        userVote={post.likes}
        size="md"
      />

      {!hideCommentToggle && (
        <Tooltip label="View Comments" withinPortal>
          <Button
            component={Link}
            href={`${postLink}#comments`}
            aria-label={`View ${post.num_comments} comments`}
            color="gray"
            data-umami-event="comment button"
            leftSection={<FaComment size={14} />}
            radius="sm"
            variant="subtle"
          >
            <Text size="sm" fw={700}>
              <NumberFormatter value={post.num_comments} thousandSeparator />
            </Text>
          </Button>
        </Tooltip>
      )}
    </Group>
  )
}
