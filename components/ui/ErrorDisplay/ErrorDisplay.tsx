import {Anchor, Button, Card, Stack, Text} from '@mantine/core'
import {
  IconAlertCircle,
  IconBrandReddit,
  IconRefresh
} from '@tabler/icons-react'
import Link from 'next/link'

interface ErrorDisplayProps {
  isAuthenticated?: boolean
  onReset?: () => void
}

export function ErrorDisplay({
  isAuthenticated,
  onReset
}: Readonly<ErrorDisplayProps>) {
  return (
    <Card withBorder padding="xl" radius="md" maw={600} mx="auto">
      <Stack align="center" gap="md">
        <IconAlertCircle size={48} color="var(--mantine-color-red-6)" />
        <Text size="xl" fw={600}>
          Something went wrong
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          This content was not found, set to private or you've reached Reddit's
          rate limit. If you continue to see this message, please see our{' '}
          <Anchor component={Link} href="/about" c="blue" fw={500}>
            FAQ's
          </Anchor>
          .
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          Sign in to remove rate limits or try again later.
        </Text>

        {!isAuthenticated && (
          <Button
            aria-label="Sign in with Reddit"
            color="red"
            component="a"
            data-umami-event="login-button-error-display"
            href="/api/auth/login"
            leftSection={<IconBrandReddit size={16} />}
            maw={200}
            variant="filled"
          >
            Sign in with Reddit
          </Button>
        )}

        {onReset && (
          <Button
            aria-label="Try again"
            color="blue"
            data-umami-event="error-reset-button"
            leftSection={<IconRefresh size={16} />}
            maw={200}
            onClick={onReset}
            variant="light"
          >
            Try Again
          </Button>
        )}
      </Stack>
    </Card>
  )
}
