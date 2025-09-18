import {Comments} from '@/components/Comments/Comments'
import {Media} from '@/components/Media/Media'
import type {PostChildData} from '@/lib/types/posts'
import {formatTimeAgo} from '@/lib/utils/formatTimeAgo'
import {getMediumImage} from '@/lib/utils/getMediumImage'
import {
  ActionIcon,
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
import {BiUpvote} from 'react-icons/bi'
import {FaRegComment} from 'react-icons/fa'
import {IoChevronDown, IoChevronUp} from 'react-icons/io5'
import classes from './PostCard.module.css'

interface PostCardProps {
  post: PostChildData
}

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
        <a href={`/${post.subreddit_name_prefixed}`}>
          <Text size="sm" c="dimmed">
            {post.subreddit_name_prefixed} &middot;{' '}
            <time dateTime={created}>
              {post.created_utc ? formatTimeAgo(post.created_utc) : ''}
            </time>
          </Text>
        </a>
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
          <BiUpvote size={16} />
          <a href={postLink} rel="noopener noreferrer" target="_blank">
            <Text size="sm" c="dimmed">
              <NumberFormatter value={post.ups} thousandSeparator />
            </Text>
          </a>
        </Group>

        <Group
          className={`${classes.meta} ${classes.commentsToggle}`}
          style={{cursor: 'pointer'}}
          onClick={() => setCommentsOpen(!commentsOpen)}
        >
          <FaRegComment size={16} />
          <Text size="sm" c="dimmed">
            <NumberFormatter value={post.num_comments} thousandSeparator />{' '}
            comments
          </Text>
          <ActionIcon variant="subtle" size="sm">
            {commentsOpen ? <IoChevronUp /> : <IoChevronDown />}
          </ActionIcon>
        </Group>
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
