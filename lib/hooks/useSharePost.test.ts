import {act, renderHook} from '@/test-utils'
import {notifications} from '@mantine/notifications'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useSharePost} from './useSharePost'

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn()
  }
}))

const mockNotifications = vi.mocked(notifications)

describe('useSharePost', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock location.origin
    Object.defineProperty(globalThis, 'location', {
      value: {origin: 'https://example.com'},
      writable: true
    })

    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined)
      },
      writable: true,
      configurable: true
    })
  })

  describe('successful share', () => {
    it('copies full URL to clipboard', async () => {
      const {result} = renderHook(() => useSharePost())

      await act(async () => {
        await result.current.sharePost('/r/pics/comments/abc123')
      })

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://example.com/r/pics/comments/abc123'
      )
    })

    it('shows success notification', async () => {
      const {result} = renderHook(() => useSharePost())

      await act(async () => {
        await result.current.sharePost('/r/pics/comments/abc123')
      })

      expect(mockNotifications.show).toHaveBeenCalledWith({
        message: 'Link copied to clipboard',
        color: 'teal',
        autoClose: 3000
      })
    })

    it('handles different path formats', async () => {
      const {result} = renderHook(() => useSharePost())

      await act(async () => {
        await result.current.sharePost('/r/AskReddit')
      })

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://example.com/r/AskReddit'
      )
    })

    it('handles paths with hash fragments', async () => {
      const {result} = renderHook(() => useSharePost())

      await act(async () => {
        await result.current.sharePost('/r/pics/comments/abc123#comments')
      })

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://example.com/r/pics/comments/abc123#comments'
      )
    })
  })

  describe('error handling', () => {
    it('shows error notification when clipboard fails', async () => {
      vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(
        new Error('Clipboard access denied')
      )

      const {result} = renderHook(() => useSharePost())

      await act(async () => {
        await result.current.sharePost('/r/pics/comments/abc123')
      })

      expect(mockNotifications.show).toHaveBeenCalledWith({
        message: 'Failed to copy link',
        color: 'red',
        autoClose: 3000
      })
    })

    it('does not show success notification on error', async () => {
      vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(
        new Error('Clipboard access denied')
      )

      const {result} = renderHook(() => useSharePost())

      await act(async () => {
        await result.current.sharePost('/r/pics/comments/abc123')
      })

      // Only error notification should be shown
      expect(mockNotifications.show).toHaveBeenCalledTimes(1)
      expect(mockNotifications.show).toHaveBeenCalledWith(
        expect.objectContaining({
          color: 'red'
        })
      )
    })
  })

  describe('multiple shares', () => {
    it('can share multiple times', async () => {
      const {result} = renderHook(() => useSharePost())

      await act(async () => {
        await result.current.sharePost('/r/pics/comments/abc123')
        await result.current.sharePost('/r/videos/comments/xyz789')
      })

      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(2)
      expect(mockNotifications.show).toHaveBeenCalledTimes(2)
    })

    it('handles success then failure', async () => {
      const {result} = renderHook(() => useSharePost())

      await act(async () => {
        await result.current.sharePost('/r/pics/comments/abc123')
      })

      vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(
        new Error('Clipboard error')
      )

      await act(async () => {
        await result.current.sharePost('/r/videos/comments/xyz789')
      })

      expect(mockNotifications.show).toHaveBeenCalledTimes(2)
      expect(mockNotifications.show).toHaveBeenNthCalledWith(1, {
        message: 'Link copied to clipboard',
        color: 'teal',
        autoClose: 3000
      })
      expect(mockNotifications.show).toHaveBeenNthCalledWith(2, {
        message: 'Failed to copy link',
        color: 'red',
        autoClose: 3000
      })
    })
  })
})
