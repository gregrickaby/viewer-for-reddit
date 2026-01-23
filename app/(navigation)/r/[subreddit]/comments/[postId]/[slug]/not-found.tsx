/**
 * Post not found page.
 * Shown when notFound() is called from a post detail page.
 */
import {Anchor, Container, Stack, Text, Title} from '@mantine/core'

export default function PostNotFound() {
  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="xs">
        <Title order={1}>Post not found</Title>
        <Text c="dimmed">This post may have been deleted or removed.</Text>
        <Anchor href="/" fw={600}>
          Go Home
        </Anchor>
      </Stack>
    </Container>
  )
}
