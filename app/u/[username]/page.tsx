import {AppLayout} from '@/components/layout/AppLayout/AppLayout'
import {PostSkeleton} from '@/components/skeletons/PostSkeleton/PostSkeleton'
import BackToTop from '@/components/ui/BackToTop/BackToTop'
import BossButton from '@/components/ui/BossButton/BossButton'
import {PostList} from '@/components/ui/PostList/PostList'
import {
  fetchMultireddits,
  fetchUserInfo,
  fetchUserPosts,
  fetchUserSubscriptions,
  getCurrentUserAvatar
} from '@/lib/actions/reddit'
import {getSession} from '@/lib/auth/session'
import {appConfig} from '@/lib/config/app.config'
import {RedditUser} from '@/lib/types/reddit'
import {decodeHtmlEntities, formatNumber} from '@/lib/utils/formatters'
import {logger} from '@/lib/utils/logger'
import {Avatar, Card, Container, Group, Stack, Text, Title} from '@mantine/core'
import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {Suspense} from 'react'

interface PageProps {
  params: Promise<{
    username: string
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
 */
async function UserPosts({username}: Readonly<{username: string}>) {
  let result

  try {
    result = await fetchUserPosts(username)
    logger.info(`Fetched ${result.posts.length} posts for user ${username}`, {
      context: 'UserPosts',
      username,
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
      <Text size="sm" c="dimmed">
        This user hasn&apos;t posted anything yet
      </Text>
    )
  }

  return (
    <PostList
      initialPosts={result.posts}
      initialAfter={result.after}
      username={username}
    />
  )
}

/**
 * User profile page - displays user info and posts.
 *
 * Features:
 * - User profile card (avatar, karma, cake day)
 * - User posts and comments
 * - No infinite scroll (Reddit API limitation)
 * - Boss button and back-to-top button
 *
 * @param params - URL params (username)
 */
export default async function UserPage({params}: Readonly<PageProps>) {
  const {username} = await params
  const session = await getSession()
  const isAuthenticated = !!session.accessToken

  const [subscriptions, multireddits, avatarUrl] = await Promise.all([
    isAuthenticated ? fetchUserSubscriptions() : Promise.resolve([]),
    isAuthenticated ? fetchMultireddits() : Promise.resolve([]),
    isAuthenticated ? getCurrentUserAvatar() : Promise.resolve(null)
  ])

  return (
    <>
      <AppLayout
        isAuthenticated={isAuthenticated}
        username={session.username}
        avatarUrl={avatarUrl ?? undefined}
        subscriptions={subscriptions}
        multireddits={multireddits}
      >
        <Container size="lg">
          <Stack gap="xl" style={{maxWidth: '800px'}}>
            <Suspense fallback={<PostSkeleton />}>
              <UserProfile username={username} />
            </Suspense>

            <div>
              <Title order={3} mb="lg">
                Posts
              </Title>
              <Suspense fallback={<PostSkeleton />}>
                <UserPosts username={username} />
              </Suspense>
            </div>
          </Stack>
        </Container>
      </AppLayout>
      <BossButton />
      <BackToTop />
    </>
  )
}
