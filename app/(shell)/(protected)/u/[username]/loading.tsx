import {FeedContainer} from '@/components/layout/FeedContainer/FeedContainer'
import {TabsSkeleton} from '@/components/skeletons/TabsSkeleton/TabsSkeleton'
import {Card, Group, Skeleton, Stack} from '@mantine/core'

/**
 * Loading UI for user profile pages.
 * Shown while fetching user info, posts, and comments.
 * Mirrors the user info Card rendered by UserProfile in page.tsx.
 */
export default function Loading() {
  return (
    <FeedContainer>
      <Card withBorder padding="lg" radius="md">
        <Group>
          <Skeleton height={80} width={80} radius="md" />
          <Stack gap="xs" flex={1}>
            <Skeleton height={28} width={200} />
            <Skeleton height={16} width={150} />
          </Stack>
        </Group>
      </Card>
      <TabsSkeleton withProfileTabs />
    </FeedContainer>
  )
}
