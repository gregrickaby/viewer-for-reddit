import {Box, Card, Divider, Group, Skeleton, Stack} from '@mantine/core'

/** Skeleton loading placeholder for a single comment. Mimics the borderless Comment component structure with optional indentation. */
export function CommentSkeleton({
  depth = 0
}: Readonly<{
  /** Nesting depth for indentation */
  depth?: number
}>) {
  return (
    <div style={{marginLeft: depth * 20}}>
      <Card padding="xs" radius="md" mb="xs">
        <Stack gap="xs">
          <Group gap="xs">
            <Skeleton height={22} width={22} radius="sm" />
            <Skeleton height={20} width={20} radius="xl" />
            <Skeleton height={14} width={90} />
            <Skeleton height={12} width={50} />
          </Group>
          <Skeleton height={14} width="90%" />
          <Skeleton height={14} width="85%" />
          <Skeleton height={14} width="70%" />
          <Group gap="sm">
            <Skeleton height={26} width={70} radius="xl" />
            <Skeleton height={26} width={40} radius="xl" />
            <Skeleton height={26} width={40} radius="xl" />
          </Group>
        </Stack>
      </Card>
    </div>
  )
}

/** Skeleton loading placeholder for a list of comments with varying indentation depths. Mimics CommentListWithTabs, including its leading sort-dropdown and divider. */
export function CommentListSkeleton({
  count = 10
}: Readonly<{
  /** Number of skeleton comments to render */
  count?: number
}>) {
  return (
    <>
      <Box mb="lg">
        <Skeleton height={26} width={70} radius="sm" />
        <Divider mt="xs" />
      </Box>

      <Stack gap="md">
        {Array.from({length: count}).map((_, index) => {
          const depth = index % 3
          return (
            <CommentSkeleton
              key={`comment-skeleton-${index}-${depth}`}
              depth={depth}
            />
          )
        })}
      </Stack>
    </>
  )
}
