import {renderHook} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {useFeedRenderer} from './useFeedRenderer'

describe('useFeedRenderer', () => {
  const mockPost = {
    data: {
      id: 'test123',
      title: 'Test Post',
      subreddit: 'test',
      author: 'testuser'
    }
  }

  const baseProps = {
    data: {pages: [{data: {children: [mockPost]}}]},
    isLoading: false,
    isError: false,
    noVisiblePosts: false,
    wasFiltered: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
    loadMoreRef: vi.fn()
  }

  describe('loading state', () => {
    it('should return loading content when isLoading is true', () => {
      const {result} = renderHook(() =>
        useFeedRenderer({...baseProps, isLoading: true})
      )

      expect(result.current.status).toBe('loading')
      expect(result.current.content).toBeDefined()
      expect(result.current.loadMoreSection).toBeNull()
    })
  })

  describe('error state', () => {
    it('should return error content when isError is true', () => {
      const errorContent = <div>Error occurred</div>
      const {result} = renderHook(() =>
        useFeedRenderer({
          ...baseProps,
          isError: true,
          errorContent
        })
      )

      expect(result.current.status).toBe('error')
      expect(result.current.content).toBe(errorContent)
      expect(result.current.loadMoreSection).toBeNull()
    })
  })

  describe('empty state', () => {
    it('should return NSFW message when noVisiblePosts and wasFiltered', () => {
      const {result} = renderHook(() =>
        useFeedRenderer({
          ...baseProps,
          noVisiblePosts: true,
          wasFiltered: true
        })
      )

      expect(result.current.status).toBe('empty')
      expect(result.current.loadMoreSection).toBeNull()
    })

    it('should return custom empty message when provided', () => {
      const customMessage = 'Custom empty message'
      const {result} = renderHook(() =>
        useFeedRenderer({
          ...baseProps,
          noVisiblePosts: true,
          emptyMessage: customMessage
        })
      )

      expect(result.current.status).toBe('empty')
      expect(result.current.loadMoreSection).toBeNull()
    })

    it('should return default empty message when not provided', () => {
      const {result} = renderHook(() =>
        useFeedRenderer({
          ...baseProps,
          noVisiblePosts: true
        })
      )

      expect(result.current.status).toBe('empty')
      expect(result.current.loadMoreSection).toBeNull()
    })
  })

  describe('success state', () => {
    it('should return post content when data is available', () => {
      const {result} = renderHook(() => useFeedRenderer(baseProps))

      expect(result.current.status).toBe('success')
      expect(result.current.content).toBeDefined()
      expect(Array.isArray(result.current.content)).toBe(true)
    })

    it('should handle multiple pages of posts', () => {
      const multiPageData = {
        pages: [{data: {children: [mockPost]}}, {data: {children: [mockPost]}}]
      }

      const {result} = renderHook(() =>
        useFeedRenderer({
          ...baseProps,
          data: multiPageData
        })
      )

      expect(result.current.status).toBe('success')
      expect(Array.isArray(result.current.content)).toBe(true)
    })

    it('should handle posts without data', () => {
      const invalidData = {
        pages: [{data: {children: [{data: null}]}}]
      }

      const {result} = renderHook(() =>
        useFeedRenderer({
          ...baseProps,
          data: invalidData
        })
      )

      expect(result.current.status).toBe('success')
      expect(result.current.content).toBeDefined()
    })
  })

  describe('load more section', () => {
    it('should return null when hasNextPage is false', () => {
      const {result} = renderHook(() =>
        useFeedRenderer({
          ...baseProps,
          hasNextPage: false
        })
      )

      expect(result.current.loadMoreSection).toBeNull()
    })

    it('should return null when wasFiltered is true', () => {
      const {result} = renderHook(() =>
        useFeedRenderer({
          ...baseProps,
          hasNextPage: true,
          wasFiltered: true
        })
      )

      expect(result.current.loadMoreSection).toBeNull()
    })

    it('should return load more section when hasNextPage is true', () => {
      const {result} = renderHook(() =>
        useFeedRenderer({
          ...baseProps,
          hasNextPage: true
        })
      )

      expect(result.current.loadMoreSection).toBeDefined()
      expect(result.current.loadMoreSection).not.toBeNull()
    })

    it('should show loader when isFetchingNextPage is true', () => {
      const {result} = renderHook(() =>
        useFeedRenderer({
          ...baseProps,
          hasNextPage: true,
          isFetchingNextPage: true
        })
      )

      expect(result.current.loadMoreSection).toBeDefined()
    })
  })
})
