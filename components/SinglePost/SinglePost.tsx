'use client'

import {Comments} from '@/components/Comments/Comments'
import {PostCard} from '@/components/PostCard/PostCard'
import {useGetSinglePostQuery} from '@/lib/store/services/redditApi'
import {
  Alert,
  Card,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title
} from '@mantine/core'
import Link from 'next/link'
import {IoAlert, IoArrowBack} from 'react-icons/io5'
import classes from './SinglePost.module.css'

export interface SinglePostProps {
  readonly subreddit: string
  readonly postId: string
}

/**
 * SinglePost component displays a complete view of a Reddit post with comments.
 *
 * Features:
 * - Fetches post and comments data in a single request
 * - Displays loading states and error handling
 * - Shows post content using existing PostCard component
 * - Renders comments list with proper formatting
 * - Includes navigation back to subreddit
 * - Handles edge cases like missing posts or private subreddits
 *
 * @param subreddit - The subreddit name (e.g., "programming")
 * @param postId - The Reddit post ID (e.g., "abc123")
 * @returns JSX.Element for the complete single post view
 */
export function SinglePost({subreddit, postId}: Readonly<SinglePostProps>) {
  const {data, isLoading, isError, error} = useGetSinglePostQuery({
    subreddit,
    postId
  })

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
          <Group>
            <Link href={`/r/${subreddit}`}>
              <Group gap="xs" c="blue">
                <IoArrowBack />
                <Text size="sm">Back to r/{subreddit}</Text>
              </Group>
            </Link>
          </Group>

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

  const {post, comments} = data

  return (
    <Container size="md">
      <Stack gap="md" py="md">
        {/* Navigation back to subreddit */}
        <Group>
          <Link href={`/r/${subreddit}`} className={classes.backLink}>
            <Group gap="xs" c="blue">
              <IoArrowBack />
              <Text size="sm">Back to r/{subreddit}</Text>
            </Group>
          </Link>
        </Group>

        {/* Post content */}
        <PostCard post={post} useInternalRouting={false} />

        {/* Comments section */}
        <Card padding="md" radius="md" shadow="sm" withBorder>
          <Stack gap="md">
            <Title order={3} size="lg">
              Comments ({comments.length})
            </Title>

            {comments.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                No comments yet. Be the first to comment on{' '}
                <Link
                  href={`https://reddit.com${post.permalink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Reddit
                </Link>
                !
              </Text>
            ) : (
              <Comments
                permalink={post.permalink || ''}
                postLink={`https://reddit.com${post.permalink || ''}`}
                open
                comments={comments}
              />
            )}
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
