import {Card, Group, Skeleton, Stack} from '@mantine/core'

/** Skeleton loading placeholder for a single comment. Mimics the Comment component structure with optional indentation. */
export function CommentSkeleton({
  depth = 0
}: Readonly<{
  /** Nesting depth for indentation */
  depth?: number
}>) {
  return (
    <div style={{marginLeft: depth * 20}}>
      <Card withBorder padding="md" radius="md" mb="sm">
        <Stack gap="sm">
          <Group gap="xs">
            <Skeleton height={12} width={100} />
            <Skeleton height={12} width={60} />
          </Group>
          <Skeleton height={10} width="90%" />
          <Skeleton height={10} width="85%" />
          <Skeleton height={10} width="70%" />
          <Group gap="md" mt="xs">
            <Skeleton height={24} width={60} />
            <Skeleton height={24} width={60} />
          </Group>
        </Stack>
      </Card>
    </div>
  )
}

/** Skeleton loading placeholder for a list of comments with varying indentation depths. */
export function CommentListSkeleton({
  count = 10
}: Readonly<{
  /** Number of skeleton comments to render */
  count?: number
}>) {
  return (
    <Stack gap="xs">
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
  )
}
