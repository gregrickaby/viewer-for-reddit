'use client'

import {Button, Card, Group, Stack, Text} from '@mantine/core'
import {IconAlertCircle} from '@tabler/icons-react'
import {useRouter} from 'next/navigation'
import styles from './ErrorDisplay.module.css'

/**
 * Props for the ErrorDisplay component.
 */
interface ErrorDisplayProps {
  /** Error title (default: 'Something went wrong') */
  title?: string
  /** Error message (default: 'An unexpected error occurred...') */
  message?: string
  /** Whether to show the retry button (default: true) */
  showRetry?: boolean
  /** Whether to show the go home button (default: true) */
  showHome?: boolean
}

/**
 * Display an error message with optional action buttons.
 * Used for user-facing error states throughout the app.
 *
 * Features:
 * - Customizable title and message
 * - Optional retry button (calls router.refresh())
 * - Optional home button (navigates to /)
 * - Alert icon for visual feedback
 *
 * @example
 * ```typescript
 * <ErrorDisplay
 *   title="Post not found"
 *   message="This post may have been deleted"
 *   showRetry={false}
 * />
 * ```
 */
export function ErrorDisplay({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  showRetry = true,
  showHome = true
}: Readonly<ErrorDisplayProps>) {
  const router = useRouter()

  return (
    <Card withBorder padding="xl" radius="md" className={styles.container}>
      <Stack align="center" gap="md">
        <IconAlertCircle size={48} color="var(--mantine-color-red-6)" />
        <Text size="xl" fw={600}>
          {title}
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          {message}
        </Text>

        <Group>
          {showRetry && (
            <Button onClick={() => router.refresh()} variant="light">
              Try Again
            </Button>
          )}
          {showHome && (
            <Button onClick={() => router.push('/')} variant="outline">
              Go Home
            </Button>
          )}
        </Group>
      </Stack>
    </Card>
  )
}
