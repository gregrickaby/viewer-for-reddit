'use client'

import {logger} from '@/lib/utils/logger'
import {notifications} from '@mantine/notifications'

/**
 * Hook for sharing posts/comments via clipboard.
 * Handles copying URL to clipboard and showing notifications.
 *
 * Features:
 * - Copies full URL to clipboard
 * - Shows success/error notifications
 * - Error logging for debugging
 *
 * @returns sharePost function that takes a path and copies full URL
 *
 * @example
 * ```typescript
 * const {sharePost} = useSharePost()
 *
 * <Button onClick={() => sharePost('/r/pics/comments/abc123')}>
 *   Share Post
 * </Button>
 * ```
 */
export function useSharePost() {
  const sharePost = async (path: string) => {
    try {
      const url = `${globalThis.location.origin}${path}`
      await navigator.clipboard.writeText(url)
      notifications.show({
        message: 'Link copied to clipboard',
        color: 'teal',
        autoClose: 3000
      })
    } catch (error) {
      logger.error('Failed to copy link', error, {
        context: 'useSharePost',
        path
      })
      notifications.show({
        message: 'Failed to copy link',
        color: 'red',
        autoClose: 3000
      })
    }
  }

  return {sharePost}
}
