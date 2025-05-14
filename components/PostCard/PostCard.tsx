import {Media} from '@/components/Media/Media'
import type {PostChildData} from '@/lib/types/posts'
import {getMediumImage} from '@/lib/utils/getMediumImage'
import {Card, Group, Text, Title} from '@mantine/core'
import Link from 'next/link'
import classes from './PostCard.module.css'

interface PostCardProps {
  post: PostChildData
}

export function PostCard({post}: Readonly<PostCardProps>) {
  const preview = post.preview?.images?.[0]?.resolutions
  const image = getMediumImage(preview ?? [])

  return (
    <Card
      className={classes.postCard}
      padding="md"
      radius="md"
      shadow="sm"
      withBorder
    >
      {image?.url && (
        <Card.Section>
          <Media {...post} />
        </Card.Section>
      )}

      <Link href={`https://reddit.com${post.permalink}`} target="_blank">
        <Title order={4} mt="sm">
          {post.title}
        </Title>
      </Link>

      <Group justify="space-between" mt="xs">
        <Text size="sm" c="dimmed">
          {post.subreddit_name_prefixed}
        </Text>
        <Text size="sm">{post.ups?.toLocaleString()} upvotes</Text>
      </Group>
    </Card>
  )
}
