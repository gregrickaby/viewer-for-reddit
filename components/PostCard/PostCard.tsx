'use client'

import type {PostChildData} from '@/lib/types/posts'
import {getMediumImage} from '@/lib/utils/getMediumImage'
import {Card, Group, Text, Title} from '@mantine/core'
import Image from 'next/image'
import Link from 'next/link'

interface PostCardProps {
  post: PostChildData
}

export function PostCard({post}: Readonly<PostCardProps>) {
  const preview = post.preview?.images?.[0]?.resolutions
  const image = getMediumImage(preview ?? [])

  return (
    <Card withBorder shadow="sm" padding="md" radius="md">
      {image?.url && (
        <Card.Section>
          <Image
            alt={post.title ?? 'Image'}
            src={image.url.replace(/&amp;/g, '&')}
            width={image.width ?? 400}
            height={image.height ?? 200}
            style={{objectFit: 'cover'}}
            unoptimized
          />
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
