import {AppLink} from '@/components/ui/AppLink/AppLink'
import {Button, Card, Stack, Text} from '@mantine/core'
import {
  IconAlertCircle,
  IconBrandReddit,
  IconRefresh
} from '@tabler/icons-react'

interface ErrorDisplayProps {
  /**
   * Whether the caller has confirmed the user is unauthenticated. Only then
   * does this render sign-in messaging - most errors here happen to users
   * who are already signed in, so that's never the default.
   */
  showSignIn?: boolean
  /** Optional retry callback; shows a "Try Again" button when provided */
  onRetry?: () => void
}

/** Error state card with a message and, when relevant, sign-in or retry actions. */
export function ErrorDisplay({
  showSignIn,
  onRetry
}: Readonly<ErrorDisplayProps>) {
  return (
    <Card withBorder padding="xl" radius="md" maw={600} mx="auto">
      <Stack align="center" gap="md">
        <IconAlertCircle size={48} color="var(--mantine-color-red-6)" />
        <Text size="xl" fw={600}>
          {showSignIn ? 'Sign in to use this website' : 'Something went wrong'}
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          {showSignIn ? (
            <>
              Reddit no longer allows free access to their content API's. Please
              sign in to continue browsing.
            </>
          ) : (
            <>We hit an unexpected error loading this page.</>
          )}{' '}
          If you continue to see this message, please see our{' '}
          <AppLink
            href="/about"
            style={{color: 'var(--mantine-color-blue-6)', fontWeight: 500}}
          >
            FAQ's
          </AppLink>
          .
        </Text>

        {showSignIn && (
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

        {onRetry && (
          <Button
            aria-label="Try again"
            color="blue"
            leftSection={<IconRefresh size={16} />}
            maw={200}
            onClick={onRetry}
            variant="light"
          >
            Try Again
          </Button>
        )}
      </Stack>
    </Card>
  )
}
