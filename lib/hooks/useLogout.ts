'use client'

import {logout} from '@/lib/actions/auth'
import {logger} from '@/lib/utils/logger'
import {useRouter} from 'next/navigation'
import {useState, useTransition} from 'react'

/**
 * Return type for useLogout hook.
 */
interface UseLogoutReturn {
  /** Whether logout is in progress */
  isLoggingOut: boolean
  /** Whether a transition is pending */
  isPending: boolean
  /** Function to initiate logout */
  handleLogout: () => Promise<void>
}

/**
 * Hook for handling user logout with proper state management and error handling.
 * Implements race condition prevention and automatic navigation after successful logout.
 *
 * Features:
 * - Race condition prevention (ignores clicks while pending)
 * - Automatic navigation to home after successful logout
 * - Error logging with graceful failure
 * - Proper loading states for UI feedback
 *
 * @returns Logout state, pending status, and logout handler
 *
 * @example
 * ```typescript
 * const {isLoggingOut, isPending, handleLogout} = useLogout()
 *
 * <Button
 *   onClick={handleLogout}
 *   loading={isLoggingOut}
 *   disabled={isPending}
 * >
 *   Logout
 * </Button>
 * ```
 */
export function useLogout(): UseLogoutReturn {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    // Prevent race conditions
    if (isPending || isLoggingOut) return

    setIsLoggingOut(true)

    startTransition(async () => {
      try {
        const result = await logout()

        if (result.success) {
          router.push('/')
          router.refresh()
        }
      } catch (error) {
        // Log error but don't throw - component stays mounted
        logger.error('Logout failed', error, {context: 'useLogout'})
      } finally {
        setIsLoggingOut(false)
      }
    })
  }

  return {
    isLoggingOut,
    isPending,
    handleLogout
  }
}
