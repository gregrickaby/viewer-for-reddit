'use client'

import {Breadcrumb} from '@/components/UI/Breadcrumb/Breadcrumb'
import {Card as PostCard} from '@/components/UI/Post/Card/Card'
import {Comments} from '@/components/UI/Post/Comments/Comments'
import {useUpdateMeta} from '@/lib/hooks/util/useUpdateMeta'
import {useGetSinglePostQuery} from '@/lib/store/services/postsApi'
import {parsePostLink} from '@/lib/utils/formatting/parsePostLink'
import {Alert, Card, Container, Loader, Stack, Text, Title} from '@mantine/core'
import Link from 'next/link'
import {IoAlert} from 'react-icons/io5'

export interface SingleProps {
  readonly subreddit: string
  readonly postId: string
  readonly useInternalRouting?: boolean
}

/**
 * Single component displays a complete view of a Reddit post with comments.
 *
 * Features:
 * - Fetches post and comments data in a single request
 * - Displays loading states and error handling
 * - Shows post content using existing Card component
 * - Renders comments list with proper formatting
 * - Includes navigation back to subreddit
 * - Handles edge cases like missing posts or private subreddits
 *
 * @param subreddit - The subreddit name (e.g., "programming")
 * @param postId - The Reddit post ID (e.g., "abc123")
 * @param useInternalRouting - Whether to use internal app routes (default: true) or external Reddit links
 * @returns JSX.Element for the complete single post view
 */
export function Single({
  subreddit,
  postId,
  useInternalRouting = true
}: Readonly<SingleProps>) {
  const {data, isLoading, isError, error} = useGetSinglePostQuery({
    subreddit,
    postId
  })

  // Update meta tags when post data loads for proper social sharing
  useUpdateMeta(
    data?.title ? `${data.title} - r/${subreddit}` : undefined,
    data?.selftext || data?.title || undefined,
    data?.thumbnail && data.thumbnail !== 'self' && data.thumbnail !== 'default'
      ? data.thumbnail
      : undefined
  )

  // Loading state
  if (isLoading) {
    return (
      <Container size="md">
        <Stack align="center" gap="md" py="xl">
          <Loader size="lg" />
          <Text c="dimmed">Loading post...</Text>
        </Stack>
      </Container>
    )
  }

  // Error state
  if (isError) {
    let errorMessage = 'Failed to load post'

    if (error && typeof error === 'object' && 'status' in error) {
      switch (error.status) {
        case 404:
          errorMessage = 'Post not found'
          break
        case 403:
          errorMessage = 'This subreddit is private or restricted'
          break
      }
    }

    return (
      <Container size="md">
        <Stack gap="md" py="md">
          <Alert
            icon={<IoAlert size={16} />}
            title="Error"
            color="red"
            variant="light"
          >
            {errorMessage}. Please try again or{' '}
            <Link href={`/r/${subreddit}`}>return to r/{subreddit}</Link>.
          </Alert>
        </Stack>
      </Container>
    )
  }

  // Success state with data
  if (!data) {
    return (
      <Container size="md">
        <Alert
          icon={<IoAlert size={16} />}
          title="No Data"
          color="orange"
          variant="light"
        >
          No post data available.
        </Alert>
      </Container>
    )
  }

  const post = data

  return (
    <>
      <Breadcrumb
        items={[
          {label: `r/${subreddit}`, href: `/r/${subreddit}`},
          {
            label: post.title || 'Post',
            href: `/r/${subreddit}/comments/${postId}/`
          }
        ]}
      />
      <Stack gap="md" py="md">
        <PostCard
          post={post}
          useInternalRouting={useInternalRouting}
          hideCommentToggle
        />
        <Card padding="md" radius="md" shadow="sm" withBorder>
          <Stack gap="md">
            <Title order={3} size="lg">
              Comments
            </Title>
            <Comments
              permalink={post.permalink || ''}
              postLink={parsePostLink(post.permalink, useInternalRouting)}
              postId={`t3_${postId}`}
              open
              enableInfiniteLoading
              showSortControls
            />
          </Stack>
        </Card>
      </Stack>
    </>
  )
}
