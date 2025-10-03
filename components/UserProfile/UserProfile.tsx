'use client'

import {PostCard} from '@/components/PostCard/PostCard'
import {useGetUserCommentsInfiniteQuery} from '@/lib/store/services/commentsApi'
import {
  useGetUserPostsInfiniteQuery,
  useGetUserProfileQuery
} from '@/lib/store/services/userApi'
import {formatTimeAgo} from '@/lib/utils/formatTimeAgo'
import {decodeAndSanitizeHtml} from '@/lib/utils/sanitizeText'
import {
  Anchor,
  Avatar,
  Badge,
  Button,
  Card,
  Center,
  Divider,
  Grid,
  Group,
  Loader,
  NumberFormatter,
  Stack,
  Tabs,
  Text,
  Title
} from '@mantine/core'
import Link from 'next/link'
import {BiSolidUpvote} from 'react-icons/bi'
import {MdError, MdVerified} from 'react-icons/md'
import classes from './UserProfile.module.css'

interface UserProfileProps {
  username: string
}

/**
 * Get a user-friendly error message based on the error status.
 */
function getErrorMessage(error: unknown, username: string): string {
  const errorObj = error as {status?: number}
  const status = errorObj?.status

  switch (status) {
    case 404:
      return `User u/${username} not found. This account may have been deleted, suspended, or does not exist.`
    case 403:
      return `Access denied. User u/${username} may have privacy settings enabled or the account is restricted.`
    case 429:
      return 'Too many requests. Please wait a moment and try again.'
    case 500:
    case 502:
    case 503:
      return 'Reddit servers are experiencing issues. Please try again later.'
    default:
      return 'Unable to load profile from Reddit API. Please try again later.'
  }
}

/**
 * Client component that fetches and displays user profile data.
 */
export function UserProfile({username}: Readonly<UserProfileProps>) {
  // Fetch user profile data
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError
  } = useGetUserProfileQuery(username)

  // Fetch user posts
  const {
    data: postsData,
    isLoading: postsLoading,
    error: postsError,
    hasNextPage: hasMorePosts
  } = useGetUserPostsInfiniteQuery(username)

  // Fetch user comments
  const {
    data: commentsData,
    isLoading: commentsLoading,
    error: commentsError,
    hasNextPage: hasMoreComments
  } = useGetUserCommentsInfiniteQuery(username)

  if (profileLoading || postsLoading || commentsLoading) {
    return (
      <Center>
        <Loader />
      </Center>
    )
  }

  // Determine which error to show (prioritize profile error)
  const error = profileError || postsError || commentsError
  if (error) {
    const errorMessage = getErrorMessage(error, username)

    return (
      <Stack align="center" mt="lg" gap="md">
        <Title order={3} c="red">
          <MdError size={16} /> Profile Not Available
        </Title>
        <Text size="sm" c="dimmed" ta="center" maw={500}>
          {errorMessage}
        </Text>
        <Button color="gray" component={Link} href={`/u/${username}`}>
          Try Again
        </Button>
      </Stack>
    )
  }

  // Extract posts from the infinite query structure
  const posts =
    postsData?.pages?.flatMap((page) => page.data?.children || []) || []
  const comments =
    commentsData?.pages?.flatMap((page) => page.data?.children || []) || []

  return (
    <div className={classes.container}>
      <Group mb="md" align="center">
        <Avatar
          size="lg"
          radius="md"
          src={profile?.icon_img || profile?.snoovatar_img}
          alt={`u/${username}`}
        >
          {username.charAt(0).toUpperCase()}
        </Avatar>
        <Title order={1} className={classes.header}>
          u/{username}
        </Title>
      </Group>

      <Tabs defaultValue="posts">
        <Tabs.List>
          <Tabs.Tab value="posts">
            Posts{' '}
            {posts.length > 0 && `(${posts.length}${hasMorePosts ? '+' : ''})`}
          </Tabs.Tab>
          <Tabs.Tab value="comments">
            Comments{' '}
            {comments.length > 0 &&
              `(${comments.length}${hasMoreComments ? '+' : ''})`}
          </Tabs.Tab>
          <Tabs.Tab value="profile">Profile</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="posts" pt="md">
          <Stack gap="md">
            {posts.length > 0 ? (
              posts.map((postChild: any) => (
                <PostCard key={postChild.data?.id} post={postChild.data} />
              ))
            ) : (
              <Text c="dimmed">No posts found</Text>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="comments" pt="md">
          <Stack gap="md">
            {comments.length > 0 ? (
              comments.map((commentChild: any) => (
                <Card key={commentChild.data?.id} padding="md" shadow="xs">
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      <BiSolidUpvote />
                      <NumberFormatter
                        value={commentChild.data?.score ?? 0}
                        thousandSeparator
                      />
                      <Text size="sm" c="dimmed">
                        in r/{commentChild.data?.subreddit}
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {formatTimeAgo(commentChild.data?.created_utc)}
                    </Text>
                  </Group>

                  <Text
                    size="sm"
                    dangerouslySetInnerHTML={{
                      __html: decodeAndSanitizeHtml(
                        commentChild.data?.body_html ??
                          commentChild.data?.body ??
                          ''
                      )
                    }}
                  />
                </Card>
              ))
            ) : (
              <Text c="dimmed">No comments found</Text>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="profile" pt="md">
          <Stack gap="md">
            <Card padding="lg" shadow="sm" withBorder>
              <Group mb="md">
                <Avatar
                  size="lg"
                  radius="md"
                  src={profile?.icon_img || profile?.snoovatar_img}
                  alt={`u/${username}`}
                >
                  {username.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <Group gap="xs">
                    <Title order={2}>u/{username}</Title>
                    {profile?.verified && (
                      <Badge
                        color="blue"
                        variant="filled"
                        size="sm"
                        leftSection={<MdVerified size={12} />}
                      >
                        Verified
                      </Badge>
                    )}
                    {profile?.has_verified_email && !profile?.verified && (
                      <Badge
                        color="green"
                        variant="outline"
                        size="sm"
                        leftSection={<MdVerified size={12} />}
                      >
                        Email Verified
                      </Badge>
                    )}
                    {profile?.is_employee && (
                      <Badge color="red" variant="filled" size="sm">
                        Reddit Admin
                      </Badge>
                    )}
                  </Group>
                  {profile?.subreddit?.public_description && (
                    <Text size="sm" c="dimmed" mt="xs">
                      {profile.subreddit.public_description}
                    </Text>
                  )}
                </div>
              </Group>

              <Divider mb="md" />

              <Grid>
                <Grid.Col span={4}>
                  <Stack gap="xs" align="center">
                    <Text size="xl" fw="bold" c="blue">
                      <NumberFormatter
                        value={profile?.link_karma || 0}
                        thousandSeparator
                      />
                    </Text>
                    <Text size="sm" c="dimmed">
                      Post Karma
                    </Text>
                  </Stack>
                </Grid.Col>

                <Grid.Col span={4}>
                  <Stack gap="xs" align="center">
                    <Text size="xl" fw="bold" c="orange">
                      <NumberFormatter
                        value={profile?.comment_karma || 0}
                        thousandSeparator
                      />
                    </Text>
                    <Text size="sm" c="dimmed">
                      Comment Karma
                    </Text>
                  </Stack>
                </Grid.Col>

                <Grid.Col span={4}>
                  <Stack gap="xs" align="center">
                    <Text size="xl" fw="bold" c="green">
                      <NumberFormatter
                        value={
                          (profile?.link_karma || 0) +
                          (profile?.comment_karma || 0)
                        }
                        thousandSeparator
                      />
                    </Text>
                    <Text size="sm" c="dimmed">
                      Total Karma
                    </Text>
                  </Stack>
                </Grid.Col>
              </Grid>

              <Divider my="md" />

              <Group justify="space-between">
                <div>
                  <Text size="sm" c="dimmed">
                    Account Created
                  </Text>
                  <Text size="sm">
                    {profile?.created_utc
                      ? formatTimeAgo(profile.created_utc)
                      : 'Unknown'}
                  </Text>
                </div>

                {profile?.is_gold && (
                  <Badge color="yellow" variant="filled" size="lg">
                    Reddit Premium
                  </Badge>
                )}
              </Group>

              {profile?.subreddit?.display_name && (
                <>
                  <Divider my="md" />
                  <Group>
                    <Text size="sm" c="dimmed">
                      Profile Subreddit:
                    </Text>
                    <Anchor
                      href={`/u/${profile.subreddit.display_name}`}
                      size="sm"
                    >
                      u/{profile.subreddit.display_name}
                    </Anchor>
                  </Group>
                </>
              )}
            </Card>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </div>
  )
}
