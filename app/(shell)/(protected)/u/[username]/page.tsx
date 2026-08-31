import {FeedContainer} from '@/components/layout/FeedContainer/FeedContainer'
import {TabsSkeleton} from '@/components/skeletons/TabsSkeleton/TabsSkeleton'
import {AddUserToMultiredditButton} from '@/components/ui/AddUserToMultiredditButton/AddUserToMultiredditButton'
import {FollowButton} from '@/components/ui/FollowButton/FollowButton'
import {PostListWithTabs} from '@/components/ui/PostListWithTabs/PostListWithTabs'
import {UserCommentListWithTabs} from '@/components/ui/UserCommentListWithTabs/UserCommentListWithTabs'
import {UserProfileTabs} from '@/components/ui/UserProfileTabs/UserProfileTabs'
import {fetchMultireddits} from '@/lib/actions/reddit/multireddits'
import {fetchUserPosts} from '@/lib/actions/reddit/posts'
import {fetchUserComments, fetchUserInfo} from '@/lib/actions/reddit/users'
import {getSession} from '@/lib/auth/session'
import {logger} from '@/lib/datadog/server'
import {appConfig} from '@/lib/config/app.config'
import {RedditUser, SortOption, TimeFilter} from '@/lib/types/reddit'
import {NotFoundError, getErrorMessage} from '@/lib/utils/errors'
import {decodeHtmlEntities, formatNumber} from '@/lib/utils/formatters'
import {generateListingMetadata} from '@/lib/utils/metadata-helpers'
import {Avatar, Card, Group, Skeleton, Stack, Text, Title} from '@mantine/core'
import {IconAlertCircle} from '@tabler/icons-react'
import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {Suspense} from 'react'

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

  return generateListingMetadata({
    title: `u/${username}`,
    description: `View u/${username} profile, posts, and comments with ${appConfig.site.name}.`,
    canonicalUrl: `/u/${username}`,
    index: false
  })
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

/**
 * Empty-state card shown when a user has no posts or comments to display.
 *
 * @param title - Heading text
 * @param message - Explanatory body text
 */
function EmptyProfileState({
  title,
  message
}: Readonly<{
  title: string
  message: string
}>) {
  return (
    <Card withBorder padding="xl" radius="md">
      <Stack align="center" gap="md">
        <IconAlertCircle size={48} color="var(--mantine-color-yellow-6)" />
        <Text size="lg" fw={600} ta="center">
          {title}
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          {message}
        </Text>
      </Stack>
    </Card>
  )
}

async function UserProfile({
  params
}: Readonly<{
  params: PageProps['params']
}>) {
  const {username} = await params
  const session = await getSession()
  const currentUsername = session.username
  const isOwnProfile = currentUsername?.toLowerCase() === username.toLowerCase()
  const multireddits = !isOwnProfile ? await fetchMultireddits() : []

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
          <Stack gap="xs" flex={1}>
            <Group justify="space-between" align="flex-start">
              <Title order={2}>u/{user.name}</Title>
              {!isOwnProfile && (
                <Group gap="xs" wrap="nowrap">
                  {multireddits.length > 0 && (
                    <AddUserToMultiredditButton
                      username={user.name}
                      multireddits={multireddits}
                    />
                  )}
                  <FollowButton
                    username={user.name}
                    initialIsFollowing={!!user.is_friend}
                  />
                </Group>
              )}
            </Group>
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
    logger.error('Failed to fetch user profile', {
      error: getErrorMessage(error),
      context: 'UserProfile',
      username
    })
    if (error instanceof NotFoundError) {
      notFound()
    }
    throw error
  }
}

/**
 * User posts list component.
 * Fetches and displays all posts and comments from a user.
 *
 * @param username - Reddit username
 * @param sort - Sort option (hot, new, top, rising)
 * @param timeFilter - Time filter for top/controversial (hour, day, week, month, year, all)
 */
async function UserPosts({
  username,
  sort = 'new',
  timeFilter
}: Readonly<{
  username: string
  sort?: SortOption
  timeFilter?: TimeFilter
}>) {
  let result

  try {
    result = await fetchUserPosts(username, sort, undefined, timeFilter)
  } catch (error) {
    logger.error('Failed to fetch user posts', {
      error: getErrorMessage(error),
      context: 'UserPosts',
      username
    })
    throw error
  }

  if (result.posts.length === 0) {
    return (
      <EmptyProfileState
        title="No Posts Found"
        message="This user is either private or hasn't posted anything yet."
      />
    )
  }

  return (
    <PostListWithTabs
      posts={result.posts}
      after={result.after}
      activeSort={sort}
      activeTimeFilter={timeFilter}
      username={username}
    />
  )
}

/**
 * User comments list component.
 * Fetches and displays all comments from a user.
 *
 * @param username - Reddit username
 * @param sort - Sort option (hot, new, top, rising)
 * @param timeFilter - Time filter for top/controversial (hour, day, week, month, year, all)
 */
async function UserComments({
  username,
  sort = 'new',
  timeFilter
}: Readonly<{
  username: string
  sort?: SortOption
  timeFilter?: TimeFilter
}>) {
  let result

  try {
    result = await fetchUserComments(username, sort, undefined, timeFilter)
  } catch (error) {
    logger.error('Failed to fetch user comments', {
      error: getErrorMessage(error),
      context: 'UserComments',
      username
    })
    throw error
  }

  if (result.comments.length === 0) {
    return (
      <EmptyProfileState
        title="No Comments Found"
        message="This user is either private or hasn't commented yet."
      />
    )
  }

  return (
    <UserCommentListWithTabs
      comments={result.comments}
      activeSort={sort}
      activeTimeFilter={timeFilter}
      username={username}
    />
  )
}

/**
 * Resolves params/searchParams, then renders the tab UI with both tab
 * panels' content pre-rendered on the server.
 *
 * @param params - URL params promise (username)
 * @param searchParams - URL search params promise (tab, sort option)
 */
async function UserPageTabs({
  params,
  searchParams
}: Readonly<{
  params: PageProps['params']
  searchParams: PageProps['searchParams']
}>) {
  const {username} = await params
  const {tab, sort, time} = await searchParams
  const activeTab = tab || 'posts'
  const postSort = (sort as SortOption) || 'new'
  const timeFilter = time as TimeFilter | undefined

  return (
    <UserProfileTabs
      username={username}
      activeTab={activeTab}
      postsContent={
        <UserPosts
          username={username}
          sort={postSort}
          timeFilter={timeFilter}
        />
      }
      commentsContent={
        <UserComments
          username={username}
          sort={postSort}
          timeFilter={timeFilter}
        />
      }
    />
  )
}

/**
 * User profile page - displays user info, posts, and comments in tabs.
 *
 * @param params - URL params (username)
 * @param searchParams - URL search params (tab, sort option)
 */
export default function UserPage({params, searchParams}: Readonly<PageProps>) {
  return (
    <FeedContainer>
      <Suspense
        fallback={
          <Card withBorder padding="lg" radius="md">
            <Group>
              <Skeleton height={80} width={80} radius="md" />
              <Stack gap="xs" flex={1}>
                <Skeleton height={28} width={200} />
                <Skeleton height={16} width={150} />
              </Stack>
            </Group>
          </Card>
        }
      >
        <UserProfile params={params} />
      </Suspense>

      <Suspense fallback={<TabsSkeleton withProfileTabs />}>
        <UserPageTabs params={params} searchParams={searchParams} />
      </Suspense>
    </FeedContainer>
  )
}
