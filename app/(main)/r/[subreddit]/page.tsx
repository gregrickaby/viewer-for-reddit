import {SubredditInfoSkeleton} from '@/components/skeletons/SubredditInfoSkeleton/SubredditInfoSkeleton'
import {TabsSkeleton} from '@/components/skeletons/TabsSkeleton/TabsSkeleton'
import {ErrorBoundary} from '@/components/ui/ErrorBoundary/ErrorBoundary'
import {ErrorDisplay} from '@/components/ui/ErrorDisplay/ErrorDisplay'
import {PostListWithTabs} from '@/components/ui/PostListWithTabs/PostListWithTabs'
import {SubscribeButton} from '@/components/ui/SubscribeButton/SubscribeButton'
import {fetchPosts, fetchSubredditInfo} from '@/lib/actions/reddit'
import {getSession} from '@/lib/auth/session'
import {appConfig} from '@/lib/config/app.config'
import {logger} from '@/lib/utils/logger'
import {Avatar, Card, Container, Group, Stack, Text, Title} from '@mantine/core'
import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {Suspense} from 'react'

import {SortOption, TimeFilter} from '@/lib/types/reddit'
import {decodeHtmlEntities} from '@/lib/utils/formatters'

interface PageProps {
  params: Promise<{subreddit: string}>
  searchParams: Promise<{sort?: string; time?: string}>
}

/**
 * Generate static metadata for subreddit pages.
 */
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params
  const subreddit = params.subreddit

  const title = `r/${subreddit} - ${appConfig.site.name}`
  const description = `Browse posts in r/${subreddit} with ${appConfig.site.name}.`

  return {
    title,
    description,
    alternates: {
      canonical: `/r/${subreddit}`
    },
    robots: {
      index: false,
      follow: true
    },
    openGraph: {
      title,
      description,
      url: `/r/${subreddit}`,
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
 * Subreddit info card component.
 * Displays subreddit metadata (title, subscribers, description).
 * Handles special feeds (all, popular) that don't have info.
 *
 * @param subreddit - Subreddit name
 * @param isAuthenticated - Whether user is logged in
 */
async function SubredditInfo({
  subreddit,
  isAuthenticated
}: Readonly<{
  subreddit: string
  isAuthenticated: boolean
}>) {
  // Special feeds like 'all' and 'popular' don't have subreddit info
  const specialFeeds = ['all', 'popular']
  const isSpecialFeed = specialFeeds.includes(subreddit.toLowerCase())

  const info = isSpecialFeed
    ? null
    : await fetchSubredditInfo(subreddit).catch(() => null)

  if (info) {
    return (
      <Card withBorder padding="lg" radius="md" mb="lg">
        <Stack gap="sm">
          <Group justify="space-between" align="flex-start">
            <Group gap="md">
              <Avatar
                src={info.icon_img || info.community_icon || '/icon.png'}
                alt={info.display_name_prefixed}
                radius="md"
                size="lg"
              />
              <div>
                <Title order={2}>{info.display_name_prefixed}</Title>
                <Text size="sm" c="dimmed">
                  {info.title}
                </Text>
              </div>
            </Group>
            <Group gap="md" wrap="nowrap">
              <div>
                <Text size="sm" fw={600}>
                  {info.subscribers?.toLocaleString()}
                </Text>
                <Text size="xs" c="dimmed">
                  subscribers
                </Text>
              </div>
              {isAuthenticated && (
                <SubscribeButton
                  subredditName={info.display_name}
                  initialIsSubscribed={info.user_is_subscriber ?? false}
                />
              )}
            </Group>
          </Group>
          {info.public_description && (
            <Text size="sm">{decodeHtmlEntities(info.public_description)}</Text>
          )}
        </Stack>
      </Card>
    )
  }

  return (
    <Card withBorder padding="lg" radius="md" mb="lg">
      <Title order={2}>r/{subreddit}</Title>
    </Card>
  )
}

/**
 * Subreddit posts list component.
 * Fetches and displays posts with sort tabs and infinite scroll.
 *
 * @param subreddit - Subreddit name
 * @param isAuthenticated - Whether user is logged in
 * @param sort - Sort option (hot, new, top, rising, controversial)
 * @param timeFilter - Time filter for top/controversial (hour, day, week, month, year, all)
 */
async function SubredditPosts({
  subreddit,
  isAuthenticated,
  sort = 'hot',
  timeFilter
}: Readonly<{
  subreddit: string
  isAuthenticated: boolean
  sort?: SortOption
  timeFilter?: TimeFilter
}>) {
  const postsResult = await fetchPosts(
    subreddit,
    sort,
    undefined,
    timeFilter
  ).catch((error) => {
    logger.error('Failed to fetch posts for subreddit', error, {
      context: 'SubredditPage',
      subreddit
    })
    notFound()
  })

  const {posts, after} = postsResult

  if (posts.length === 0) {
    return <Text>No posts found in this subreddit.</Text>
  }

  return (
    <PostListWithTabs
      posts={posts}
      after={after}
      activeSort={sort}
      activeTimeFilter={timeFilter}
      isAuthenticated={isAuthenticated}
      subreddit={subreddit}
    />
  )
}

/**
 * Subreddit page - displays posts from a specific subreddit.
 *
 * Features:
 * - Subreddit info card (title, subscribers, description)
 * - Posts with sort tabs (hot, new, top, rising)
 * - Infinite scroll
 * - Error boundaries for info and posts separately
 * - Boss button and back-to-top button
 *
 * @param params - URL params (subreddit name)
 * @param searchParams - URL search params (sort option)
 */
export default async function SubredditPage({
  params,
  searchParams
}: Readonly<PageProps>) {
  const {subreddit} = await params
  const {sort, time} = await searchParams
  const postSort = (sort as SortOption) || 'hot'
  const timeFilter = time as TimeFilter | undefined

  const session = await getSession()
  const isAuthenticated = !!session.accessToken

  return (
    <Container size="lg">
      <Stack gap="xl" maw={800}>
        <ErrorBoundary
          fallback={
            <ErrorDisplay
              title="Failed to load subreddit info"
              message="Please try again in a moment."
            />
          }
        >
          <Suspense fallback={<SubredditInfoSkeleton />}>
            <SubredditInfo
              subreddit={subreddit}
              isAuthenticated={isAuthenticated}
            />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary
          fallback={
            <ErrorDisplay
              title="Failed to load posts"
              message="Please try again in a moment."
            />
          }
        >
          <Suspense fallback={<TabsSkeleton />}>
            <SubredditPosts
              subreddit={subreddit}
              isAuthenticated={isAuthenticated}
              sort={postSort}
              timeFilter={timeFilter}
            />
          </Suspense>
        </ErrorBoundary>
      </Stack>
    </Container>
  )
}
