'use client'

import {clearExpiredSession} from '@/lib/actions/auth'
import {Button, Card, Stack, Text} from '@mantine/core'
import {IconLock} from '@tabler/icons-react'
import {useRouter} from 'next/navigation'
import {useTransition} from 'react'
import styles from './AuthExpiredError.module.css'

/**
 * Display when user's authentication session has expired.
 * Provides clear messaging and action to re-authenticate.
 *
 * Features:
 * - Clear explanation of session expiry
 * - Sign in button that clears session and redirects to login
 * - Lock icon for visual feedback
 * - Prevents race conditions with isPending check
 *
 * @example
 * ```typescript
 * <AuthExpiredError />
 * ```
 */
export function AuthExpiredError() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleSignIn = () => {
    if (isPending) return

    startTransition(async () => {
      try {
        // Clear the expired session
        await clearExpiredSession()
        // Redirect to login
        router.push('/api/auth/login')
      } catch (error) {
        console.error('Failed to clear session:', error)
        // Still try to redirect to login
        router.push('/api/auth/login')
      }
    })
  }

  return (
    <Card withBorder padding="xl" radius="md" className={styles.container}>
      <Stack align="center" gap="md">
        <IconLock size={48} color="var(--mantine-color-orange-6)" />
        <Text size="xl" fw={600}>
          Session Expired
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          Your login session has expired. Please sign in again to continue.
        </Text>

        <Button
          onClick={handleSignIn}
          disabled={isPending}
          variant="filled"
          loading={isPending}
        >
          Sign In Again
        </Button>
      </Stack>
    </Card>
  )
}
