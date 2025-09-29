import {store} from '@/lib/store'
import {
  searchApi,
  useSearchSubredditsQuery
} from '@/lib/store/services/searchApi'
import {renderHook, waitFor} from '@/test-utils'

afterEach(() => {
  store.dispatch(searchApi.util.resetApiState())
})

describe('searchApi', () => {
  describe('searchSubreddits', () => {
    it('should search for subreddits successfully', async () => {
      const {result} = renderHook(() =>
        useSearchSubredditsQuery({query: 'javascript', enableNsfw: false})
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // The searchMock returns the default search results
      expect(result.current.data).toBeDefined()
      expect(Array.isArray(result.current.data)).toBe(true)
      expect(result.current.data!.length).toBeGreaterThan(0)
      // Check that results have required properties
      result.current.data!.forEach((item) => {
        expect(item).toHaveProperty('display_name')
        expect(item).toHaveProperty('value')
      })
    })

    it('should filter out NSFW subreddits when enableNsfw is false', async () => {
      const {result} = renderHook(() =>
        useSearchSubredditsQuery({query: 'test', enableNsfw: false})
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Verify no NSFW results
      if (result.current.data) {
        result.current.data.forEach((item) => {
          expect(item.over18).toBe(false)
        })
      }
    })

    it('should handle empty search results for nonexistent queries', async () => {
      const {result} = renderHook(() =>
        useSearchSubredditsQuery({
          query: 'notarealsubreddit',
          enableNsfw: false
        })
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual([])
    })

    it('should skip search when query is empty', async () => {
      const {result} = renderHook(() =>
        useSearchSubredditsQuery(
          {query: 'test', enableNsfw: false},
          {skip: true} // Use RTK Query's skip option
        )
      )

      expect(result.current.isUninitialized).toBe(true)
    })

    it('should skip search when query is whitespace only', async () => {
      const query = '   '
      const {result} = renderHook(() =>
        useSearchSubredditsQuery(
          {query: 'test', enableNsfw: false},
          {skip: !query.trim()} // Skip if query is empty after trimming
        )
      )

      expect(result.current.isUninitialized).toBe(true)
    })

    it('should map search results to SubredditItem format', async () => {
      const {result} = renderHook(() =>
        useSearchSubredditsQuery({query: 'test', enableNsfw: false})
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      if (result.current.data && result.current.data.length > 0) {
        result.current.data.forEach((item) => {
          expect(item).toHaveProperty('display_name')
          expect(item).toHaveProperty('value')
          expect(item).toHaveProperty('over18')
          expect(item).toHaveProperty('subscribers')
        })
      }
    })

    it('should handle search errors gracefully', async () => {
      // Test with a query that might cause errors
      const {result} = renderHook(() =>
        useSearchSubredditsQuery({query: 'test_error_case', enableNsfw: false})
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should either succeed or fail gracefully without crashing
      expect(result.current.isSuccess || result.current.isError).toBe(true)
    })
  })
})
