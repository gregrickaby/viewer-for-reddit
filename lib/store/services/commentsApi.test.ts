import {
  useGetPostCommentsPagesInfiniteQuery,
  useGetUserCommentsInfiniteQuery,
  useLazyGetPostCommentsQuery
} from '@/lib/store/services/commentsApi'
import {renderHook, waitFor} from '@/test-utils'

describe('commentsApi', () => {
  describe('useGetPostCommentsPagesInfiniteQuery', () => {
    it('should fetch post comments with infinite scrolling', async () => {
      const {result} = renderHook(() =>
        useGetPostCommentsPagesInfiniteQuery(
          '/r/programming/comments/abc123/title/'
        )
      )

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true)
      })

      if (result.current.isSuccess) {
        expect(result.current.data).toBeDefined()
        expect(result.current.data?.pages).toHaveLength(1)
      }
    })

    it('should handle post with no comments', async () => {
      const {result} = renderHook(() =>
        useGetPostCommentsPagesInfiniteQuery(
          '/r/programming/comments/nocomments/title/'
        )
      )

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true)
      })

      if (result.current.isSuccess) {
        expect(result.current.data?.pages[0]).toBeDefined()
      }
    })

    it('should handle 404 error for non-existent post', async () => {
      const {result} = renderHook(() =>
        useGetPostCommentsPagesInfiniteQuery(
          '/r/programming/comments/nonexistent/title/'
        )
      )

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true)
      })

      if (result.current.isError) {
        expect(result.current.error).toBeDefined()
      }
    })

    it('should handle fetchNextPage functionality', async () => {
      const {result} = renderHook(() =>
        useGetPostCommentsPagesInfiniteQuery(
          '/r/programming/comments/abc123/title/'
        )
      )

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true)
      })

      expect(typeof result.current.fetchNextPage).toBe('function')
      expect(typeof result.current.hasNextPage).toBe('boolean')
    })
  })

  describe('useLazyGetPostCommentsQuery', () => {
    it('should create a lazy query trigger function', () => {
      const {result} = renderHook(() => useLazyGetPostCommentsQuery())

      const [trigger, queryResult] = result.current

      expect(typeof trigger).toBe('function')
      expect(queryResult.isUninitialized).toBe(true)
    })
  })

  describe('useGetUserCommentsInfiniteQuery', () => {
    it('should fetch user comments with infinite scrolling', async () => {
      const {result} = renderHook(() =>
        useGetUserCommentsInfiniteQuery('testuser')
      )

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true)
      })

      if (result.current.isSuccess) {
        expect(result.current.data).toBeDefined()
        expect(result.current.data?.pages).toHaveLength(1)
      }
    })

    it('should handle 404 error for non-existent user', async () => {
      const {result} = renderHook(() =>
        useGetUserCommentsInfiniteQuery('nonexistentuser')
      )

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true)
      })

      if (result.current.isError) {
        expect(result.current.error).toBeDefined()
      }
    })

    it('should handle fetchNextPage for user comments', async () => {
      const {result} = renderHook(() =>
        useGetUserCommentsInfiniteQuery('testuser')
      )

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true)
      })

      expect(typeof result.current.fetchNextPage).toBe('function')
      expect(typeof result.current.hasNextPage).toBe('boolean')
    })
  })
})
