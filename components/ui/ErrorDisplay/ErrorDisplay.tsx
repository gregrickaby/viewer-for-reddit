import {Alert, Stack, Text} from '@mantine/core'
import {IconAlertCircle} from '@tabler/icons-react'

interface ErrorDisplayProps {
  title?: string
  message?: string
}

export function ErrorDisplay({
  title = 'Something went wrong',
  message = 'Please try again in a moment.'
}: Readonly<ErrorDisplayProps>) {
  return (
    <Alert
      icon={<IconAlertCircle size={18} />}
      title={title}
      color="red"
      variant="light"
    >
      <Stack gap={4}>
        <Text size="sm">{message}</Text>
      </Stack>
    </Alert>
  )
}
