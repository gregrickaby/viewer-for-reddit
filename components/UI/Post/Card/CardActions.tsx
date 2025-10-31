import {VoteButtons} from '@/components/UI/Post/VoteButtons/VoteButtons'
import type {AutoPostChildData} from '@/lib/store/services/postsApi'
import {Button, Group, NumberFormatter, Text, Tooltip} from '@mantine/core'
import {FaComment} from 'react-icons/fa'
import {IoChevronDown, IoChevronUp} from 'react-icons/io5'

interface CardActionsProps {
  post: AutoPostChildData
  commentsOpen: boolean
  onCommentsToggle: () => void
  hideCommentToggle?: boolean
}

/**
 * CardActions component displays action buttons for a post.
 *
 * Features:
 * - Voting buttons with score
 * - Comments toggle button with count
 * - Share button
 * - Horizontal layout matching Reddit's design
 */
export function CardActions({
  post,
  commentsOpen,
  onCommentsToggle,
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
            aria-label={`${commentsOpen ? 'Hide' : 'Show'} ${post.num_comments} comments`}
            color="gray"
            data-umami-event="comment button"
            leftSection={<FaComment size={14} />}
            onClick={onCommentsToggle}
            radius="sm"
            variant="subtle"
            rightSection={
              commentsOpen ? (
                <IoChevronUp size={12} />
              ) : (
                <IoChevronDown size={12} />
              )
            }
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
