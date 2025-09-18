import {Comments} from '@/components/Comments/Comments'
import {Media} from '@/components/Media/Media'
import type {PostChildData} from '@/lib/types/posts'
import {formatTimeAgo} from '@/lib/utils/formatTimeAgo'
import {getMediumImage} from '@/lib/utils/getMediumImage'
import {
  Anchor,
  Button,
  Card,
  Collapse,
  Group,
  NumberFormatter,
  Stack,
  Text,
  Title
} from '@mantine/core'
import dayjs from 'dayjs'
import {useState} from 'react'
import {BiSolidUpvote} from 'react-icons/bi'
import {FaComment} from 'react-icons/fa'
import {IoChevronDown, IoChevronUp} from 'react-icons/io5'
import classes from './PostCard.module.css'

interface PostCardProps {
  post: PostChildData
}

/**
 * PostCard component for rendering a single Reddit post with all metadata and media.
 *
 * Features:
 * - Displays subreddit, title, upvotes, comment count, and post age
 * - Renders media (image, video, YouTube, etc.) using the Media component
 * - Shows a comments toggle with animated collapse for in-place comment viewing
 * - Uses Mantine UI for layout, icons, and accessibility
 * - All links are accessible and open in new tabs where appropriate
 *
 * @param post - The Reddit post data (PostChildData)
 * @returns JSX.Element for a styled, interactive Reddit post card
 */
export function PostCard({post}: Readonly<PostCardProps>) {
  const preview = post.preview?.images?.[0]?.resolutions
  const image = getMediumImage(preview ?? [])
  const postLink = `https://reddit.com${post.permalink}`
  const created = post.created_utc
    ? dayjs.unix(post.created_utc).toISOString()
    : ''

  const postPermalink = post.permalink ?? post.id ?? ''
  const [commentsOpen, setCommentsOpen] = useState(false)

  return (
    <Card
      component="article"
      className={classes.postCard}
      padding="md"
      radius="md"
      shadow="sm"
      withBorder
    >
      <Stack justify="space-between" gap="xs">
        <Anchor href={`/${post.subreddit_name_prefixed}`}>
          <Text size="sm" c="dimmed">
            {post.subreddit_name_prefixed} &middot;{' '}
            <time dateTime={created}>
              {post.created_utc ? formatTimeAgo(post.created_utc) : ''}
            </time>
          </Text>
        </Anchor>
        <a
          className={classes.titleLink}
          href={postLink}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Title order={2} size="lg">
            {post.title}
          </Title>
        </a>
      </Stack>

      {image?.url && (
        <Card.Section>
          <Media {...post} />
        </Card.Section>
      )}

      <Group mt="xs">
        <Group className={classes.meta}>
          <BiSolidUpvote size={16} color="red" />
          <Anchor href={postLink} rel="noopener noreferrer" target="_blank">
            <Text size="sm" c="dimmed">
              <NumberFormatter value={post.ups} thousandSeparator />
            </Text>
          </Anchor>
        </Group>

        <Button
          variant="subtle"
          className={`${classes.meta} ${classes.commentsToggle}`}
          onClick={() => setCommentsOpen(!commentsOpen)}
          aria-label={`${commentsOpen ? 'Hide' : 'Show'} ${post.num_comments} comments`}
          aria-expanded={commentsOpen}
        >
          <Group gap="xs">
            <FaComment size={16} color="red" />
            <Text size="sm" c="dimmed">
              <NumberFormatter value={post.num_comments} thousandSeparator />{' '}
              comments
            </Text>
            {commentsOpen ? <IoChevronUp /> : <IoChevronDown />}
          </Group>
        </Button>
      </Group>

      <Collapse in={commentsOpen}>
        <Comments
          permalink={postPermalink}
          postLink={postLink}
          open={commentsOpen}
        />
      </Collapse>
    </Card>
  )
}
