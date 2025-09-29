import {Comments} from '@/components/Comments/Comments'
import {Media} from '@/components/Media/Media'
import type {AutoPostChildData} from '@/lib/store/services/postsApi'
import {formatTimeAgo} from '@/lib/utils/formatTimeAgo'
import {getMediumImage} from '@/lib/utils/getMediumImage'
import {parsePostLink} from '@/lib/utils/parsePostLink'
import {
  Anchor,
  Badge,
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
import Link from 'next/link'
import {useState} from 'react'
import {BiSolidUpvote} from 'react-icons/bi'
import {FaComment} from 'react-icons/fa'
import {IoChevronDown, IoChevronUp} from 'react-icons/io5'
import classes from './PostCard.module.css'

interface PostCardProps {
  post: AutoPostChildData
  useInternalRouting?: boolean
}

/**
 * PostCard component for rendering a single Reddit post with all metadata and media.
 *
 * Features:
 * - Displays subreddit, title, upvotes, comment count, and post age
 * - Renders media (image, video, YouTube, etc.) using the Media component
 * - Shows a comments toggle with animated collapse for in-place comment viewing
 * - Uses Mantine UI for layout, icons, and accessibility
 * - Supports both internal app routing and external Reddit links
 *
 * @param post - The Reddit post data (AutoPostChildData)
 * @param useInternalRouting - Whether to use internal app routes (default: true) or external Reddit links
 * @returns JSX.Element for a styled, interactive Reddit post card
 */
export function PostCard({
  post,
  useInternalRouting = true
}: Readonly<PostCardProps>) {
  const preview = (post as any).preview?.images?.[0]?.resolutions
  const image = getMediumImage(preview ?? [])
  const postLink = parsePostLink(post.permalink, useInternalRouting)
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
      <Stack gap={0}>
        <Link
          className={classes.subredditLink}
          href={`/${post.subreddit_name_prefixed}`}
        >
          <Text className={classes.subreddit} size="sm" fw={700}>
            {post.subreddit_name_prefixed}
          </Text>
        </Link>

        <Group gap={4} c="dimmed">
          <Link className={classes.metaLink} href={`/u/${post.author}`}>
            <Text size="xs">u/{post.author}</Text>
          </Link>
          &middot;
          <Badge variant="light" size="sm" color="gray">
            <Group gap={4} align="center">
              <BiSolidUpvote size={14} color="red" />
              <NumberFormatter value={post.ups} thousandSeparator />
            </Group>
          </Badge>
          &middot;
          <Text size="xs">
            <time dateTime={created}>
              {post.created_utc ? formatTimeAgo(post.created_utc) : ''}
            </time>
          </Text>
        </Group>

        {useInternalRouting ? (
          <Link className={classes.link} href={postLink}>
            <Title className={classes.title} order={2} size="xl" mt="xs">
              {post.title}
            </Title>
          </Link>
        ) : (
          <Anchor
            className={classes.link}
            href={postLink}
            rel="noopener noreferrer"
            target="_blank"
            underline="never"
          >
            <Title className={classes.title} order={2} size="xl" mt="xs">
              {post.title}
            </Title>
          </Anchor>
        )}
      </Stack>

      {image?.url && (
        <Card.Section>
          <Media {...post} />
        </Card.Section>
      )}

      <Group gap="xs" mt="xs">
        <Button
          aria-expanded={commentsOpen}
          aria-label={`${commentsOpen ? 'Hide' : 'Show'} ${post.num_comments} comments`}
          className={`${classes.bottomMeta} ${classes.commentsToggle}`}
          onClick={() => setCommentsOpen(!commentsOpen)}
          variant="subtle"
        >
          <Group gap={4}>
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
          open={commentsOpen}
          permalink={postPermalink}
          postLink={postLink}
          enableNestedComments
        />
      </Collapse>
    </Card>
  )
}
