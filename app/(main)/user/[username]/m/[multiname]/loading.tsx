import {TabsSkeleton} from '@/components/skeletons/TabsSkeleton/TabsSkeleton'
import {Container, Stack} from '@mantine/core'

/**
 * Loading UI for multireddit pages.
 * Shown while fetching multireddit posts.
 */
export default function Loading() {
  return (
    <Container size="lg">
      <Stack gap="xl" maw={800}>
        <TabsSkeleton />
      </Stack>
    </Container>
  )
}
