'use client'

import {ErrorMessage} from '@/components/UI/ErrorMessage/ErrorMessage'
import {Favorite} from '@/components/UI/Favorite/Favorite'
import {Card} from '@/components/UI/Post/Card/Card'
import {SubredditAbout} from '@/components/UI/SubredditAbout/SubredditAbout'
import config from '@/lib/config'
import {useInfinitePosts} from '@/lib/hooks/feed/useInfinitePosts'
import {useTrackRecentSubreddit} from '@/lib/hooks/subreddit/useTrackRecentSubreddit'
import {useUpdateMeta} from '@/lib/hooks/util/useUpdateMeta'
import type {AutoPostChild} from '@/lib/store/services/postsApi'
import type {SortingOption} from '@/lib/types'
import {
  ActionIcon,
  Button,
  Group,
  Loader,
  SegmentedControl,
  Stack,
  Title,
  Tooltip
} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'
import {usePathname} from 'next/navigation'
import {useState} from 'react'
import {IoInformationCircleOutline} from 'react-icons/io5'

interface SubredditProps {
  subreddit: string
  sort?: SortingOption
}

/**
 * Subreddit component for rendering a paginated, sortable list of Reddit posts for a subreddit.
 *
 * Features:
 * - Fetches posts using useInfinitePosts (RTK Query + infinite scroll)
 * - Supports sorting (Hot, New, Top) via SegmentedControl
 * - Handles loading, error, and empty states with clear UI feedback
 * - Integrates with Favorite, Card, and infinite scroll for seamless UX
 * - Tracks recent subreddits for user convenience
 *
 * @param subreddit - The subreddit name to fetch posts from
 * @param sort - The initial sorting option (default: 'hot')
 * @returns JSX.Element for a full subreddit post feed with controls
 */
export function Subreddit({subreddit, sort = 'hot'}: Readonly<SubredditProps>) {
  useTrackRecentSubreddit(subreddit)
  const [selectedSort, setSelectedSort] = useState<SortingOption>(sort)
  const [opened, {open, close}] = useDisclosure(false)
  const pathname = usePathname()

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
    noVisiblePosts,
    ref,
    wasFiltered
  } = useInfinitePosts({subreddit, sort: selectedSort})

  // Only update meta tags when on a subreddit page (not homepage)
  // Homepage is "/" and subreddit pages are "/r/[subreddit]"
  const isSubredditPage = pathname?.startsWith('/r/')

  useUpdateMeta(
    isSubredditPage && data?.pages?.[0]?.data?.children?.[0]?.data?.subreddit
      ? `r/${data.pages[0].data.children[0].data.subreddit} - ${config.siteName}`
      : undefined,
    isSubredditPage &&
      data?.pages?.[0]?.data?.children?.[0]?.data?.subreddit_name_prefixed
      ? `Browse posts in ${data.pages[0].data.children[0].data.subreddit_name_prefixed}`
      : undefined
  )

  if (isLoading) {
    return (
      <Group justify="center" mt="lg">
        <Loader />
      </Group>
    )
  }

  if (isError) {
    return (
      <ErrorMessage
        error={error}
        type="subreddit"
        resourceName={subreddit}
        fallbackUrl="/"
      />
    )
  }

  let content = null
  if (noVisiblePosts) {
    content = (
      <Title order={4} ta="center" mt="lg" c="red">
        {wasFiltered
          ? 'You need to enable the "Allow NSFW" setting to see posts'
          : 'No posts found! Try a different subreddit'}
      </Title>
    )
  } else {
    content = data?.pages.flatMap((page) =>
      (page?.data?.children ?? []).map((post: AutoPostChild) =>
        post?.data ? <Card key={post.data.id} post={post.data} /> : null
      )
    )
  }

  return (
    <Stack>
      <Group justify="space-between" gap="xs">
        <Group gap="xs">
          <Title order={1} size="h2">
            {subreddit === 'all' ? 'Home' : `Posts from r/${subreddit}`}
          </Title>
          <Favorite subreddit={subreddit} />
          {subreddit !== 'all' && subreddit !== 'popular' && (
            <Tooltip label="About this subreddit">
              <ActionIcon
                aria-label="About this subreddit"
                data-umami-event="open subreddit about"
                onClick={open}
                size="lg"
                variant="subtle"
              >
                <IoInformationCircleOutline size={20} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
        <SegmentedControl
          data-umami-event="change sort button"
          onChange={(value) => setSelectedSort(value as SortingOption)}
          value={selectedSort}
          data={[
            {label: 'Hot', value: 'hot'},
            {label: 'New', value: 'new'},
            {label: 'Top', value: 'top'}
          ]}
        />
      </Group>

      {opened && (
        <SubredditAbout subreddit={subreddit} opened={opened} onClose={close} />
      )}

      {content}

      {hasNextPage && !wasFiltered && (
        <div ref={ref} style={{minHeight: 60}}>
          {isFetchingNextPage ? (
            <Group justify="center">
              <Loader />
            </Group>
          ) : (
            <Button
              data-umami-event="load more button"
              fullWidth
              onClick={() => fetchNextPage()}
            >
              Load More
            </Button>
          )}
        </div>
      )}
    </Stack>
  )
}
