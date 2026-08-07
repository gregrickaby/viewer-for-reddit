import {FeedContainer} from '@/components/layout/FeedContainer/FeedContainer'
import {SubredditInfoSkeleton} from '@/components/skeletons/SubredditInfoSkeleton/SubredditInfoSkeleton'
import {TabsSkeleton} from '@/components/skeletons/TabsSkeleton/TabsSkeleton'
import {AddToMultiredditButton} from '@/components/ui/AddToMultiredditButton/AddToMultiredditButton'
import {PostListWithTabs} from '@/components/ui/PostListWithTabs/PostListWithTabs'
import {SubredditSearchBar} from '@/components/ui/SubredditSearchBar/SubredditSearchBar'
import {SubscribeButton} from '@/components/ui/SubscribeButton/SubscribeButton'
import {fetchMultireddits} from '@/lib/actions/reddit/multireddits'
import {fetchPosts} from '@/lib/actions/reddit/posts'
import {fetchSubredditInfo} from '@/lib/actions/reddit/subreddits'
import {appConfig} from '@/lib/config/app.config'
import {logger} from '@/lib/datadog/server'
import {Avatar, Card, Group, Stack, Text, Title} from '@mantine/core'
import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {Suspense} from 'react'
import ReactMarkdown from 'react-markdown'

import {SortOption, TimeFilter} from '@/lib/types/reddit'
import {NotFoundError, getErrorMessage} from '@/lib/utils/errors'
import {formatNumber} from '@/lib/utils/formatters'
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
 * @param params - URL params promise (subreddit name)
 */
async function SubredditInfo({
  params
}: Readonly<{
  params: PageProps['params']
}>) {
  const {subreddit} = await params
  const multireddits = await fetchMultireddits()

  // Special feeds like 'all' and 'popular' don't have subreddit info
  const specialFeeds = ['all', 'popular']
  const isSpecialFeed = specialFeeds.includes(subreddit.toLowerCase())

  let info: Awaited<ReturnType<typeof fetchSubredditInfo>> | null = null

  if (!isSpecialFeed) {
    try {
      info = await fetchSubredditInfo(subreddit)
    } catch (error) {
      logger.error('Failed to fetch subreddit info', {
        error: getErrorMessage(error),
        context: 'SubredditInfo',
        subreddit
      })
      if (error instanceof NotFoundError) {
        notFound()
      }
      throw error
    }
  }

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
                  {info.subscribers ? formatNumber(info.subscribers) : '0'}
                </Text>
                <Text size="xs" c="dimmed">
                  subscribers
                </Text>
              </div>
              <Group gap="xs" wrap="nowrap">
                {multireddits.length > 0 && (
                  <AddToMultiredditButton
                    subredditName={info.display_name}
                    multireddits={multireddits}
                  />
                )}
                <SubscribeButton
                  subredditName={info.display_name}
                  initialIsSubscribed={info.user_is_subscriber ?? false}
                />
              </Group>
            </Group>
          </Group>
          {info.public_description && (
            <Text size="sm" component="div">
              <ReactMarkdown>{info.public_description}</ReactMarkdown>
            </Text>
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
 * @param params - URL params promise (subreddit name)
 * @param searchParams - URL search params promise (sort option)
 */
async function SubredditPosts({
  params,
  searchParams
}: Readonly<{
  params: PageProps['params']
  searchParams: PageProps['searchParams']
}>) {
  const {subreddit} = await params
  const {sort, time} = await searchParams
  const postSort = (sort as SortOption) || 'hot'
  const timeFilter = time as TimeFilter | undefined

  let posts: Awaited<ReturnType<typeof fetchPosts>>['posts']
  let after: Awaited<ReturnType<typeof fetchPosts>>['after']

  try {
    ;({posts, after} = await fetchPosts(
      subreddit,
      postSort,
      undefined,
      timeFilter
    ))
  } catch (error) {
    logger.error('Failed to fetch subreddit posts', {
      error: getErrorMessage(error),
      context: 'SubredditPosts',
      subreddit
    })
    if (error instanceof NotFoundError) {
      notFound()
    }
    throw error
  }

  if (posts.length === 0) {
    return <Text>No posts found in this subreddit.</Text>
  }

  return (
    <PostListWithTabs
      posts={posts}
      after={after}
      activeSort={postSort}
      activeTimeFilter={timeFilter}
      subreddit={subreddit}
    />
  )
}

/**
 * Subreddit page - displays posts from a specific subreddit.
 *
 * @param params - URL params promise (subreddit name)
 * @param searchParams - URL search params promise (sort option)
 */
export default function SubredditPage({
  params,
  searchParams
}: Readonly<PageProps>) {
  return (
    <FeedContainer>
      <Suspense fallback={<SubredditInfoSkeleton />}>
        <SubredditInfo params={params} />
      </Suspense>

      <Suspense fallback={<TabsSkeleton />}>
        <SubredditPosts params={params} searchParams={searchParams} />
      </Suspense>
    </FeedContainer>
  )
}
