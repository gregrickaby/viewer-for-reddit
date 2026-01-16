import {Card, Group, Skeleton, Stack} from '@mantine/core'

/**
 * Skeleton loading placeholder for a single comment.
 * Mimics the structure of Comment component with optional indentation.
 *
 * @param depth - Nesting depth for indentation (default: 0)
 *
 * @example
 * ```typescript
 * <Suspense fallback={<CommentSkeleton depth={1} />}>
 *   <Comment comment={comment} depth={1} />
 * </Suspense>
 * ```
 */
export function CommentSkeleton({depth = 0}: Readonly<{depth?: number}>) {
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

/**
 * Skeleton loading placeholder for a list of comments.
 * Renders multiple CommentSkeleton components with varying depths.
 *
 * @param count - Number of skeleton comments to render (default: 10)
 *
 * @example
 * ```typescript
 * <Suspense fallback={<CommentListSkeleton count={5} />}>
 *   <CommentList comments={comments} />
 * </Suspense>
 * ```
 */
export function CommentListSkeleton({count = 10}: Readonly<{count?: number}>) {
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
