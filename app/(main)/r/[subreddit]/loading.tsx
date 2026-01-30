import {SubredditInfoSkeleton} from '@/components/skeletons/SubredditInfoSkeleton/SubredditInfoSkeleton'
import {TabsSkeleton} from '@/components/skeletons/TabsSkeleton/TabsSkeleton'
import {Container, Stack} from '@mantine/core'

/**
 * Loading UI for subreddit pages.
 * Shown while fetching subreddit info and posts.
 */
export default function Loading() {
  return (
    <Container size="lg">
      <Stack gap="xl" maw={800}>
        <SubredditInfoSkeleton />
        <TabsSkeleton />
      </Stack>
    </Container>
  )
}
