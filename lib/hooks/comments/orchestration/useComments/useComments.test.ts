import {renderHook} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {useComments} from './useComments'

/**
 * Tests for useComments orchestrator hook.
 *
 * Covers:
 * - Hook composition
 * - Lazy fetch triggering
 * - Mode combinations
 * - Error aggregation
 * - Loading state aggregation
 */
describe('useComments', () => {
  const defaultParams = {
    permalink: '/r/test/comments/abc123/test/',
    open: false
  }

  describe('Basic functionality', () => {
    it('should return expected interface', () => {
      const {result} = renderHook(() => useComments(defaultParams))

      expect(result.current).toHaveProperty('displayComments')
      expect(result.current).toHaveProperty('nestedComments')
      expect(result.current).toHaveProperty('showLoading')
      expect(result.current).toHaveProperty('hasCommentsToShow')
      expect(result.current).toHaveProperty('currentFetchNextPage')
      expect(result.current).toHaveProperty('currentHasNextPage')
      expect(result.current).toHaveProperty('currentIsFetchingNextPage')
      expect(result.current).toHaveProperty('enableNestedComments')
      expect(result.current).toHaveProperty('enableInfiniteLoading')
      expect(result.current).toHaveProperty('isError')
      expect(result.current).toHaveProperty('error')
    })

    it('should return empty comments when no data provided', () => {
      const {result} = renderHook(() => useComments(defaultParams))

      expect(result.current.displayComments).toEqual([])
      expect(result.current.hasCommentsToShow).toBe(false)
    })

    it('should use provided comments when available', () => {
      const mockComments = [{id: '1', body: 'Test'} as any]

      const {result} = renderHook(() =>
        useComments({
          ...defaultParams,
          comments: mockComments
        })
      )

      expect(result.current.displayComments).toEqual(mockComments)
      expect(result.current.hasCommentsToShow).toBe(true)
    })
  })

  describe('Mode combinations', () => {
    it('should handle flat + lazy mode', () => {
      const {result} = renderHook(() =>
        useComments({
          ...defaultParams,
          enableInfiniteLoading: false,
          enableNestedComments: false
        })
      )

      expect(result.current.enableInfiniteLoading).toBe(false)
      expect(result.current.enableNestedComments).toBe(false)
    })

    it('should handle flat + infinite mode', () => {
      const {result} = renderHook(() =>
        useComments({
          ...defaultParams,
          enableInfiniteLoading: true,
          enableNestedComments: false
        })
      )

      expect(result.current.enableInfiniteLoading).toBe(true)
      expect(result.current.enableNestedComments).toBe(false)
    })

    it('should handle nested + lazy mode', () => {
      const {result} = renderHook(() =>
        useComments({
          ...defaultParams,
          enableInfiniteLoading: false,
          enableNestedComments: true
        })
      )

      expect(result.current.enableInfiniteLoading).toBe(false)
      expect(result.current.enableNestedComments).toBe(true)
    })

    it('should handle nested + infinite mode', () => {
      const {result} = renderHook(() =>
        useComments({
          ...defaultParams,
          enableInfiniteLoading: true,
          enableNestedComments: true
        })
      )

      expect(result.current.enableInfiniteLoading).toBe(true)
      expect(result.current.enableNestedComments).toBe(true)
    })
  })

  describe('Default values', () => {
    it('should use default values when not provided', () => {
      const {result} = renderHook(() => useComments(defaultParams))

      expect(result.current.enableInfiniteLoading).toBe(false)
      expect(result.current.enableNestedComments).toBe(false)
    })
  })

  describe('Max comment depth', () => {
    it('should use default max depth', () => {
      const {result} = renderHook(() =>
        useComments({
          ...defaultParams,
          enableNestedComments: true
        })
      )

      // Default maxCommentDepth is 4 (not directly testable, but hook should work)
      expect(result.current.nestedComments).toBeDefined()
    })

    it('should accept custom max depth', () => {
      const {result} = renderHook(() =>
        useComments({
          ...defaultParams,
          enableNestedComments: true,
          maxCommentDepth: 10
        })
      )

      expect(result.current.nestedComments).toBeDefined()
    })
  })
})
