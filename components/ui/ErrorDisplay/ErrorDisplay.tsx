import {Alert, Button, List, Stack} from '@mantine/core'
import {IconAlertCircle, IconBrandReddit} from '@tabler/icons-react'
import classes from './ErrorDisplay.module.css'

interface ErrorDisplayProps {
  isAuthenticated?: boolean
}

export function ErrorDisplay({isAuthenticated}: Readonly<ErrorDisplayProps>) {
  return (
    <Alert
      color="red"
      classNames={{title: classes.title}}
      icon={<IconAlertCircle size={20} />}
      title="Something went wrong"
      variant="outline"
    >
      <Stack gap="sm">
        <List type="ordered" size="sm" spacing="xs" withPadding>
          <List.Item>Content not found or set to private</List.Item>
          <List.Item>Server or network issue</List.Item>
          <List.Item>Reddit rate limits</List.Item>
        </List>

        {!isAuthenticated && (
          <Button
            aria-label="Sign in with Reddit"
            color="blue"
            component="a"
            data-umami-event="login-button-error-display"
            href="/api/auth/login"
            leftSection={<IconBrandReddit size={16} />}
            size="sm"
            variant="light"
            w="fit-content"
          >
            Sign in with Reddit
          </Button>
        )}
      </Stack>
    </Alert>
  )
}
