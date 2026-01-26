import {CommentSkeleton} from '@/components/skeletons/CommentSkeleton/CommentSkeleton'
import {PostSkeleton} from '@/components/skeletons/PostSkeleton/PostSkeleton'
import {TabsSkeleton} from '@/components/skeletons/TabsSkeleton/TabsSkeleton'
import {ErrorBoundary} from '@/components/ui/ErrorBoundary/ErrorBoundary'
import {PostListWithTabs} from '@/components/ui/PostListWithTabs/PostListWithTabs'
import {
  fetchUserComments,
  fetchUserInfo,
  fetchUserPosts
} from '@/lib/actions/reddit'
import {getSession} from '@/lib/auth/session'
import {appConfig} from '@/lib/config/app.config'
import {RedditUser, SortOption, TimeFilter} from '@/lib/types/reddit'
import {decodeHtmlEntities, formatNumber} from '@/lib/utils/formatters'
import {logger} from '@/lib/utils/logger'
import {Avatar, Card, Container, Group, Stack, Text, Title} from '@mantine/core'
import {IconAlertCircle} from '@tabler/icons-react'
import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {Suspense} from 'react'
import {UserCommentListWithTabs} from './UserCommentListWithTabs'
import {UserProfileTabs} from './UserProfileTabs'

interface PageProps {
  params: Promise<{
    username: string
  }>
  searchParams: Promise<{
    tab?: string
    sort?: string
    time?: string
  }>
}

/**
 * Generate static metadata for user profile pages.
 */
export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {username} = await params

  const title = `u/${username} - ${appConfig.site.name}`
  const description = `View u/${username} profile, posts, and comments with ${appConfig.site.name}.`

  return {
    title,
    description,
    alternates: {
      canonical: `/u/${username}`
    },
    robots: {
      index: false,
      follow: true
    },
    openGraph: {
      title,
      description,
      url: `/u/${username}`,
      images: [
        {
          url: '/social-share.webp',
          width: 1200,
          height: 630,
          alt: appConfig.site.name
        }
      ]
    }
  }
}

/**
 * Formats a Unix timestamp into a human-readable date.
 *
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted date string (e.g., "January 15, 2020")
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

async function UserProfile({username}: Readonly<{username: string}>) {
  try {
    const user: RedditUser = await fetchUserInfo(username)

    if (!user) {
      notFound()
    }

    const avatarUrl = user.icon_img
      ? decodeHtmlEntities(user.icon_img)
      : undefined

    return (
      <Card withBorder padding="lg" radius="md">
        <Group>
          <Avatar src={avatarUrl} size={80} radius="md" alt={`u/${username}`} />
          <Stack gap="xs">
            <Title order={2}>u/{user.name}</Title>
            <Group gap="xl">
              <div>
                <Text size="sm" c="dimmed">
                  Karma
                </Text>
                <Text size="lg" fw={600}>
                  {formatNumber(
                    user.total_karma || user.link_karma + user.comment_karma
                  )}
                </Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">
                  Cake Day
                </Text>
                <Text size="sm">{formatDate(user.created_utc)}</Text>
              </div>
            </Group>
          </Stack>
        </Group>
      </Card>
    )
  } catch (error) {
    logger.error('Failed to fetch user profile', error, {
      context: 'UserProfile',
      username
    })
    notFound()
  }
}

/**
 * User posts list component.
 * Fetches and displays all posts and comments from a user.
 *
 * @param username - Reddit username
 * @param isAuthenticated - Whether user is logged in
 * @param sort - Sort option (hot, new, top, rising)
 * @param timeFilter - Time filter for top/controversial (hour, day, week, month, year, all)
 */
async function UserPosts({
  username,
  isAuthenticated,
  sort = 'new',
  timeFilter
}: Readonly<{
  username: string
  isAuthenticated: boolean
  sort?: SortOption
  timeFilter?: TimeFilter
}>) {
  let result

  try {
    result = await fetchUserPosts(username, sort, undefined, timeFilter)
    logger.info(`Fetched ${result.posts.length} posts for user ${username}`, {
      context: 'UserPosts',
      username,
      sort,
      count: result.posts.length
    })
  } catch (error) {
    logger.error('Failed to fetch user posts', error, {
      context: 'UserPosts',
      username
    })
    return (
      <Text size="sm" c="red">
        Failed to load posts:{' '}
        {error instanceof Error ? error.message : 'Unknown error'}
      </Text>
    )
  }

  if (result.posts.length === 0) {
    return (
      <Card withBorder padding="xl" radius="md">
        <Stack align="center" gap="md">
          <IconAlertCircle size={48} color="var(--mantine-color-yellow-6)" />
          <Text size="lg" fw={600} ta="center">
            No Posts Found
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            This user is either private or hasn&apos;t posted anything yet.
          </Text>
        </Stack>
      </Card>
    )
  }

  return (
    <PostListWithTabs
      posts={result.posts}
      after={result.after}
      activeSort={sort}
      activeTimeFilter={timeFilter}
      isAuthenticated={isAuthenticated}
      username={username}
    />
  )
}

/**
 * User comments list component.
 * Fetches and displays all comments from a user.
 *
 * @param username - Reddit username
 * @param isAuthenticated - Whether user is logged in
 * @param sort - Sort option (hot, new, top, rising)
 * @param timeFilter - Time filter for top/controversial (hour, day, week, month, year, all)
 */
async function UserComments({
  username,
  isAuthenticated,
  sort = 'new',
  timeFilter
}: Readonly<{
  username: string
  isAuthenticated: boolean
  sort?: SortOption
  timeFilter?: TimeFilter
}>) {
  let result

  try {
    result = await fetchUserComments(username, sort, undefined, timeFilter)
    logger.info(
      `Fetched ${result.comments.length} comments for user ${username}`,
      {
        context: 'UserComments',
        username,
        sort,
        count: result.comments.length
      }
    )
  } catch (error) {
    logger.error('Failed to fetch user comments', error, {
      context: 'UserComments',
      username
    })
    return (
      <Text size="sm" c="red">
        Failed to load comments:{' '}
        {error instanceof Error ? error.message : 'Unknown error'}
      </Text>
    )
  }

  if (result.comments.length === 0) {
    return (
      <Card withBorder padding="xl" radius="md">
        <Stack align="center" gap="md">
          <IconAlertCircle size={48} color="var(--mantine-color-yellow-6)" />
          <Text size="lg" fw={600} ta="center">
            No Comments Found
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            This user is either private or hasn&apos;t commented yet.
          </Text>
        </Stack>
      </Card>
    )
  }

  return (
    <UserCommentListWithTabs
      comments={result.comments}
      activeSort={sort}
      activeTimeFilter={timeFilter}
      isAuthenticated={isAuthenticated}
      username={username}
    />
  )
}

/**
 * User profile page - displays user info, posts, and comments in tabs.
 *
 * Features:
 * - User profile card (avatar, karma, cake day)
 * - Tabs for posts and comments
 * - User posts with sort tabs (hot, new, top, rising)
 * - User comments sorted by date
 * - Infinite scroll for loading more posts/comments
 * - Boss button and back-to-top button
 *
 * @param params - URL params (username)
 * @param searchParams - URL search params (tab, sort option)
 */
export default async function UserPage({
  params,
  searchParams
}: Readonly<PageProps>) {
  const {username} = await params
  const {tab, sort, time} = await searchParams
  const activeTab = tab || 'posts'
  const postSort = (sort as SortOption) || 'new'
  const timeFilter = time as TimeFilter | undefined

  const session = await getSession()
  const isAuthenticated = !!session.accessToken

  return (
    <Container size="lg">
      <Stack gap="xl" maw={800}>
        <ErrorBoundary title="Failed to load profile">
          <Suspense fallback={<PostSkeleton />}>
            <UserProfile username={username} />
          </Suspense>
        </ErrorBoundary>

        <UserProfileTabs
          username={username}
          activeTab={activeTab}
          postsContent={
            <ErrorBoundary title="Failed to load posts">
              <Suspense fallback={<TabsSkeleton />}>
                <UserPosts
                  username={username}
                  isAuthenticated={isAuthenticated}
                  sort={postSort}
                  timeFilter={timeFilter}
                />
              </Suspense>
            </ErrorBoundary>
          }
          commentsContent={
            <ErrorBoundary title="Failed to load comments">
              <Suspense fallback={<CommentSkeleton />}>
                <UserComments
                  username={username}
                  isAuthenticated={isAuthenticated}
                  sort={postSort}
                  timeFilter={timeFilter}
                />
              </Suspense>
            </ErrorBoundary>
          }
        />
      </Stack>
    </Container>
  )
}
