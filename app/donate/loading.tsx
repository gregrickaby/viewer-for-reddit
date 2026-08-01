import {Container, Skeleton, Stack} from '@mantine/core'

/**
 * Loading UI for the Donate page.
 * Shown while the route segment is loading.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/loading
 */
export default function Loading() {
  return (
    <Container size="md" py="xl">
      <Stack gap="sm">
        <Skeleton height={32} width="40%" />
        <Skeleton height={16} />
        <Skeleton height={16} />
        <Skeleton height={16} width="80%" />
      </Stack>
    </Container>
  )
}
