'use client'

import {Alert, Anchor, Button, List, Stack, Text} from '@mantine/core'
import {IconAlertCircle, IconBrandReddit} from '@tabler/icons-react'

interface ErrorDisplayProps {
  isAuthenticated?: boolean
}

export function ErrorDisplay({isAuthenticated}: Readonly<ErrorDisplayProps>) {
  return (
    <Alert
      color="red"
      icon={<IconAlertCircle size={20} />}
      radius="md"
      title="Something went wrong"
      variant="outline"
    >
      <Stack gap="sm">
        <List type="ordered" spacing="xs" size="sm">
          <List.Item>Content not found or set to private</List.Item>
          <List.Item>Server or network issue</List.Item>
          <List.Item>Reddit rate limits</List.Item>
        </List>

        {!isAuthenticated && (
          <>
            <Text size="sm">
              <strong>Logging in reduces rate limits.</strong>
            </Text>

            <Button
              aria-label="Log in with Reddit"
              color="red"
              component="a"
              href="/api/auth/login"
              leftSection={<IconBrandReddit size={16} />}
              size="sm"
              variant="filled"
              maw={200}
            >
              Log in with Reddit
            </Button>
            <Text size="xs" c="dimmed">
              This app uses{' '}
              <Anchor
                href="https://github.com/reddit-archive/reddit/wiki/OAuth2"
                rel="noopener noreferrer"
                size="xs"
                target="_blank"
              >
                Reddit's official OAuth2 API
              </Anchor>
              .
            </Text>
          </>
        )}
      </Stack>
    </Alert>
  )
}
