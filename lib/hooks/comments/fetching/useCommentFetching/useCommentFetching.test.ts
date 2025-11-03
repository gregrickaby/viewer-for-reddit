import {renderHook} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {useCommentFetching} from './useCommentFetching'

/**
 * Tests for useCommentFetching hook.
 *
 * Covers:
 * - All 4 fetching modes (flat/nested × lazy/infinite)
 * - Loading states for each mode
 * - Error states for each mode
 * - Pagination controls
 */
describe('useCommentFetching', () => {
  const mockPermalink = '/r/test/comments/abc123'

  describe('Flat + Lazy mode', () => {
    it('should not fetch when shouldFetch is false', () => {
      const {result} = renderHook(() =>
        useCommentFetching({
          permalink: mockPermalink,
          shouldFetch: false,
          enableInfiniteLoading: false,
          enableNestedComments: false
        })
      )

      expect(result.current.fetchedComments).toBeUndefined()
      expect(result.current.loading.isLoading).toBe(false)
    })

    it('should provide fetch function for lazy loading', () => {
      const {result} = renderHook(() =>
        useCommentFetching({
          permalink: mockPermalink,
          shouldFetch: false,
          enableInfiniteLoading: false,
          enableNestedComments: false
        })
      )

      expect(typeof result.current.fetchComments).toBe('function')
    })
  })

  describe('Flat + Infinite mode', () => {
    it('should skip query when shouldFetch is false', () => {
      const {result} = renderHook(() =>
        useCommentFetching({
          permalink: mockPermalink,
          shouldFetch: false,
          enableInfiniteLoading: true,
          enableNestedComments: false
        })
      )

      expect(result.current.infiniteData).toBeUndefined()
    })

    it('should provide pagination controls', () => {
      const {result} = renderHook(() =>
        useCommentFetching({
          permalink: mockPermalink,
          shouldFetch: true,
          enableInfiniteLoading: true,
          enableNestedComments: false
        })
      )

      expect(typeof result.current.pagination.fetchNextPage).toBe('function')
      expect(typeof result.current.pagination.hasNextPage).toBe('boolean')
      expect(typeof result.current.pagination.isFetchingNextPage).toBe(
        'boolean'
      )
    })
  })

  describe('Nested + Lazy mode', () => {
    it('should provide raw fetch function', () => {
      const {result} = renderHook(() =>
        useCommentFetching({
          permalink: mockPermalink,
          shouldFetch: false,
          enableInfiniteLoading: false,
          enableNestedComments: true
        })
      )

      expect(typeof result.current.fetchCommentsRaw).toBe('function')
    })
  })

  describe('Nested + Infinite mode', () => {
    it('should provide raw pagination controls', () => {
      const {result} = renderHook(() =>
        useCommentFetching({
          permalink: mockPermalink,
          shouldFetch: true,
          enableInfiniteLoading: true,
          enableNestedComments: true
        })
      )

      expect(typeof result.current.pagination.fetchNextPageRaw).toBe('function')
      expect(typeof result.current.pagination.hasNextPageRaw).toBe('boolean')
      expect(typeof result.current.pagination.isFetchingNextPageRaw).toBe(
        'boolean'
      )
    })
  })

  describe('Loading states', () => {
    it('should provide all loading states', () => {
      const {result} = renderHook(() =>
        useCommentFetching({
          permalink: mockPermalink,
          shouldFetch: true,
          enableInfiniteLoading: false,
          enableNestedComments: false
        })
      )

      expect(result.current.loading).toHaveProperty('isLoading')
      expect(result.current.loading).toHaveProperty('isLoadingRaw')
      expect(result.current.loading).toHaveProperty('isInfiniteLoading')
      expect(result.current.loading).toHaveProperty('isInfiniteLoadingRaw')
    })
  })

  describe('Error states', () => {
    it('should provide all error states', () => {
      const {result} = renderHook(() =>
        useCommentFetching({
          permalink: mockPermalink,
          shouldFetch: true,
          enableInfiniteLoading: false,
          enableNestedComments: false
        })
      )

      expect(result.current.errors).toHaveProperty('error')
      expect(result.current.errors).toHaveProperty('errorRaw')
      expect(result.current.errors).toHaveProperty('infiniteError')
      expect(result.current.errors).toHaveProperty('infiniteErrorRaw')
      expect(result.current.errors).toHaveProperty('isError')
      expect(result.current.errors).toHaveProperty('isErrorRaw')
      expect(result.current.errors).toHaveProperty('isInfiniteError')
      expect(result.current.errors).toHaveProperty('isInfiniteErrorRaw')
    })
  })
})
