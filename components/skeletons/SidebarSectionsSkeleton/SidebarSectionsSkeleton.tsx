import {Skeleton, Stack} from '@mantine/core'

/**
 * Suspense fallback for {@link AuthenticatedSidebarSections} (My
 * Multireddits/My Subreddits/Following). Rendered inside the already-static
 * `SidebarPanel`, so it only needs to fill the personalized-sections area,
 * not the whole sidebar.
 */
export function SidebarSectionsSkeleton() {
  return (
    <Stack gap="md" mt="md">
      <Skeleton height={36} />
      <Skeleton height={36} />
      <Skeleton height={36} />
    </Stack>
  )
}
