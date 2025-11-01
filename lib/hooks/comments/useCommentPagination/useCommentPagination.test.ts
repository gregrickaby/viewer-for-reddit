import {renderHook} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {useCommentPagination} from './useCommentPagination'

/**
 * Tests for useCommentPagination hook.
 *
 * Covers:
 * - Flat mode pagination
 * - Nested mode pagination
 * - Mode switching
 * - Function forwarding
 */
describe('useCommentPagination', () => {
  describe('Flat mode', () => {
    it('should use flat pagination functions when nested disabled', () => {
      const flatFetchNext = vi.fn()
      const rawFetchNext = vi.fn()

      const {result} = renderHook(() =>
        useCommentPagination({
          enableNestedComments: false,
          fetchNextPage: flatFetchNext,
          hasNextPage: true,
          isFetchingNextPage: false,
          fetchNextPageRaw: rawFetchNext,
          hasNextPageRaw: true,
          isFetchingNextPageRaw: false
        })
      )

      expect(result.current.currentFetchNextPage).toBe(flatFetchNext)
      expect(result.current.currentHasNextPage).toBe(true)
      expect(result.current.currentIsFetchingNextPage).toBe(false)
    })

    it('should handle undefined flat pagination states', () => {
      const {result} = renderHook(() =>
        useCommentPagination({
          enableNestedComments: false,
          fetchNextPage: undefined,
          hasNextPage: undefined,
          isFetchingNextPage: undefined
        })
      )

      expect(result.current.currentFetchNextPage).toBeUndefined()
      expect(result.current.currentHasNextPage).toBeUndefined()
      expect(result.current.currentIsFetchingNextPage).toBeUndefined()
    })
  })

  describe('Nested mode', () => {
    it('should use raw pagination functions when nested enabled', () => {
      const flatFetchNext = vi.fn()
      const rawFetchNext = vi.fn()

      const {result} = renderHook(() =>
        useCommentPagination({
          enableNestedComments: true,
          fetchNextPage: flatFetchNext,
          hasNextPage: false,
          isFetchingNextPage: false,
          fetchNextPageRaw: rawFetchNext,
          hasNextPageRaw: true,
          isFetchingNextPageRaw: true
        })
      )

      expect(result.current.currentFetchNextPage).toBe(rawFetchNext)
      expect(result.current.currentHasNextPage).toBe(true)
      expect(result.current.currentIsFetchingNextPage).toBe(true)
    })

    it('should handle undefined raw pagination states', () => {
      const {result} = renderHook(() =>
        useCommentPagination({
          enableNestedComments: true,
          fetchNextPageRaw: undefined,
          hasNextPageRaw: undefined,
          isFetchingNextPageRaw: undefined
        })
      )

      expect(result.current.currentFetchNextPage).toBeUndefined()
      expect(result.current.currentHasNextPage).toBeUndefined()
      expect(result.current.currentIsFetchingNextPage).toBeUndefined()
    })
  })

  describe('Mode switching', () => {
    it('should switch pagination functions when mode changes', () => {
      const flatFetchNext = vi.fn()
      const rawFetchNext = vi.fn()

      let enableNestedComments = false

      const {result, rerender} = renderHook(() =>
        useCommentPagination({
          enableNestedComments,
          fetchNextPage: flatFetchNext,
          hasNextPage: true,
          isFetchingNextPage: false,
          fetchNextPageRaw: rawFetchNext,
          hasNextPageRaw: true,
          isFetchingNextPageRaw: false
        })
      )

      // Initially in flat mode
      expect(result.current.currentFetchNextPage).toBe(flatFetchNext)

      // Switch to nested mode
      enableNestedComments = true
      rerender()
      expect(result.current.currentFetchNextPage).toBe(rawFetchNext)

      // Switch back to flat mode
      enableNestedComments = false
      rerender()
      expect(result.current.currentFetchNextPage).toBe(flatFetchNext)
    })
  })
})
