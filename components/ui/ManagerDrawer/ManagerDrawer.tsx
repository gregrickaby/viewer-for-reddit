'use client'

import {
  ActionIcon,
  Alert,
  Drawer,
  Group,
  ScrollArea,
  Stack,
  Text
} from '@mantine/core'
import {IconAlertCircle, IconX} from '@tabler/icons-react'
import {ReactNode} from 'react'

interface ManagerDrawerProps {
  /** Whether the drawer is open */
  opened: boolean
  /** Callback to close the drawer */
  onClose: () => void
  /** Drawer title text */
  title: string
  /** Error message to show in a dismissible alert, or null for no error */
  error: string | null
  /** Callback to dismiss the error alert */
  onDismissError: () => void
  /** Drawer body content */
  children: ReactNode
}

/**
 * Shared drawer shell for the subreddit and multireddit managers: title,
 * dismissible error alert, and scrollable body.
 */
export function ManagerDrawer({
  opened,
  onClose,
  title,
  error,
  onDismissError,
  children
}: Readonly<ManagerDrawerProps>) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={700} size="md">
          {title}
        </Text>
      }
      position="right"
      size="sm"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="md">
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            <Group
              justify="space-between"
              align="center"
              gap="xs"
              wrap="nowrap"
            >
              <Text size="sm" flex={1}>
                {error}
              </Text>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="red"
                onClick={onDismissError}
                data-testid="dismiss-error-btn"
                aria-label="Dismiss error"
              >
                <IconX size={14} />
              </ActionIcon>
            </Group>
          </Alert>
        )}

        {children}
      </Stack>
    </Drawer>
  )
}
