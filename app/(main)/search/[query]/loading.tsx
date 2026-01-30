import {PostSkeleton} from '@/components/skeletons/PostSkeleton/PostSkeleton'
import {Container, Stack, Title} from '@mantine/core'

/**
 * Loading UI for search pages.
 * Shown while searching Reddit.
 */
export default function Loading() {
  return (
    <Container size="lg">
      <Stack gap="xl" maw={800}>
        <Title order={2}>Searching...</Title>
        <PostSkeleton />
      </Stack>
    </Container>
  )
}
