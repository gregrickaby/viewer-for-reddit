import {Divider, Group, Skeleton, Stack} from '@mantine/core'
import {PostListSkeleton} from '@/components/skeletons/PostSkeleton/PostSkeleton'

/**
 * Skeleton loading placeholder for a tabbed post list. Mimics PostListWithTabs's
 * sort dropdown + divider structure. Pass `withProfileTabs` on the user profile
 * page, which additionally renders its Posts/Comments Tabs.List above that row.
 */
export function TabsSkeleton({
  withProfileTabs = false
}: Readonly<{
  /** Also render the outer Posts/Comments tab switcher used on user profile pages */
  withProfileTabs?: boolean
}>) {
  return (
    <Stack gap="md">
      {withProfileTabs && <Skeleton height={38} radius="sm" />}

      <Group gap="xs">
        <Skeleton height={26} width={70} radius="sm" />
      </Group>

      <Divider />

      <PostListSkeleton count={3} />
    </Stack>
  )
}
