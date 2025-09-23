import {Media} from '@/components/Media/Media'
import {PostComments} from '@/components/PostComments/PostComments'
import type {AutoPostChildData} from '@/lib/store/services/redditApi'
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
import Link from 'next/link'
import {useState} from 'react'
import {BiSolidUpvote} from 'react-icons/bi'
import {FaComment} from 'react-icons/fa'
import {IoChevronDown, IoChevronUp} from 'react-icons/io5'
import classes from './PostCard.module.css'

interface PostCardProps {
  post: AutoPostChildData
}

/**
 * PostCard component.
 *
 * @param post - The Reddit post data (AutoPostChildData)
 * @returns JSX.Element for a styled, interactive Reddit post card
 */
export function PostCard({post}: Readonly<PostCardProps>) {
  const preview = (post as any).preview?.images?.[0]?.resolutions
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
        <Group gap="xs">
          <Anchor href={`/${post.subreddit_name_prefixed}`}>
            <Text size="sm">{post.subreddit_name_prefixed}</Text>
          </Anchor>
          <Text size="xs" c="dimmed">
            <time dateTime={created}>
              {post.created_utc ? formatTimeAgo(post.created_utc) : ''}
            </time>
          </Text>
          <Link href={`/u/${post.author}`}>
            <Text size="xs" c="dimmed">
              {post.author}
            </Text>
          </Link>
        </Group>
        <Anchor href={postLink} rel="noopener noreferrer" target="_blank">
          <Title order={2} size="lg">
            {post.title}
          </Title>
        </Anchor>
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
          aria-expanded={commentsOpen}
          aria-label={`${commentsOpen ? 'Hide' : 'Show'} ${post.num_comments} comments`}
          className={`${classes.meta} ${classes.commentsToggle}`}
          onClick={() => setCommentsOpen(!commentsOpen)}
          variant="subtle"
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
        <PostComments
          open={commentsOpen}
          permalink={postPermalink}
          postLink={postLink}
        />
      </Collapse>
    </Card>
  )
}
