import {Alert, Code, Stack, Text} from '@mantine/core'
import {IconAlertCircle} from '@tabler/icons-react'

interface ErrorDisplayProps {
  title?: string
  message?: string
  digest?: string
}

export function ErrorDisplay({
  title = 'Something went wrong',
  message = 'Please try again in a moment.',
  digest
}: Readonly<ErrorDisplayProps>) {
  return (
    <Alert
      icon={<IconAlertCircle size={18} />}
      title={title}
      color="red"
      variant="light"
    >
      <Stack gap="xs">
        <Text size="sm">{message}</Text>
        {digest && (
          <Text size="xs" c="dimmed">
            Error ID: <Code>{digest}</Code>
          </Text>
        )}
      </Stack>
    </Alert>
  )
}
