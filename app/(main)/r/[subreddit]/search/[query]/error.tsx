'use client'

import {Button, Card, Stack, Text} from '@mantine/core'
import {IconAlertCircle, IconRefresh} from '@tabler/icons-react'

/**
 * Error boundary for subreddit search page.
 * Displays a user-friendly error message with retry option.
 */
export default function SubredditSearchError({
  error,
  reset
}: Readonly<{
  error: Error & {digest?: string}
  reset: () => void
}>) {
  return (
    <Card withBorder padding="xl" radius="md" maw={600} mx="auto">
      <Stack align="center" gap="md">
        <IconAlertCircle size={48} color="var(--mantine-color-red-6)" />
        <Text size="xl" fw={600}>
          Search Failed
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          {error.message || 'Something went wrong while searching.'}
        </Text>
        <Button
          aria-label="Try again"
          color="blue"
          data-umami-event="search-error-reset"
          leftSection={<IconRefresh size={16} />}
          maw={200}
          onClick={reset}
          variant="light"
        >
          Try Again
        </Button>
      </Stack>
    </Card>
  )
}
