import {Media} from '@/components/Media/Media'
import type {PostChildData} from '@/lib/types/posts'
import {formatTimeAgo} from '@/lib/utils/formatTimeAgo'
import {getMediumImage} from '@/lib/utils/getMediumImage'
import {Card, Group, NumberFormatter, Stack, Text, Title} from '@mantine/core'
import Link from 'next/link'
import {BiUpvote} from 'react-icons/bi'
import {FaRegComment} from 'react-icons/fa'
import classes from './PostCard.module.css'

interface PostCardProps {
  post: PostChildData
}

export function PostCard({post}: Readonly<PostCardProps>) {
  const preview = post.preview?.images?.[0]?.resolutions
  const image = getMediumImage(preview ?? [])
  const postLink = `https://reddit.com${post.permalink}`

  return (
    <Card
      className={classes.postCard}
      padding="md"
      radius="md"
      shadow="sm"
      withBorder
    >
      <Stack justify="space-between" gap="xs">
        <Text size="sm" c="dimmed">
          {post.subreddit_name_prefixed} &middot;{' '}
          <time>{post.created_utc ? formatTimeAgo(post.created_utc) : ''}</time>
        </Text>
        <Link href={postLink} target="_blank">
          <Title order={3}>{post.title}</Title>
        </Link>
      </Stack>

      {image?.url && (
        <Card.Section>
          <Media {...post} />
        </Card.Section>
      )}

      <Group>
        <Group className={classes.meta}>
          <BiUpvote size={16} />
          <Text size="sm" c="dimmed">
            <NumberFormatter value={post.ups} thousandSeparator />
          </Text>
        </Group>

        <Group className={classes.meta}>
          <FaRegComment size={16} />
          <Text size="sm" c="dimmed">
            {post.num_comments} comments
          </Text>
        </Group>
      </Group>
    </Card>
  )
}
