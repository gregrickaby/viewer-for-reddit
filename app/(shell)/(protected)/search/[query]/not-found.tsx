/**
 * Search results not found page.
 * Shown when notFound() is called from the search results page.
 */
import {AppLink} from '@/components/ui/AppLink/AppLink'
import {Container, Stack, Text, Title} from '@mantine/core'

export default function SearchNotFound() {
  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="xs">
        <Title order={1}>Search unavailable</Title>
        <Text c="dimmed">This search could not be completed.</Text>
        <AppLink href="/" style={{fontWeight: 600}}>
          Go Home
        </AppLink>
      </Stack>
    </Container>
  )
}
