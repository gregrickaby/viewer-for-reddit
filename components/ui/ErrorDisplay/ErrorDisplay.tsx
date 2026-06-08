import {AppLink} from '@/components/ui/AppLink/AppLink'
import {Button, Card, Stack, Text} from '@mantine/core'
import {
  IconAlertCircle,
  IconBrandReddit,
  IconRefresh
} from '@tabler/icons-react'

interface ErrorDisplayProps {
  /** Whether the current user is authenticated (shows login button when false) */
  isAuthenticated?: boolean
  /** Optional reset callback; shows a "Try Again" button when provided */
  onReset?: () => void
}

/** Error state card with a message and optional sign-in or retry actions. */
export function ErrorDisplay({
  isAuthenticated,
  onReset
}: Readonly<ErrorDisplayProps>) {
  return (
    <Card withBorder padding="xl" radius="md" maw={600} mx="auto">
      <Stack align="center" gap="md">
        <IconAlertCircle size={48} color="var(--mantine-color-red-6)" />
        <Text size="xl" fw={600}>
          Sign in to use this website
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          Reddit's free API access has been limited. Please sign in to continue
          browsing. If you continue to see this message, please see our{' '}
          <AppLink
            href="/about"
            style={{color: 'var(--mantine-color-blue-6)', fontWeight: 500}}
          >
            FAQ's
          </AppLink>
          .
        </Text>

        {!isAuthenticated && (
          <Button
            aria-label="Sign in with Reddit"
            color="red"
            component="a"
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
