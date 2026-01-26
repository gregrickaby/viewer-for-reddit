/**
 * Subreddit not found page.
 * Shown when notFound() is called from a subreddit page.
 */
import {Anchor, Container, Stack, Text, Title} from '@mantine/core'

export default function SubredditNotFound() {
  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="xs">
        <Title order={1}>Subreddit not found</Title>
        <Text c="dimmed">This subreddit doesn't exist or has been banned.</Text>
        <Anchor href="/" fw={600}>
          Go Home
        </Anchor>
      </Stack>
    </Container>
  )
}
