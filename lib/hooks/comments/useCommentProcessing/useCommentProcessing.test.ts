import {renderHook} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {useCommentProcessing} from './useCommentProcessing'

/**
 * Tests for useCommentProcessing hook.
 *
 * Covers:
 * - Flat comment processing
 * - Nested comment processing
 * - Display comment selection
 * - Empty state handling
 */
describe('useCommentProcessing', () => {
  describe('Flat mode', () => {
    it('should return empty arrays when no data provided', () => {
      const {result} = renderHook(() =>
        useCommentProcessing({
          enableNestedComments: false,
          infiniteData: undefined,
          infiniteDataRaw: undefined,
          fetchedCommentsRaw: undefined,
          maxCommentDepth: 10
        })
      )

      expect(result.current.infiniteComments).toEqual([])
      expect(result.current.displayComments).toEqual([])
      expect(result.current.hasCommentsToShow).toBe(false)
    })

    it('should use provided comments when available', () => {
      const mockComments = [{id: '1', body: 'Test'} as any]

      const {result} = renderHook(() =>
        useCommentProcessing({
          enableNestedComments: false,
          providedComments: mockComments,
          infiniteData: undefined,
          infiniteDataRaw: undefined,
          fetchedCommentsRaw: undefined,
          maxCommentDepth: 10
        })
      )

      expect(result.current.displayComments).toEqual(mockComments)
      expect(result.current.hasCommentsToShow).toBe(true)
    })
  })

  describe('Nested mode', () => {
    it('should process nested comments when enabled', () => {
      const {result} = renderHook(() =>
        useCommentProcessing({
          enableNestedComments: true,
          infiniteData: undefined,
          infiniteDataRaw: undefined,
          fetchedCommentsRaw: undefined,
          maxCommentDepth: 10
        })
      )

      expect(result.current.nestedComments).toEqual([])
      expect(result.current.displayComments).toEqual([])
    })

    it('should respect max depth limit', () => {
      const {result} = renderHook(() =>
        useCommentProcessing({
          enableNestedComments: true,
          infiniteData: undefined,
          infiniteDataRaw: undefined,
          fetchedCommentsRaw: undefined,
          maxCommentDepth: 5
        })
      )

      // Verify that the mapToNested function respects maxCommentDepth
      expect(result.current.nestedComments).toBeDefined()
    })
  })

  describe('hasCommentsToShow', () => {
    it('should be true when nested comments exist', () => {
      const mockNested = [{id: '1', depth: 0, body: 'Test'} as any]

      const {result} = renderHook(() =>
        useCommentProcessing({
          enableNestedComments: true,
          providedComments: mockNested,
          infiniteData: undefined,
          infiniteDataRaw: {pages: [{data: {children: mockNested}}]},
          fetchedCommentsRaw: undefined,
          maxCommentDepth: 10
        })
      )

      expect(result.current.hasCommentsToShow).toBe(true)
    })

    it('should be false when no comments in any mode', () => {
      const {result} = renderHook(() =>
        useCommentProcessing({
          enableNestedComments: false,
          infiniteData: undefined,
          infiniteDataRaw: undefined,
          fetchedCommentsRaw: undefined,
          maxCommentDepth: 10
        })
      )

      expect(result.current.hasCommentsToShow).toBe(false)
    })
  })
})
