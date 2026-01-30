import {Button, Card, Stack, Text} from '@mantine/core'
import {
  IconAlertCircle,
  IconBrandReddit,
  IconRefresh
} from '@tabler/icons-react'

interface ErrorDisplayProps {
  isAuthenticated?: boolean
  onReset?: () => void
}

export function ErrorDisplay({
  isAuthenticated,
  onReset
}: Readonly<ErrorDisplayProps>) {
  return (
    <Card withBorder padding="xl" radius="md" maw={600}>
      <Stack align="center" gap="md">
        <IconAlertCircle size={48} color="var(--mantine-color-red-6)" />
        <Text size="xl" fw={600}>
          Something went wrong
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          The content was not found or set to private, a server issue occurred,
          or you've reached Reddit's rate limit.
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          Sign in to remove rate limits or try again later.
        </Text>

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
      </Stack>
    </Card>
  )
}
