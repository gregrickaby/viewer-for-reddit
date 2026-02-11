import {PostListWithTabs} from '@/components/ui/PostListWithTabs/PostListWithTabs'
import {SubredditSearchBar} from '@/components/ui/SubredditSearchBar/SubredditSearchBar'
import {SubscribeButton} from '@/components/ui/SubscribeButton/SubscribeButton'
import {fetchPosts, fetchSubredditInfo} from '@/lib/actions/reddit'
import {getSession} from '@/lib/auth/session'
import {appConfig} from '@/lib/config/app.config'
import {Avatar, Card, Container, Group, Stack, Text, Title} from '@mantine/core'
import type {Metadata} from 'next'

import {SortOption, TimeFilter} from '@/lib/types/reddit'
import {decodeHtmlEntities} from '@/lib/utils/formatters'
import {generateListingMetadata} from '@/lib/utils/metadata-helpers'

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

  return generateListingMetadata({
    title: `r/${subreddit}`,
    description: `Browse posts in r/${subreddit} with ${appConfig.site.name}.`,
    canonicalUrl: `/r/${subreddit}`,
    index: false
  })
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

  const info = isSpecialFeed ? null : await fetchSubredditInfo(subreddit)

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
          <SubredditSearchBar subreddit={subreddit} />
        </Stack>
      </Card>
    )
  }

  return (
    <Card withBorder padding="lg" radius="md" mb="lg">
      <Stack gap="sm">
        <Title order={2}>r/{subreddit}</Title>
        <SubredditSearchBar subreddit={subreddit} />
      </Stack>
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
  const {posts, after} = await fetchPosts(
    subreddit,
    sort,
    undefined,
    timeFilter
  )

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
        <SubredditInfo
          subreddit={subreddit}
          isAuthenticated={isAuthenticated}
        />

        <SubredditPosts
          subreddit={subreddit}
          isAuthenticated={isAuthenticated}
          sort={postSort}
          timeFilter={timeFilter}
        />
      </Stack>
    </Container>
  )
}
