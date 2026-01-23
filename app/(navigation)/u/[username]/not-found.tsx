/**
 * User profile not found page.
 * Shown when notFound() is called from a user profile page.
 */
import {Anchor, Container, Stack, Text, Title} from '@mantine/core'
import Link from 'next/link'

export default function UserNotFound() {
  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="xs">
        <Title order={1}>User not found</Title>
        <Text c="dimmed">
          This user account doesn't exist or has been deleted.
        </Text>
        <Anchor component={Link} href="/" fw={600}>
          Go Home
        </Anchor>
      </Stack>
    </Container>
  )
}
