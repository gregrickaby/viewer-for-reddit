'use client'

import {Alert, Anchor, Box, Button, Code, Stack, Text} from '@mantine/core'
import {IconAlertCircle, IconBrandReddit} from '@tabler/icons-react'
import Link from 'next/link'

interface ErrorDisplayProps {
  title?: string
  message?: string
  digest?: string
  showLoginButton?: boolean
}

/**
 * Detect if error message suggests authentication would help.
 */
function shouldShowLogin(message: string): boolean {
  const msg = message.toLowerCase()
  return (
    msg.includes('auth') ||
    msg.includes('authentication') ||
    msg.includes('expired') ||
    msg.includes('log in') ||
    msg.includes('logging in') ||
    msg.includes('rate limit') ||
    msg.includes('sign in')
  )
}

export function ErrorDisplay({
  title = 'Something went wrong',
  message = 'Please try again in a moment.',
  digest,
  showLoginButton
}: Readonly<ErrorDisplayProps>) {
  // Auto-detect if we should show login button based on message
  const shouldShowLoginBtn = showLoginButton ?? shouldShowLogin(message ?? '')

  return (
    <Alert
      color="red"
      icon={<IconAlertCircle size={20} />}
      radius="md"
      title={title}
      variant="outline"
    >
      <Stack gap="md">
        <Text size="sm">{message}</Text>

        {shouldShowLoginBtn && (
          <Stack gap="sm">
            <Box>
              <Button
                aria-label="Log in with Reddit"
                color="red"
                component={Link}
                href="/api/auth/login"
                leftSection={<IconBrandReddit size={16} />}
                size="sm"
                variant="filled"
              >
                Log in with Reddit
              </Button>
            </Box>
            <Text size="xs" c="dimmed">
              Authenticated users have higher rate limits. We use the{' '}
              <Anchor
                href="https://github.com/reddit-archive/reddit/wiki/OAuth2"
                rel="noopener noreferrer"
                size="xs"
                target="_blank"
              >
                official Reddit oAuth2 API
              </Anchor>{' '}
              for authentication.
            </Text>
          </Stack>
        )}

        {digest && (
          <Text size="xs" c="dimmed">
            Error ID: <Code>{digest}</Code> •{' '}
            <Anchor
              href="https://github.com/gregrickaby/viewer-for-reddit/issues"
              rel="noopener noreferrer"
              size="xs"
              target="_blank"
            >
              Report issue
            </Anchor>
          </Text>
        )}
      </Stack>
    </Alert>
  )
}
