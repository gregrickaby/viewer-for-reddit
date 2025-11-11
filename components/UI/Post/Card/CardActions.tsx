import {VoteButtons} from '@/components/UI/Post/VoteButtons/VoteButtons'
import {useSave} from '@/lib/hooks/util/useSave'
import type {AutoPostChildData} from '@/lib/store/services/postsApi'
import {Button, Group, NumberFormatter, Text, Tooltip} from '@mantine/core'
import Link from 'next/link'
import {FaComment} from 'react-icons/fa'
import {IoBookmark, IoBookmarkOutline} from 'react-icons/io5'

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
 * - Save button with optimistic updates
 * - Horizontal layout matching Reddit's design
 */
export function CardActions({
  post,
  postLink,
  hideCommentToggle = false
}: Readonly<CardActionsProps>) {
  const {handleSave, isSaved, isSaving} = useSave({
    id: post.name ?? '',
    initialSaved: post.saved ?? false
  })

  return (
    <Group gap="xs" mb="md" mt="md">
      <VoteButtons
        id={post.name ?? ''}
        score={post.ups ?? 0}
        size="md"
        userVote={post.likes}
      />

      {!hideCommentToggle && (
        <Tooltip label="View Comments" withinPortal>
          <Button
            aria-label={`View ${post.num_comments} comments`}
            color="gray"
            component={Link}
            data-umami-event="view comment button"
            href={`${postLink}#comments`}
            leftSection={<FaComment size={14} />}
            radius="sm"
            variant="subtle"
          >
            <Text fw={700} size="sm">
              <NumberFormatter thousandSeparator value={post.num_comments} />
            </Text>
          </Button>
        </Tooltip>
      )}

      <Tooltip label={isSaved ? 'Unsave post' : 'Save post'} withinPortal>
        <Button
          aria-label={isSaved ? 'Unsave post' : 'Save post'}
          color="gray"
          data-umami-event="save post button"
          leftSection={
            isSaved ? <IoBookmark size={14} /> : <IoBookmarkOutline size={14} />
          }
          loading={isSaving}
          onClick={handleSave}
          radius="sm"
          variant="subtle"
        >
          <Text fw={isSaved ? 700 : 400} size="sm">
            {isSaved ? 'Saved' : 'Save'}
          </Text>
        </Button>
      </Tooltip>
    </Group>
  )
}
