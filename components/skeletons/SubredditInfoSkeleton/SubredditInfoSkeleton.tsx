import {Card, Group, Skeleton, Stack} from '@mantine/core'

/**
 * Loading skeleton for subreddit info card.
 * Displays placeholder content while subreddit metadata loads.
 */
export function SubredditInfoSkeleton() {
  return (
    <Card withBorder padding="lg" radius="md" mb="lg">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <Group gap="md">
            <Skeleton height={56} width={56} radius="md" />
            <div>
              <Skeleton height={28} width={200} mb="xs" />
              <Skeleton height={16} width={150} />
            </div>
          </Group>
          <Group gap="md" wrap="nowrap">
            <div>
              <Skeleton height={18} width={60} mb="xs" />
              <Skeleton height={14} width={70} />
            </div>
            <Skeleton height={36} width={100} radius="md" />
          </Group>
        </Group>
        <Skeleton height={16} width="100%" />
        <Skeleton height={16} width="80%" />
      </Stack>
    </Card>
  )
}
