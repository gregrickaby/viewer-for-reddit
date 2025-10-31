import {Card, Skeleton, Stack, VisuallyHidden} from '@mantine/core'

/**
 * CommentsLoading component
 *
 * Displays a skeleton loading state for comments while data is being fetched.
 * Renders 5 placeholder cards with animated skeletons and provides accessible
 * loading announcement via aria-live region for screen readers.
 *
 */
export function CommentsLoading() {
  return (
    <output
      aria-live="polite"
      aria-busy="true"
      aria-describedby="loading-description"
    >
      <Stack gap="md">
        {Array.from({length: 5}, (_, i) => `skeleton-${i}`).map((id) => (
          <Card key={id} padding="md" withBorder>
            <Stack gap="xs">
              <Skeleton height={12} width="30%" />
              <Skeleton height={8} width="100%" />
              <Skeleton height={8} width="90%" />
              <Skeleton height={8} width="85%" mt="xs" />
            </Stack>
          </Card>
        ))}
      </Stack>
      <VisuallyHidden id="loading-description">
        Loading comments. Please wait.
      </VisuallyHidden>
    </output>
  )
}
