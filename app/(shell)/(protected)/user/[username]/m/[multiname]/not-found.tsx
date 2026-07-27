/**
 * Multireddit not found page.
 * Shown when notFound() is called from a multireddit page.
 */
import {AppLink} from '@/components/ui/AppLink/AppLink'
import {Container, Stack, Text, Title} from '@mantine/core'

export default function MultiredditNotFound() {
  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="xs">
        <Title order={1}>Multireddit not found</Title>
        <Text c="dimmed">
          This multireddit doesn&apos;t exist or is no longer available.
        </Text>
        <AppLink href="/" style={{fontWeight: 600}}>
          Go Home
        </AppLink>
      </Stack>
    </Container>
  )
}
