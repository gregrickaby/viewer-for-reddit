/**
 * Saved items not found page.
 * Shown when notFound() is called from the saved items page.
 */
import {AppLink} from '@/components/ui/AppLink/AppLink'
import {Container, Stack, Text, Title} from '@mantine/core'

export default function SavedItemsNotFound() {
  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="xs">
        <Title order={1}>Saved items not found</Title>
        <Text c="dimmed">
          This user account doesn't exist, is set to private, or has been
          deleted.
        </Text>
        <AppLink href="/" style={{fontWeight: 600}}>
          Go Home
        </AppLink>
      </Stack>
    </Container>
  )
}
