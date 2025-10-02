import {VoteButtons} from '@/components/VoteButtons/VoteButtons'
import type {AutoPostChildData} from '@/lib/store/services/postsApi'
import {ActionIcon, Group, Text} from '@mantine/core'
import {FaComment, FaShare} from 'react-icons/fa'
import {IoChevronDown, IoChevronUp} from 'react-icons/io5'

interface PostActionsProps {
  post: AutoPostChildData
  commentsOpen: boolean
  onCommentsToggle: () => void
}

/**
 * PostActions component displays action buttons for a post.
 *
 * Features:
 * - Voting buttons with score
 * - Comments toggle button with count
 * - Share button
 * - Horizontal layout matching Reddit's design
 */
export function PostActions({
  post,
  commentsOpen,
  onCommentsToggle
}: Readonly<PostActionsProps>) {
  return (
    <Group gap="xs" mt="xs">
      <VoteButtons
        id={post.name ?? ''}
        score={post.ups ?? 0}
        userVote={post.likes}
        size="sm"
      />

      <ActionIcon.Group>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          onClick={onCommentsToggle}
          aria-label={`${commentsOpen ? 'Hide' : 'Show'} ${post.num_comments} comments`}
        >
          <Group gap={6} wrap="nowrap">
            <FaComment size={16} />
            <Text size="sm" fw={700} c="dimmed">
              {post.num_comments}
            </Text>
            {commentsOpen ? (
              <IoChevronUp size={12} />
            ) : (
              <IoChevronDown size={12} />
            )}
          </Group>
        </ActionIcon>
      </ActionIcon.Group>

      <ActionIcon
        variant="subtle"
        color="gray"
        size="lg"
        aria-label="Share post"
      >
        <FaShare size={14} />
      </ActionIcon>
    </Group>
  )
}
